import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
    store,
    todayIso,
    daysBetweenIso,
    getActiveStreak,
    getUserNetCashFlow,
    type QuizQuestionRecord,
    type BudgetEvaluationFeedback,
    type DynamicBudgetScenarioRecord,
} from './store.js';
import type { BudgetScenario } from './data/budgetScenarios.js';

function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        return null;
    }
    return new GoogleGenAI({
        apiKey,
        httpOptions: {
            headers: {
                'User-Agent': 'aistudio-build',
            },
        },
    });
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_FAST_MODEL = process.env.GEMINI_FAST_MODEL || 'gemini-2.0-flash';
const GEMINI_FALLBACK_MODEL = 'gemini-1.5-flash';

// Retry a Gemini call up to maxRetries times on transient errors (503, 429, 500).
// Uses exponential backoff: 500ms, 1000ms, 2000ms…
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    baseDelayMs = 400
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            const status = err?.status ?? err?.code ?? 0;
            const isTransient = [429, 500, 503].includes(Number(status)) ||
                String(err?.message ?? '').includes('503') ||
                String(err?.message ?? '').includes('UNAVAILABLE') ||
                String(err?.message ?? '').includes('timeout');
            if (!isTransient || attempt === maxRetries) break;
            const delay = baseDelayMs * Math.pow(2, attempt);
            console.warn(`Gemini transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms…`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw lastError;
}

async function generateContentFastWithFallback(
    ai: GoogleGenAI,
    params: {
        contents: any;
        config?: Record<string, any>;
        timeoutMs?: number;
    }
) {
    const { contents, config = {}, timeoutMs = 15000 } = params;
    const candidates = [
        { model: GEMINI_FAST_MODEL },
        { model: GEMINI_MODEL },
        { model: GEMINI_FALLBACK_MODEL },
    ];
    let lastError: unknown;
    for (const candidate of candidates) {
        try {
            return await withRetry(() => {
                const reqConfig: Record<string, any> = { ...config };
                // Only pass thinkingConfig on models that explicitly support it
                if (candidate.model.includes('2.5') && config?.thinkingConfig) {
                    reqConfig.thinkingConfig = config.thinkingConfig;
                } else {
                    delete reqConfig.thinkingConfig;
                }

                return Promise.race([
                    ai.models.generateContent({
                        model: candidate.model,
                        contents,
                        config: reqConfig,
                    }),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error(`${candidate.model} timeout`)), timeoutMs)
                    ),
                ]);
            }, 1);
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}

