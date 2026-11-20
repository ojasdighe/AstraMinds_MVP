/**
 * AstraBot Agentic Chat — LangGraph StateGraph
 *
 * Graph topology:
 *
 *   [START]
 *      │
 *      ▼
 *  classifyIntent          Lightweight classifier — decides which tool to call
 *      │
 *      ▼  (conditional edge)
 *  ┌───────────────────────────────────────────┐
 *  │  goals        │  tracker   │  safety      │
 *  │  curriculum   │  out_scope │              │
 *  └───────────────────────────────────────────┘
 *      │
 *      ▼
 *  toolNode               Fetches structured data for the detected intent
 *      │
 *      ▼
 *  synthesizeReply        Composes the final kid-friendly answer with Gemini
 *      │
 *      ▼
 *   [END]
 *
 * Benefits over the old monolithic single-shot call:
 *  • Only the data relevant to the question is loaded — no 2 KB context dump
 *    for a simple "what is opportunity cost?" question
 *  • Each node is independently testable
 *  • Adding new tools (e.g. leaderboard queries) = one new node + one edge
 *  • Out-of-scope questions are hard-refused before ever reaching Gemini
 *  • Full conversation history flows through graph state
 */

import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import {
    store,
    getActiveStreak,
    getUserNetCashFlow,
    todayIso,
    daysBetweenIso,
    xpForLevel,
} from './store.js';

// ── Intent types ──────────────────────────────────────────────────────────────
type Intent = 'goals' | 'tracker' | 'safety' | 'curriculum' | 'gamification' | 'out_of_scope';

// ── Graph state ───────────────────────────────────────────────────────────────
const AgentState = Annotation.Root({
    // inputs
    userId:      Annotation<number>(),
    userMessage: Annotation<string>(),
    history:     Annotation<Array<{ role: string; text: string }>>(),

    // internal
    intent:      Annotation<Intent>(),
    toolData:    Annotation<string>(),   // structured context for the detected intent

    // output
    reply:       Annotation<string>(),
    fallback:    Annotation<boolean>(),
});

type State = typeof AgentState.State;

// ── LLM factory ───────────────────────────────────────────────────────────────
function getLLM(temperature = 0.4) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    return new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        apiKey,
        temperature,
        maxRetries: 3,
    });
}

// ── SYSTEM PROMPT (shared across nodes that call Gemini) ──────────────────────
const BASE_SYSTEM = `You are AstraBot, the friendly AI Money Mentor inside AstraMinds — a financial literacy app for kids and tweens aged 8–14 in India.

STRICT SCOPE: Only answer about saving money, pocket money, Needs vs. Wants, earning (chores/tasks), budgeting basics, digital money safety (OTPs, PINs, scams, UPI), and the user's own AstraMinds data. For anything outside this scope reply ONLY: "That's outside what I can help with! I'm AstraBot, your money mentor for ages 8–14. Ask me about saving, pocket money, budgeting, or staying safe online. 😊"

PROHIBITIONS: Never recommend adult products (stocks, crypto, credit cards, loans). Never invent numbers — use only the data provided. Never share OTPs/PINs. Never answer medical, legal, homework, sports, entertainment, or general knowledge questions.

STYLE: Simple warm language for 8–14 year olds. Short answers (2–4 sentences). Use ₹ for amounts. Indian examples. One relevant emoji per response.`;