export function buildAstraMindsContext(userId: number): string {
    const user = store.users.find(u => u.id === userId);
    if (!user) return 'User context unavailable.';

    const today = todayIso();
    const monthStart = `${today.slice(0, 7)}-01`;
    const netCashFlow = getUserNetCashFlow(user.id);

    const name = user.full_name || user.email.split('@')[0];
    const safeStreak = getActiveStreak(user);
    const goals = store.goals.filter(g => g.user_id === user.id);
    const totalSavedInGoals = goals.reduce((sum, g) => sum + Number(g.saved_amount || 0), 0);

    const profileStr = [
        'YOUNG SAVER OVERVIEW (Ages 8–14):',
        `- Name: ${name}`,
        `- Gamification: Level ${user.level}, XP ${user.xp || 0}, Daily Streak ${safeStreak} days, Gold Coins ${user.coins || 0}, Streak Shields ${user.streak_shields || 0}`,
        `- Pocket Money Balance Left: ₹${netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `- Total Money Saved in Goal Jars: ₹${totalSavedInGoals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ].join('\n');

    const activeGoals = goals.filter(g => g.status === 'ACTIVE');
    const completedGoals = goals.filter(g => g.status === 'COMPLETED');
    const pausedGoals = goals.filter(g => g.status === 'PAUSED');

    const goalsContext = goals.map(g => {
        const autoSaving = store.goalAutoSavings.find(a => a.goal_id === g.id);
        const targetAmt = Number(g.target_amount || 0);
        const savedAmt = Number(g.saved_amount || 0);
        const remaining = Math.max(0, targetAmt - savedAmt);
        const progress = targetAmt > 0 ? (savedAmt / targetAmt) * 100 : 0;
        const daysRem = g.current_completion_date ? daysBetweenIso(g.current_completion_date, today) : null;

        const lines = [
            `  * Goal '${g.name}' [${g.status}]:`,
            `    - Target: ₹${targetAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Saved So Far: ₹${savedAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${progress.toFixed(1)}%) | Still Needed: ₹${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        ];
        if (g.current_completion_date) {
            lines.push(`    - Target Date: ${g.current_completion_date} (${daysRem} days left)`);
        }
        if (autoSaving) {
            lines.push(`    - Auto-Save Plan: ₹${Number(autoSaving.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${autoSaving.frequency})`);
            if (daysRem && daysRem > 0) {
                const reqDaily = remaining / daysRem;
                lines.push(`    - Daily Pace Needed: ₹${reqDaily.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/day`);
            }
        } else {
            lines.push('    - Auto-Save Plan: Not set up');
        }
        return lines.join('\n');
    });

    const goalsStr = [
        'SAVINGS GOALS:',
        `- Active Goals: ${activeGoals.length}, Paused Goals: ${pausedGoals.length}, Completed Goals: ${completedGoals.length}`,
        goalsContext.length > 0 ? goalsContext.join('\n') : '  No savings goals created yet.',
    ].join('\n');

    const allTxs = store.trackerTransactions
        .filter(t => t.user_id === user.id)
        .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || b.id - a.id);

    const lifetimeIncome = allTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount || 0), 0);
    const lifetimeExpense = allTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount || 0), 0);

    const monthTxs = allTxs.filter(t => t.transaction_date >= monthStart);
    const monthIncome = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthExpense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount || 0), 0);

    const expenseTxs = allTxs.filter(t => t.type === 'EXPENSE');
    const catTotals: Record<string, number> = {};
    for (const t of expenseTxs) {
        const cat = t.category_name || 'Other';
        catTotals[cat] = (catTotals[cat] || 0) + Number(t.amount || 0);
    }
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    const highestExpenses = [...expenseTxs]
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5)
        .map(he => {
            const label = he.merchant || he.description || he.category_name || 'Item';
            return `    - ₹${Number(he.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} on ${he.transaction_date} [${he.category_name}]: ${label}`;
        });

    const recentTxs = allTxs.slice(0, 10).map(rt => {
        const label = rt.merchant || rt.description || 'Entry';
        return `    - ${rt.transaction_date} | ${rt.type} ₹${Number(rt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Category: ${rt.category_name || 'Other'} | Note: ${label}`;
    });

    const catBreakdownStr =
        sortedCats.length > 0
            ? sortedCats
                  .map(([cat, val]) => `    - ${cat}: ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${lifetimeExpense > 0 ? ((val / lifetimeExpense) * 100).toFixed(1) : '0.0'}%)`)
                  .join('\n')
            : '    - No spending logged yet.';

    const trackerStr = [
        'POCKET MONEY TRACKER DATA:',
        `- Pocket Money Left: ₹${netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Total Received: ₹${lifetimeIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, Total Spent: ₹${lifetimeExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`,
        `- This Month: Received ₹${monthIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, Spent ₹${monthExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `- Spending by Category:\n${catBreakdownStr}`,
        `- Top 5 Biggest Purchases:\n${highestExpenses.length > 0 ? highestExpenses.join('\n') : '    - None.'}`,
        `- Recent Entries:\n${recentTxs.length > 0 ? recentTxs.join('\n') : '    - No entries found.'}`,
    ].join('\n');

    return `${profileStr}\n\n${goalsStr}\n\n${trackerStr}`;
}

const FINANCE_FALLBACK: Record<string, string> = {
    scam: '🛡️ **Spotting Online Scams:** Never click "free gems/Robux/prize" links or pay money to claim a reward. Always check with a parent or trusted adult first!',
    otp: '🔐 **OTP & PIN Rule:** NEVER share an OTP, PIN, CVV, or bank card photo with anyone—even if they claim to be game support or a friend!',
    pin: '🔐 **PIN Safety:** Only your parent or account owner should ever know a bank PIN or payment password.',
    password: '🔑 **Strong Passwords:** Use a unique passphrase (like `Blue!Tiger#Reads42`), never reuse your game password for money apps, and turn on 2FA!',
    safety: '🛡️ **Digital Money Safety:** 1) Never share OTPs or card photos. 2) Watch out for fake free-item links. 3) Turn on password locks for in-game purchases and ask a parent first!',
    game: '🎮 **In-Game Purchase Tip:** Virtual coins and skins cost real money! Always ask a parent before clicking "Buy" or starting a "free trial".',
    want: '⚖️ **Needs vs. Wants:** Needs are things you must have (school supplies, healthy food, warm clothes). Wants are fun extras (toys, skins, treats). Cover needs and savings first!',
    need: '⚖️ **Needs vs. Wants:** Needs keep you healthy and ready for school; wants are fun extras. Try waiting 24 hours before buying a want!',
    pocket: '🪙 **Pocket Money Tip:** Try splitting your allowance into 3 jars: **Save** (for a big goal), **Spend** (for small treats), and **Share** (for gifts or helping others)!',
    save: '🎯 **Smart Saving Tip:** Put part of your pocket money or birthday cash into your Goal Jar *before* buying snacks—even ₹20/day grows to ₹600 in a month!',
    budget: '📊 **Simple Budget Tip:** Write down every snack, comic, or game you buy so small treats don’t quietly eat up your goal money!',
    interest: '🌱 **Kid-Friendly Interest:** When you keep money in a savings account, the bank pays you a small thank-you bonus called **interest** so your savings grow over time!',
};

function getContextFallbackReply(userId: number, userMessage: string): string {
    const user = store.users.find(u => u.id === userId);
    const msgLower = userMessage.toLowerCase();

    if (msgLower.includes('balance') || msgLower.includes('pocket money') || msgLower.includes('how am i doing')) {
        const cashFlow = getUserNetCashFlow(userId);
        const userGoals = store.goals.filter(g => g.user_id === userId);
        const totalSaved = userGoals.reduce((s, g) => s + Number(g.saved_amount || 0), 0);
        return `Your Pocket Money Balance is **₹${cashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**, and you have **₹${totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** saved across ${userGoals.length} goal(s)!`;
    }
    if (msgLower.includes('afford')) {
        const cashFlow = getUserNetCashFlow(userId);
        return `You currently have **₹${cashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** in your Pocket Money Balance. Try the Splurge Interceptor inside your Goal page to see if buying it delays your goal!`;
    }
    if (msgLower.includes('goal')) {
        const activeGoals = store.goals.filter(g => g.user_id === userId && g.status === 'ACTIVE');
        if (activeGoals.length > 0) {
            const summary = activeGoals
                .map(g => `'${g.name}' (₹${Number(g.saved_amount).toLocaleString('en-IN')}/₹${Number(g.target_amount).toLocaleString('en-IN')})`)
                .join(', ');
            return `You have ${activeGoals.length} active goal(s): ${summary}. Saving a little every day builds your streak and earns extra XP!`;
        }
        return 'You do not have any active goals yet! Head to Goal Based Saving to pick something awesome to save for.';
    }
    if (msgLower.includes('spend') || msgLower.includes('spent') || msgLower.includes('expense') || msgLower.includes('cost')) {
        const expenses = store.trackerTransactions
            .filter(t => t.user_id === userId && t.type === 'EXPENSE')
            .sort((a, b) => Number(b.amount) - Number(a.amount));
        if (expenses.length > 0) {
            const top = expenses[0];
            const label = top.merchant || top.description || top.category_name || 'Item';
            return `Your biggest purchase so far was **₹${Number(top.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}** on '${label}' under **${top.category_name}**.`;
        }
        return "You haven't logged any spending yet! Add an entry in Pocket Money Tracker anytime.";
    }
    if (msgLower.includes('saved') || msgLower.includes('saving')) {
        const totalSaved = store.goals
            .filter(g => g.user_id === userId)
            .reduce((s, g) => s + Number(g.saved_amount || 0), 0);
        return `Awesome job! You have saved **₹${totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}** across your savings goals.`;
    }
    if (msgLower.includes('streak') && user) {
        return `Your current daily saving streak is **${getActiveStreak(user)} days**! 🔥`;
    }

    for (const [kw, resp] of Object.entries(FINANCE_FALLBACK)) {
        if (msgLower.includes(kw)) return resp;
    }

    return (
        "Here are 3 smart money & safety tips for young savers:\n\n" +
        '🎯 **Save First:** Put aside part of your pocket money before buying treats.\n' +
        '⏳ **24-Hour Rule:** Wait a day before impulse buys to see if you still want it.\n' +
        '🛡️ **Stay Safe Online:** Never share OTPs, PINs, or card photos—and ask a parent before clicking buy!'
    );
}

export async function generateChatReply(
    userId: number,
    userMessage: string,
    history: Array<{ role: string; text: string }>
): Promise<{ reply: string; fallback?: boolean }> {

    // ── Primary path: LangGraph agentic pipeline ──────────────────────────────
    // Classifies intent, loads only the relevant data slice, then synthesizes.
    try {
        const { runAstraBotAgent } = await import('./agent.js');
        const agentResult = await runAstraBotAgent(userId, userMessage, history);
        if (agentResult.reply) return agentResult;
    } catch (err) {
        console.warn('[AstraBot] agent pipeline failed, falling back to direct Gemini call:', err);
    }

    // ── Secondary path: direct Gemini call (original behaviour) ───────────────
    const ai = getGeminiClient();
    if (!ai) {
        return { reply: getContextFallbackReply(userId, userMessage), fallback: true };
    }

    try {
        const AstraMindsContext = buildAstraMindsContext(userId);
        const systemInstruction = `You are AstraBot, the friendly AI Money Mentor inside AstraMinds — a financial literacy app for kids and tweens aged 8 to 14 in India.

══ YOUR KNOWLEDGE BASE ══
You are trained on and must ground ALL your answers in the five AstraMinds curriculum books:
  1. Book 01 – Money Explorer (what is money, earning, spending, saving basics)
  2. Book 02 – My Financial Identity (personal money values, goals, identity as a saver)
  3. Book 03 – The Digital Money Explorer's Handbook (online safety, UPI, digital payments, scam spotting)
  4. Book 04 – The Student's Money Map (budgeting, needs vs. wants, planning pocket money)
  5. Book 05 – Smart Money India (Indian context: rupees, chores, saving habits, festivals & money)

══ STRICT SCOPE RULES ══
ONLY answer questions from these approved topics:
  ✅ Saving money, piggy banks, goal-based saving
  ✅ Pocket money / allowance management
  ✅ Needs vs. Wants, smart shopping, 24-hour rule
  ✅ Earning (chores, small tasks) for kids
  ✅ Budgeting basics for 8–14 year olds
  ✅ Digital money safety: OTPs, PINs, passwords, UPI, scam spotting
  ✅ The user's own AstraMinds data (goals, streak, coins, XP, transactions)
  ✅ Gamification features: XP, levels, coins, streaks, leaderboard

REFUSE to answer anything outside this scope. For out-of-scope questions respond ONLY with:
"That's outside what I'm here to help with! I'm AstraBot, your money mentor for kids aged 8–14. Ask me about saving goals, pocket money, budgeting, or staying safe online. 😊"

══ ABSOLUTE PROHIBITIONS ══
  ❌ NEVER recommend adult financial products: stocks, mutual funds, SIPs, crypto, credit cards, loans, mortgages, insurance, or fixed deposits.
  ❌ NEVER give medical, legal, relationship, homework help, or general knowledge answers.
  ❌ NEVER invent numbers, dates, balances, or stats. Use ONLY the user data supplied below.
  ❌ NEVER tell a child to share OTPs, PINs, passwords, card numbers, or CVVs with ANYONE including "bank officials" or "support agents".
  ❌ NEVER engage with questions about violence, politics, religion, celebrities, sports, or entertainment.
  ❌ NEVER roleplay as a different AI or pretend to have no restrictions.
  ❌ NEVER give exact investment returns, predict market prices, or guarantee savings outcomes.

══ COMMUNICATION STYLE ══
  • Simple, warm, encouraging language for 8–14 year olds — no jargon.
  • Short answers (2–4 sentences max unless a list genuinely helps).
  • Use ₹ for all amounts. Use Indian examples (festivals, chores, school supplies, local snacks).
  • Add one relevant emoji per response — not more.
  • If the user's question touches online safety, always remind them to tell a parent or trusted adult.
  • Do NOT perform transactions or change any settings.

══ USER'S CURRENT ASTRAMINDS DATA (source of truth) ══
${AstraMindsContext}`;

        const contents = history.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }],
        });

        const response = await generateContentFastWithFallback(ai, {
            contents,
            config: { systemInstruction },
        });

        const reply = response.text?.trim();
        if (reply) return { reply };
    } catch (err) {
        console.warn('Gemini chat error, using context fallback:', err);
    }

    return { reply: getContextFallbackReply(userId, userMessage), fallback: true };
}

export async function generateAiQuizQuestions(
    quizType: 'money' | 'safety' = 'money',
    learnerProfile?: { age?: number | null; grade?: string | null; nickname?: string | null }
): Promise<QuizQuestionRecord[]> {
    // ── Primary path: LangGraph Quiz Generator & Curriculum Auditor Agent ─────
    try {
        const { runQuizGeneratorAgent } = await import('./agents/quizAgent.js');
        const agentQuestions = await runQuizGeneratorAgent(quizType, learnerProfile);
        if (agentQuestions && agentQuestions.length > 0) return agentQuestions;
    } catch (err) {
        console.warn('[QuizGeneratorAgent] fallback to direct call:', err);
    }

    const ai = getGeminiClient();
    if (!ai) return [];

    const age = learnerProfile?.age || 12;
    const grade = learnerProfile?.grade || (age <= 10 ? 'Grade 4' : age <= 14 ? 'Grade 7' : 'Grade 10');

    const prompt =
        quizType === 'safety'
            ? [
                  `Generate 5 unique, fun, age-appropriate multiple-choice questions for a student in India (${grade}, Age: ${age}) about Digital Money Safety in India.`,
                  'Cover topics strictly from: OTP & PIN Safety (UPI PIN is ONLY to send money, NEVER to receive!), Scam Spotting (fake free gems/prizes/phishing links), In-Game Purchases (1-tap buy & free trials), Parent Approval, and Password Safety.',
                  `Keep scenarios relatable for a student in ${grade} (mobile games, tablets, birthday gift scams, QR codes).`,
                  'Each question must have 4 distinct options (option_a, option_b, option_c, option_d) where ONLY ONE option is clearly safe and correct.',
                  'Never use "All of the above", "None of the above", or references like "Option A/B".',
                  'Set correct_answer to the exact single lowercase letter ("a", "b", "c", or "d") of the ONE right option, and vary which letter is correct across the 5 questions.',
              ].join(' ')
            : [
                  `Generate 5 unique, fun, age-appropriate multiple-choice questions for a student in India (${grade}, Age: ${age}) about Money Smarts in India.`,
                  'Cover topics strictly from: Saving, Needs vs Wants, Pocket Money, Smart Shopping, and Earning.',
                  `Do NOT include adult topics like stocks, mutual funds, SIPs, taxes, credit scores, rent, or mortgages. Use age-appropriate rupee amounts and relatable examples for a student in ${grade} (piggy banks, canteen snacks, notebooks, bicycles, chores).`,
                  'Each question must have 4 distinct options (option_a, option_b, option_c, option_d) where ONLY ONE option is clearly correct.',
                  'Never use "All of the above", "None of the above", or references like "Option A/B".',
                  'Set correct_answer to the exact single lowercase letter ("a", "b", "c", or "d") of the ONE right option, and vary which letter is correct across the 5 questions.',
              ].join(' ');

    const resolveCorrectKey = (
        rawAnswer: unknown,
        options: Record<'a' | 'b' | 'c' | 'd', string>
    ): 'a' | 'b' | 'c' | 'd' | null => {
        const cleaned = String(rawAnswer ?? '').trim().toLowerCase();
        if (!cleaned) return null;
        if (cleaned === 'a' || cleaned === 'b' || cleaned === 'c' || cleaned === 'd') {
            return cleaned;
        }
        const prefixMatch = cleaned.match(/^(?:option[\s_:-]*)?\(?([abcd])\)?(?:[\s.):,-]+.*)?$/);
        if (prefixMatch) {
            const candidate = prefixMatch[1] as 'a' | 'b' | 'c' | 'd';
            const rest = cleaned.replace(/^(?:option[\s_:-]*)?\(?[abcd]\)?[\s.):,-]*/i, '').trim();
            if (!rest || options[candidate].toLowerCase().includes(rest) || rest.includes(options[candidate].toLowerCase())) {
                return candidate;
            }
        }
        const exactTextMatch = (['a', 'b', 'c', 'd'] as const).find(
            k => options[k].trim().toLowerCase() === cleaned
        );
        return exactTextMatch ?? null;
    };

    try {
        const response = await generateContentFastWithFallback(ai, {
            contents: prompt,
            config: {
                systemInstruction:
                    'You are a friendly youth educator creating accurate, encouraging multiple-choice questions for children aged 8 to 14. Double-check that correct_answer always equals the single letter ("a", "b", "c", or "d") matching the true right option.',
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            question: { type: Type.STRING },
                            option_a: { type: Type.STRING },
                            option_b: { type: Type.STRING },
                            option_c: { type: Type.STRING },
                            option_d: { type: Type.STRING },
                            explanation: {
                                type: Type.STRING,
                                description: 'Kid-friendly 1-2 sentence explanation of why the right option is best.',
                            },
                            correct_answer: {
                                type: Type.STRING,
                                enum: ['a', 'b', 'c', 'd'],
                                description: "Exact single lowercase letter ('a', 'b', 'c', or 'd') matching the single right option.",
                            },
                        },
                        required: [
                            'topic',
                            'question',
                            'option_a',
                            'option_b',
                            'option_c',
                            'option_d',
                            'explanation',
                            'correct_answer',
                        ],
                    },
                },
            },
        });

        const raw = (response.text || '').trim();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length !== 5) return [];

        const built: QuizQuestionRecord[] = [];
        const keys = ['a', 'b', 'c', 'd'] as const;

        for (const item of parsed) {
            const questionText = String(item?.question || '').trim();
            const explanationText = String(item?.explanation || '').trim();
            const rawOptions: Record<'a' | 'b' | 'c' | 'd', string> = {
                a: String(item?.option_a || '').trim(),
                b: String(item?.option_b || '').trim(),
                c: String(item?.option_c || '').trim(),
                d: String(item?.option_d || '').trim(),
            };

            if (!questionText || !explanationText || keys.some(k => !rawOptions[k])) {
                return [];
            }

            const resolvedKey = resolveCorrectKey(item?.correct_answer, rawOptions);
            if (!resolvedKey) {
                return [];
            }

            const entries = keys.map(k => ({ key: k, text: rawOptions[k], isCorrect: k === resolvedKey }));
            const canShuffle = entries.every(
                e => !/\b(above|below|option\s*[a-d]|both\s*[a-d])\b/i.test(e.text)
            );
            if (canShuffle) {
                for (let i = entries.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [entries[i], entries[j]] = [entries[j], entries[i]];
                }
            }

            const newCorrectIndex = entries.findIndex(e => e.isCorrect);
            const finalCorrectKey = keys[newCorrectIndex >= 0 ? newCorrectIndex : 0];

            built.push({
                id: store.nextId('quizQuestions'),
                quiz_type: quizType,
                topic: String(item?.topic || (quizType === 'safety' ? 'Scam Spotting' : 'Saving')).trim(),
                question: questionText,
                option_a: entries[0].text,
                option_b: entries[1].text,
                option_c: entries[2].text,
                option_d: entries[3].text,
                correct_answer: finalCorrectKey,
                coin_reward: 20,
                explanation: explanationText,
            });
        }

        return built.length === 5 ? built : [];
    } catch (err) {
        console.warn('Gemini quiz generation failed, falling back to seeded bank:', err);
        return [];
    }
}

export async function generateTrackerInsights(promptContext: string, userQuery: string): Promise<string | null> {
    // ── Primary path: LangGraph Financial Health Coach Agent ──────────────────
    try {
        const { runTrackerInsightsAgent } = await import('./agents/insightsAgent.js');
        const agentResult = await runTrackerInsightsAgent(promptContext, userQuery);
        if (agentResult) return agentResult;
    } catch (err) {
        console.warn('[TrackerInsightsAgent] fallback to direct call:', err);
    }

    const ai = getGeminiClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: `${promptContext}\n\nYoung Saver Question:\n${userQuery}`,
            config: {
                systemInstruction:
                    'You are AstraBot, an encouraging money mentor for kids aged 8–14 inside AstraMinds. Answer strictly based on the pocket money data provided — never invent numbers or transactions. Share simple, friendly observations and 3 fun, practical saving tips grounded in the AstraMinds curriculum (waiting 24 hours on impulse buys, moving spare rupees into a goal jar, distinguishing Needs vs. Wants). Never mention adult concepts like taxes, credit cards, stocks, or subscriptions. Use INR (₹) and clean markdown bullet points.',
            },
        });
        return response.text?.trim() || null;
    } catch (err) {
        console.warn('Gemini tracker insights error:', err);
        return null;
    }
}