// ════════════════════════════════════════════════════════════════════════════
// NODE 1 — classifyIntent
// A cheap, fast classifier that decides which tool to invoke.
// Uses a small focused prompt — no user data loaded yet.
// ════════════════════════════════════════════════════════════════════════════
async function classifyIntent(state: State): Promise<Partial<State>> {
    const msg = state.userMessage.toLowerCase();

    // Fast keyword pre-classification — avoids an LLM call for obvious cases
    const goalsKw    = ['goal', 'saving', 'save', 'target', 'jar', 'bicycle', 'auto-save', 'streak', 'piggy'];
    const trackerKw  = ['spent', 'spend', 'expense', 'purchase', 'bought', 'budget', 'tracker', 'pocket money', 'balance', 'transaction', 'category'];
    const safetyKw   = ['otp', 'pin', 'cvv', 'scam', 'phishing', 'password', 'in-game', 'free gems', 'trial', 'upi', 'safe', 'hack', 'link', 'fake', '2fa'];
    const gamifKw    = ['xp', 'level', 'coin', 'leaderboard', 'badge', 'reward', 'spin', 'quiz', 'challenge', 'shop'];
    const curriculumKw = ['what is', 'explain', 'difference', 'mean', 'opportunity cost', 'interest', 'compound', 'need', 'want', 'profit', 'income', 'budget', '24-hour', 'three jar', 'save spend share'];
    const outKw      = ['homework', 'cricket', 'movie', 'celebrity', 'recipe', 'weather', 'news', 'exam', 'stock', 'crypto', 'mutual fund', 'politics', 'religion'];

    if (outKw.some(k => msg.includes(k))) return { intent: 'out_of_scope' };
    if (safetyKw.some(k => msg.includes(k))) return { intent: 'safety' };
    if (goalsKw.some(k => msg.includes(k))) return { intent: 'goals' };
    if (trackerKw.some(k => msg.includes(k))) return { intent: 'tracker' };
    if (gamifKw.some(k => msg.includes(k))) return { intent: 'gamification' };
    if (curriculumKw.some(k => msg.includes(k))) return { intent: 'curriculum' };

    // Fallback: ask the LLM to classify
    try {
        const llm = getLLM(0);
        const response = await llm.invoke([
            new SystemMessage(
                `Classify the following question from a child (aged 8–14) into exactly one of these categories:
goals        — about savings goals, saving money, streaks, auto-save
tracker      — about spending, pocket money balance, expenses, budget
safety       — about online safety, OTPs, PINs, scams, in-game purchases
curriculum   — general financial literacy question (what is X, explain Y)
gamification — about XP, coins, level, leaderboard, rewards, shop
out_of_scope — anything not related to personal finance for kids

Reply with ONLY the category word, no explanation.`
            ),
            new HumanMessage(state.userMessage),
        ]);
        const raw = String(response.content).trim().toLowerCase();
        const valid: Intent[] = ['goals', 'tracker', 'safety', 'curriculum', 'gamification', 'out_of_scope'];
        const matched = valid.find(v => raw.includes(v));
        return { intent: matched ?? 'curriculum' };
    } catch {
        return { intent: 'curriculum' };
    }
}

// ════════════════════════════════════════════════════════════════════════════
// NODE 2 — toolNode
// Loads only the data slice relevant to the detected intent.
// Returns a compact, structured string that gets injected into the final prompt.
// ════════════════════════════════════════════════════════════════════════════
async function toolNode(state: State): Promise<Partial<State>> {
    const { userId, intent } = state;
    const user = store.users.find(u => u.id === userId);
    if (!user) return { toolData: 'User data unavailable.' };

    const today = todayIso();

    switch (intent) {

        case 'goals': {
            const goals = store.goals.filter(g => g.user_id === userId);
            if (goals.length === 0) return { toolData: 'User has no savings goals yet.' };
            const lines = goals.map(g => {
                const target = Number(g.target_amount || 0);
                const saved  = Number(g.saved_amount  || 0);
                const pct    = target > 0 ? ((saved / target) * 100).toFixed(1) : '0.0';
                const daysLeft = g.current_completion_date ? daysBetweenIso(g.current_completion_date, today) : null;
                const autoSave = store.goalAutoSavings.find(a => a.goal_id === g.id);
                return [
                    `Goal: "${g.name}" [${g.status}]`,
                    `  Target: ₹${target.toLocaleString('en-IN')} | Saved: ₹${saved.toLocaleString('en-IN')} (${pct}%) | Still needed: ₹${Math.max(0, target - saved).toLocaleString('en-IN')}`,
                    daysLeft != null ? `  Days left: ${daysLeft}` : '',
                    autoSave ? `  Auto-save: ₹${Number(autoSave.amount).toLocaleString('en-IN')} / ${autoSave.frequency}` : '',
                ].filter(Boolean).join('\n');
            });
            const streak = getActiveStreak(user);
            return { toolData: `Streak: ${streak} days\n\n${lines.join('\n\n')}` };
        }

        case 'tracker': {
            const all = store.trackerTransactions
                .filter(t => t.user_id === userId)
                .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
            const balance = getUserNetCashFlow(userId);
            const income  = all.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
            const expense = all.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
            const catMap: Record<string, number> = {};
            all.filter(t => t.type === 'EXPENSE').forEach(t => {
                const c = t.category_name || 'Other';
                catMap[c] = (catMap[c] || 0) + Number(t.amount);
            });
            const topCats = Object.entries(catMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([c, v]) => `  ${c}: ₹${v.toLocaleString('en-IN')}`)
                .join('\n');
            const recent = all.slice(0, 5).map(t =>
                `  ${t.transaction_date} ${t.type} ₹${Number(t.amount).toLocaleString('en-IN')} — ${t.category_name || 'Other'}: ${t.merchant || t.description || ''}`
            ).join('\n');
            return {
                toolData: [
                    `Pocket money balance: ₹${balance.toLocaleString('en-IN')}`,
                    `Total received: ₹${income.toLocaleString('en-IN')} | Total spent: ₹${expense.toLocaleString('en-IN')}`,
                    `Top spending categories:\n${topCats || '  None yet'}`,
                    `Recent entries:\n${recent || '  None yet'}`,
                ].join('\n'),
            };
        }

        case 'gamification': {
            const streak = getActiveStreak(user);
            return {
                toolData: [
                    `Level: ${user.level} | XP: ${user.xp} / ${xpForLevel(user.level)}`,
                    `Coins: ${user.coins} | Streak: ${streak} days | Streak shields: ${user.streak_shields}`,
                    `Total saved across all goals: ₹${store.goals.filter(g => g.user_id === userId).reduce((s, g) => s + Number(g.saved_amount || 0), 0).toLocaleString('en-IN')}`,
                ].join('\n'),
            };
        }

        case 'safety':
        case 'curriculum':
            // No store data needed — curriculum Q&A and safety answers are grounded
            // in the system prompt and the model's training on the AstraMinds books.
            return { toolData: '' };

        case 'out_of_scope':
            return { toolData: '' };

        default:
            return { toolData: '' };
    }
}