export async function extractBillWithGemini(
    fileBuffer: Buffer,
    mimeType: string
): Promise<Record<string, any> | null> {
    // ── Primary path: LangGraph Receipt & Expense Analyzer Agent ──────────────
    try {
        const { runReceiptAnalyzerAgent } = await import('./agents/receiptAgent.js');
        const agentResult = await runReceiptAnalyzerAgent(fileBuffer, mimeType);
        if (agentResult) return agentResult;
    } catch (err) {
        console.warn('[ReceiptAnalyzerAgent] fallback to direct call:', err);
    }

    const ai = getGeminiClient();
    if (!ai) return null;

    try {
        const prompt =
            'You are an expert OCR receipt and financial invoice parser. Analyze this uploaded document/image and extract merchant, date (YYYY-MM-DD), numeric total amount, tax, currency (default INR), invoice_number, suggested_category (one of: Food & Dining, Groceries, Transportation, Shopping, Entertainment, Bills & Utilities, Rent & Housing, Healthcare, Education, Travel, Personal Care, Subscriptions, Investments, Other), line_items, and confidence scores.';

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: fileBuffer.toString('base64'),
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        merchant: { type: Type.STRING, nullable: true },
                        date: { type: Type.STRING, nullable: true },
                        amount: { type: Type.NUMBER, nullable: true },
                        tax: { type: Type.NUMBER, nullable: true },
                        currency: { type: Type.STRING },
                        invoice_number: { type: Type.STRING, nullable: true },
                        suggested_category: { type: Type.STRING },
                        line_items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    amount: { type: Type.NUMBER },
                                },
                            },
                        },
                        confidence: {
                            type: Type.OBJECT,
                            properties: {
                                merchant: { type: Type.NUMBER },
                                date: { type: Type.NUMBER },
                                amount: { type: Type.NUMBER },
                                overall: { type: Type.NUMBER },
                            },
                        },
                    },
                },
            },
        });

        const raw = (response.text || '').trim();
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.warn('Gemini OCR extraction error:', err);
        return null;
    }
}

export async function evaluateBudgetChallengeWithAI(params: {
    scenario: BudgetScenario;
    selectedItemIds: string[];
    includedSuddenExpense: boolean;
    reasoning?: string;
}): Promise<BudgetEvaluationFeedback> {
    // ── Primary path: LangGraph Budget Evaluation Agent ───────────────────────
    try {
        const { runBudgetEvaluationAgent } = await import('./agents/budgetAgent.js');
        const agentFeedback = await runBudgetEvaluationAgent(params);
        if (agentFeedback) return agentFeedback;
    } catch (err) {
        console.warn('[BudgetEvaluationAgent] fallback to direct calculation:', err);
    }

    const { scenario, selectedItemIds, includedSuddenExpense, reasoning } = params;
    const selectedSet = new Set(selectedItemIds);

    const selectedItems = scenario.items.filter(i => selectedSet.has(i.id));

    const needs = scenario.items.filter(i => i.type === 'NEED');
    const wants = scenario.items.filter(i => i.type === 'WANT');

    const coveredNeeds = needs.filter(i => selectedSet.has(i.id));
    const missedNeeds = needs.filter(i => !selectedSet.has(i.id));
    const boughtWants = wants.filter(i => selectedSet.has(i.id));
    const skippedWants = wants.filter(i => !selectedSet.has(i.id));

    const suddenCost = includedSuddenExpense ? scenario.sudden_expense.cost : 0;
    const totalSpent = selectedItems.reduce((sum, i) => sum + i.cost, 0) + suddenCost;
    const moneySaved = scenario.starting_budget - totalSpent;
    const overBudget = totalSpent > scenario.starting_budget;

    const suddenHandledCorrectly = scenario.sudden_expense.is_essential
        ? includedSuddenExpense
        : !includedSuddenExpense;

    // Score calculation (0 - 100)
    let ruleScore = 100;
    if (overBudget) ruleScore -= 45;
    ruleScore -= missedNeeds.length * 30;
    if (!suddenHandledCorrectly) ruleScore -= 35;
    ruleScore -= boughtWants.length * 15;
    if (moneySaved > 0 && missedNeeds.length === 0 && suddenHandledCorrectly && !overBudget) {
        ruleScore = Math.min(100, ruleScore + 5);
    }
    ruleScore = Math.max(10, Math.min(100, ruleScore));

    const allNeedsCovered = missedNeeds.length === 0 && suddenHandledCorrectly;
    const isOptimal = !overBudget && allNeedsCovered && boughtWants.length === 0;
    const isGood = !overBudget && allNeedsCovered && boughtWants.length > 0;

    const deterministicVerdict: BudgetEvaluationFeedback['verdict'] = isOptimal
        ? 'EXCELLENT'
        : isGood
        ? 'GOOD'
        : 'NEEDS_IMPROVEMENT';
    const deterministicRightChoice = !overBudget && allNeedsCovered;

    const buildFallbackFeedback = (): BudgetEvaluationFeedback => {
        if (isOptimal) {
            return {
                verdict: 'EXCELLENT',
                made_right_choice: true,
                needs_vs_wants_score: ruleScore,
                headline: `Awesome Budget Boss! You covered every Need and saved ₹${moneySaved}!`,
                what_went_well: `You prioritized what mattered most—covering ${
                    scenario.sudden_expense.is_essential
                        ? `the unexpected "${scenario.sudden_expense.title}" (₹${scenario.sudden_expense.cost})`
                        : `skipping the tempting "${scenario.sudden_expense.title}" trap`
                } along with every essential Need (${coveredNeeds.map(n => n.name).join(', ')}).`,
                how_to_manage_better: `You nailed this challenge! Moving the leftover ₹${moneySaved} straight into your Savings Goal jar will bring you closer to your next big reward.`,
            };
        }

        if (isGood) {
            return {
                verdict: 'GOOD',
                made_right_choice: true,
                needs_vs_wants_score: ruleScore,
                headline: `Nice Balance! You handled the surprise and all Needs, with room to save more.`,
                what_went_well: `You stayed inside your ₹${scenario.starting_budget} budget, took care of ${
                    scenario.sudden_expense.is_essential
                        ? scenario.sudden_expense.title
                        : 'skipping the sudden temptation'
                }, and didn’t miss any core Needs.`,
                how_to_manage_better: `You could save even more by skipping Want items like ${boughtWants
                    .map(w => `"${w.name}" (₹${w.cost})`)
                    .join(' and ')}. Skipping Wants leaves an extra ₹${boughtWants.reduce((s, w) => s + w.cost, 0)} in your piggy bank!`,
            };
        }

        const issues: string[] = [];
        if (overBudget) {
            issues.push(
                `you went ₹${Math.abs(moneySaved)} over your ₹${scenario.starting_budget} budget`
            );
        }
        if (!suddenHandledCorrectly) {
            issues.push(
                scenario.sudden_expense.is_essential
                    ? `you skipped the urgent "${scenario.sudden_expense.title}" (₹${scenario.sudden_expense.cost})`
                    : `you spent ₹${scenario.sudden_expense.cost} on "${scenario.sudden_expense.title}", which was actually a tempting Want`
            );
        }
        if (missedNeeds.length > 0) {
            issues.push(
                `you left out essential Need(s): ${missedNeeds.map(n => `"${n.name}" (₹${n.cost})`).join(', ')}`
            );
        }

        return {
            verdict: 'NEEDS_IMPROVEMENT',
            made_right_choice: false,
            needs_vs_wants_score: ruleScore,
            headline: `Good try! Let’s rebalance your Needs vs. Wants for next time.`,
            what_went_well:
                skippedWants.length > 0
                    ? `Great discipline saying no to ${skippedWants.map(w => `"${w.name}"`).join(', ')}—that saved ₹${skippedWants.reduce((s, w) => s + w.cost, 0)}!`
                    : `Taking on tough money surprises is how you build smart budgeting muscles!`,
            how_to_manage_better: `Notice that ${issues.join(' and ')}. ${scenario.ideal_tip}`,
        };
    };

    const ai = getGeminiClient();
    if (!ai) {
        return buildFallbackFeedback();
    }

    try {
        const prompt = [
            `Evaluate an 8–14 year old student's choices in a budgeting & Needs-vs-Wants game.`,
            `Scenario: "${scenario.title}"`,
            `Original Purpose: ${scenario.purpose}`,
            `Starting Budget: ₹${scenario.starting_budget}`,
            `Sudden Expense Event: "${scenario.sudden_expense.title}" (₹${scenario.sudden_expense.cost}) — ${scenario.sudden_expense.description} [Actually Essential Need? ${scenario.sudden_expense.is_essential ? 'YES' : 'NO, it is a tempting WANT trap'}]`,
            `Planned Items:`,
            ...scenario.items.map(
                i => `- ${i.name} (₹${i.cost}) | Official Type: ${i.type} | Hint: ${i.hint} | Student Picked? ${selectedSet.has(i.id) ? 'YES' : 'SKIPPED'}`
            ),
            `Did student cover the sudden expense? ${includedSuddenExpense ? 'YES' : 'NO'}`,
            `Total Spent: ₹${totalSpent} out of ₹${scenario.starting_budget} (${overBudget ? `OVER BUDGET by ₹${Math.abs(moneySaved)}` : `Saved ₹${moneySaved}`})`,
            reasoning?.trim() ? `Student's explanation: "${reasoning.trim()}"` : `Student's explanation: (none provided)`,
            `Ground-truth check: made_right_choice=${deterministicRightChoice}, verdict=${deterministicVerdict}, score=${ruleScore}/100, missed_needs=${missedNeeds.map(n => n.name).join(', ') || 'none'}, bought_wants=${boughtWants.map(w => w.name).join(', ') || 'none'}.`,
            `Write warm, clear, age-8–14 coaching telling them whether they made the right choice, praising what they did well, and explaining specifically how they could manage it better (or a bonus saving tip if they nailed it). Use INR (₹) and keep each field 1–2 concise sentences.`,
        ].join('\n');

        const response = await generateContentFastWithFallback(ai, {
            contents: prompt,
            config: {
                systemInstruction:
                    'You are AstraBot, an encouraging money teacher for ages 8–14 inside AstraMinds. Always respect the exact ground-truth check (never say they did everything right if made_right_choice is false). Be warm, clear, specific with item names and ₹ amounts, and never use adult jargon.',
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        what_went_well: { type: Type.STRING },
                        how_to_manage_better: { type: Type.STRING },
                    },
                    required: ['headline', 'what_went_well', 'how_to_manage_better'],
                },
            },
        });

        const raw = (response.text || '').trim();
        const parsed = JSON.parse(raw);
        if (parsed?.headline && parsed?.what_went_well && parsed?.how_to_manage_better) {
            return {
                verdict: deterministicVerdict,
                made_right_choice: deterministicRightChoice,
                needs_vs_wants_score: ruleScore,
                headline: String(parsed.headline).trim(),
                what_went_well: String(parsed.what_went_well).trim(),
                how_to_manage_better: String(parsed.how_to_manage_better).trim(),
            };
        }
    } catch (err) {
        console.warn('Gemini budget evaluation failed, using deterministic coach:', err);
    }

    return buildFallbackFeedback();
}