// ════════════════════════════════════════════════════════════════════════════
// NODE 3a — refuseNode  (out_of_scope shortcut, no LLM call)
// ════════════════════════════════════════════════════════════════════════════
async function refuseNode(state: State): Promise<Partial<State>> {
    return {
        reply: "That's outside what I can help with! I'm AstraBot, your money mentor for ages 8–14. Ask me about saving goals, pocket money, budgeting, or staying safe online. 😊",
        fallback: false,
    };
}

// ════════════════════════════════════════════════════════════════════════════
// NODE 3b — synthesizeReply
// Composes the final answer, injecting only the relevant toolData slice.
// ════════════════════════════════════════════════════════════════════════════
async function synthesizeReply(state: State): Promise<Partial<State>> {
    try {
        const llm = getLLM(0.5);

        const systemContent = state.toolData
            ? `${BASE_SYSTEM}\n\n══ USER DATA (use as source of truth — do not invent numbers) ══\n${state.toolData}`
            : BASE_SYSTEM;

        const messages: BaseMessage[] = [new SystemMessage(systemContent)];

        // Inject last 6 turns of history for context
        for (const h of state.history.slice(-6)) {
            if (h.role === 'user')  messages.push(new HumanMessage(h.text));
            else                    messages.push(new AIMessage(h.text));
        }
        messages.push(new HumanMessage(state.userMessage));

        const response = await llm.invoke(messages);
        const reply = String(response.content).trim();
        if (reply) return { reply, fallback: false };
    } catch (err) {
        console.warn('[AstraBot agent] synthesizeReply error:', err);
    }

    // Hard fallback — keyword-based reply
    return {
        reply: "I'm having a little trouble right now. Try asking me about your savings goal or pocket money balance! 🌟",
        fallback: true,
    };
}

// ════════════════════════════════════════════════════════════════════════════
// GRAPH ASSEMBLY
// ════════════════════════════════════════════════════════════════════════════
function routeAfterClassify(state: State): string {
    return state.intent === 'out_of_scope' ? 'refuse' : 'tool';
}

function buildAstraBotGraph() {
    const graph = new StateGraph(AgentState)
        .addNode('classify', classifyIntent)
        .addNode('tool',     toolNode)
        .addNode('refuse',   refuseNode)
        .addNode('synthesize', synthesizeReply)
        .addEdge(START, 'classify')
        .addConditionalEdges('classify', routeAfterClassify, {
            tool:   'tool',
            refuse: 'refuse',
        })
        .addEdge('tool',    'synthesize')
        .addEdge('refuse',  END)
        .addEdge('synthesize', END);

    return graph.compile();
}

// Compile once at module load — avoids re-compiling on every request
let _graph: ReturnType<typeof buildAstraBotGraph> | null = null;
function getGraph() {
    if (!_graph) _graph = buildAstraBotGraph();
    return _graph;
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API — drop-in replacement for the old generateChatReply
// ════════════════════════════════════════════════════════════════════════════
export async function runAstraBotAgent(
    userId: number,
    userMessage: string,
    history: Array<{ role: string; text: string }>
): Promise<{ reply: string; fallback?: boolean }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // No API key — fall through to the existing keyword fallback in gemini.ts
        return { reply: '', fallback: true };
    }

    try {
        const graph  = getGraph();
        const result = await graph.invoke({ userId, userMessage, history, intent: 'curriculum', toolData: '', reply: '', fallback: false });
        if (result.reply) return { reply: result.reply, fallback: result.fallback ?? false };
    } catch (err) {
        console.warn('[AstraBot agent] graph error:', err);
    }

    return { reply: '', fallback: true };
}