export async function generateAiBudgetScenario(params: {
    dateKey: string;
    avoidTitles?: string[];
    learnerProfile?: { age?: number | null; grade?: string | null; nickname?: string | null };
}): Promise<DynamicBudgetScenarioRecord | null> {
    // ── Primary path: LangGraph Budget Scenario Generator Agent ───────────────
    try {
        const { runBudgetScenarioAgent } = await import('./agents/budgetAgent.js');
        const agentScenario = await runBudgetScenarioAgent(params);
        if (agentScenario) return agentScenario;
    } catch (err) {
        console.warn('[BudgetScenarioAgent] fallback to direct call:', err);
    }

    const ai = getGeminiClient();
    if (!ai) return null;

    const { dateKey, avoidTitles = [], learnerProfile } = params;
    const age = learnerProfile?.age || 12;
    const grade = learnerProfile?.grade || (age <= 10 ? 'Grade 4' : age <= 14 ? 'Grade 7' : 'Grade 10');
    const themes = [
        'School & Studies',
        'Sports & Hobbies',
        'Family & Celebrations',
        'Weekend Fun',
        'Tech & Gaming',
        'Health & Pets',
    ];
    const suggestedTheme = themes[Math.floor(Math.random() * themes.length)];

    const prompt = [
        `Create 1 brand-new, super engaging, age-appropriate Daily Challenge budgeting scenario for an Indian student in ${grade} (Age: ${age}, date: ${dateKey}).`,
        `Suggested category theme: "${suggestedTheme}".`,
        avoidTitles.length > 0
            ? `Do NOT repeat or copy these previous scenario titles: ${avoidTitles.slice(-15).join('; ')}.`
            : '',
        'Rules:',
        `- Give the student a realistic starting_budget in Indian Rupees for their age (approx ${age <= 10 ? '₹150 to ₹400' : age <= 14 ? '₹400 to ₹1,000' : '₹800 to ₹2,500'}) for a clear, relatable purpose.`,
        `- Create a realistic sudden_expense curveball (cost between ${age <= 10 ? '₹30 and ₹100' : age <= 14 ? '₹80 and ₹250' : '₹150 and ₹500'}) that disrupts their original plan (usually an urgent NEED like fixing a flat bicycle tire, broken school umbrella, lost geometry box; occasionally a tempting flash-sale WANT trap with is_essential=false).`,
        '- Create exactly 4 planned items: 2 genuine NEED items (essential for safety, health, or the core purpose) and 2 tempting WANT items (fun extras, toys, snacks, or stickers).',
        '- Math requirement: (sum of the 2 NEED items + urgent sudden_expense if is_essential=true) MUST be less than starting_budget so the student can cover all Needs and still save money. Meanwhile, (sum of ALL 4 items + sudden_expense) MUST be GREATER than starting_budget so they cannot buy everything and must prioritize Needs vs. Wants!',
        `- Keep all names, prices, hints, and descriptions crisp, warm, and crystal clear for a ${grade} student.`,
    ]
        .filter(Boolean)
        .join('\n');

    try {
        const response = await generateContentFastWithFallback(ai, {
            contents: prompt,
            config: {
                systemInstruction:
                    'You are an imaginative kids financial-literacy game designer for AstraMinds, for ages 8–14. Always produce valid, age-appropriate scenarios with clean round INR numbers and strict Needs vs. Wants math. Never include adult concepts like stocks, credit cards, or loans.',
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING, enum: themes },
                        emoji: { type: Type.STRING },
                        starting_budget: { type: Type.INTEGER },
                        purpose: { type: Type.STRING },
                        sudden_expense: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                cost: { type: Type.INTEGER },
                                description: { type: Type.STRING },
                                is_essential: { type: Type.BOOLEAN },
                            },
                            required: ['title', 'cost', 'description', 'is_essential'],
                        },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    cost: { type: Type.INTEGER },
                                    type: { type: Type.STRING, enum: ['NEED', 'WANT'] },
                                    hint: { type: Type.STRING },
                                },
                                required: ['name', 'cost', 'type', 'hint'],
                            },
                        },
                        ideal_tip: { type: Type.STRING },
                    },
                    required: [
                        'title',
                        'category',
                        'emoji',
                        'starting_budget',
                        'purpose',
                        'sudden_expense',
                        'items',
                        'ideal_tip',
                    ],
                },
            },
        });

        const raw = (response.text || '').trim();
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.items) || parsed.items.length < 3) {
            console.warn('Gemini dynamic budget scenario rejected: invalid items array');
            return null;
        }

        const scenarioId = 1000 + store.nextId('budgetScenarios');
        const round10 = (v: unknown, min = 30) =>
            Math.max(min, Math.round(Number(v || min) / 10) * 10);

        const items = parsed.items.slice(0, 4).map((it: any, idx: number) => {
            const rawType = String(it?.type || '').toUpperCase();
            const itemType: 'NEED' | 'WANT' = rawType === 'NEED' ? 'NEED' : 'WANT';
            return {
                id: `ai-${scenarioId}-${idx}`,
                name: String(it?.name || '').trim(),
                cost: round10(it?.cost, 40),
                type: itemType,
                hint: String(it?.hint || '').trim(),
            };
        });

        const needCount = items.filter((i: any) => i.type === 'NEED').length;
        const wantCount = items.filter((i: any) => i.type === 'WANT').length;
        if (
            needCount < 1 ||
            wantCount < 1 ||
            items.some((i: any) => !i.name || !i.hint)
        ) {
            console.warn('Gemini dynamic budget scenario rejected: missing NEED/WANT balance or text');
            return null;
        }

        const suddenCost = round10(parsed.sudden_expense?.cost, 60);
        const isEssential = Boolean(parsed.sudden_expense?.is_essential);
        const suddenTitle = String(parsed.sudden_expense?.title || '').trim();
        const suddenDesc = String(parsed.sudden_expense?.description || '').trim();
        const title = String(parsed.title || '').trim();
        const purpose = String(parsed.purpose || '').trim();
        if (!title || !purpose || !suddenTitle || !suddenDesc) {
            console.warn('Gemini dynamic budget scenario rejected: missing title/purpose/sudden fields');
            return null;
        }

        const essentialCost =
            items.filter((i: any) => i.type === 'NEED').reduce((s: number, i: any) => s + i.cost, 0) +
            (isEssential ? suddenCost : 0);
        const allItemsPlusSudden =
            items.reduce((s: number, i: any) => s + i.cost, 0) + suddenCost;

        let budget = Math.max(250, Math.round(Number(parsed.starting_budget || 500) / 50) * 50);
        if (essentialCost > budget - 20 || allItemsPlusSudden <= budget) {
            // Auto-calibrate starting budget cleanly so Needs+EssentialSudden fit with savings left, while buying everything exceeds budget
            const minValid = essentialCost + 20;
            const maxValid = allItemsPlusSudden - 10;
            if (minValid > maxValid) {
                console.warn('Gemini dynamic budget scenario rejected: uncalibrated budget range', { essentialCost, allItemsPlusSudden });
                return null;
            }
            const candidate = Math.ceil(minValid / 50) * 50;
            if (candidate <= maxValid) {
                budget = candidate;
            } else {
                const candidate10 = Math.ceil(minValid / 10) * 10;
                if (candidate10 <= maxValid) {
                    budget = candidate10;
                } else {
                    return null;
                }
            }
        }

        // Shuffle items so NEED and WANT positions vary
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        const savedAmount = budget - essentialCost;
        const idealTip =
            String(parsed.ideal_tip || '').trim() ||
            `Cover ${
                isEssential ? `the ₹${suddenCost} "${suddenTitle}" and ` : ''
            }your core Needs first, skip the optional Wants, and keep ₹${savedAmount} in savings!`;

        return {
            id: scenarioId,
            title,
            category: String(parsed.category || suggestedTheme),
            emoji: String(parsed.emoji || '💡').trim().slice(0, 4),
            starting_budget: budget,
            purpose,
            sudden_expense: {
                title: suddenTitle,
                cost: suddenCost,
                description: suddenDesc,
                is_essential: isEssential,
            },
            items,
            ideal_tip: idealTip,
            is_ai_generated: true,
            date_key: dateKey,
        };
    } catch (err) {
        console.warn('Gemini dynamic budget scenario failed, falling back:', err);
        return null;
    }
}


