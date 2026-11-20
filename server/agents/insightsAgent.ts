/**
 * AstraMinds LangGraph Financial Health & Spending Coach Agent
 *
 * Graph Topology:
 *   [START]
 *      │
 *      ▼
 *   extractMetricsNode      Parses cash flow, top expense categories, and anomalies
 *      │
 *      ▼
 *   analyzeSpendingNode     Identifies discretionary leaks & potential savings
 *      │
 *      ▼
 *   synthesizeCoachingNode  Composes personalized, kid-friendly coaching with Gemini
 *      │
 *      ▼
 *    [END]
 */

import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getLangChainGemini } from './llm.js';

export interface TrackerInsightsAgentInput {
    promptContext: string;
    userQuery: string;
}

const InsightsState = Annotation.Root({
    promptContext: Annotation<string>(),
    userQuery: Annotation<string>(),
    metricsSummary: Annotation<string>(),
    coachingPlan: Annotation<string>(),
    result: Annotation<string>(),
    isFallback: Annotation<boolean>(),
});

type State = typeof InsightsState.State;

const COACH_SYSTEM_PROMPT = `You are AstraBot, an encouraging money mentor for kids and tweens aged 8–14 inside AstraMinds.
Your mission is to help young savers understand their pocket money and make smart choices.

══ STRICT CURRICULUM GROUNDING ══
Ground all advice in AstraMinds Book 04 (The Student's Money Map) and Book 01 (Money Explorer):
  • Needs vs. Wants (essential school items vs. spontaneous treats)
  • The 24-Hour Wait Rule for impulse desires
  • The Three-Jar System (Save, Spend, Share)
  • Moving unspent pocket money into savings goals

══ ABSOLUTE PROHIBITIONS ══
  ❌ NEVER mention adult financial concepts (credit cards, loans, mortgages, stocks, crypto, mutual funds, taxes, or SIPs).
  ❌ NEVER give pessimistic or harsh judgment. Always stay constructive and optimistic.
  ❌ NEVER invent numbers. Use only the amounts and transactions provided.
  ❌ Always use Indian Rupee (₹) amounts.`;

async function extractMetricsNode(state: State): Promise<Partial<State>> {
    // Structured extraction of key points from context
    const summary = `Context Provided:\n${state.promptContext}`;
    return { metricsSummary: summary };
}

async function analyzeSpendingNode(state: State): Promise<Partial<State>> {
    const llm = getLangChainGemini({ temperature: 0.2 });
    if (!llm) {
        return { isFallback: true };
    }

    try {
        const response = await llm.invoke([
            new SystemMessage(
                `${COACH_SYSTEM_PROMPT}\n\nTask: Analyze the user's spending data. Identify the top spending category, note if there is a surplus or deficit, and identify 1-2 practical ways a kid can save more.`
            ),
            new HumanMessage(
                `${state.metricsSummary}\n\nUser Question/Goal: ${state.userQuery}`
            ),
        ]);

        return { coachingPlan: String(response.content) };
    } catch (err) {
        console.warn('[InsightsAgent] Analysis step error:', err);
        return { isFallback: true };
    }
}

async function synthesizeCoachingNode(state: State): Promise<Partial<State>> {
    if (state.isFallback || !state.coachingPlan) {
        return { isFallback: true };
    }

    const llm = getLangChainGemini({ temperature: 0.4 });
    if (!llm) {
        return { isFallback: true };
    }

    try {
        const response = await llm.invoke([
            new SystemMessage(
                `${COACH_SYSTEM_PROMPT}
Compose the final response for the young saver.
Structure:
1. 🌟 **Friendly Spending Check-in**: 1-2 warm sentences summarizing how they did with their pocket money.
2. 💡 **Smart Money Observations**: 2 concise bullet points explaining their biggest category and saving habits.
3. 🎯 **3 Actionable Young Saver Missions**: 3 fun, concrete challenges (e.g. 24-hour rule, save-first challenge, snack swap).

Keep language friendly, enthusiastic, and easy to read for ages 8–14. Use ₹ and clean markdown.`
            ),
            new HumanMessage(
                `Raw Analysis:\n${state.coachingPlan}\n\nOriginal Question: ${state.userQuery}`
            ),
        ]);

        const text = String(response.content).trim();
        return { result: text, isFallback: false };
    } catch (err) {
        console.warn('[InsightsAgent] Synthesize step error:', err);
        return { isFallback: true };
    }
}

function buildInsightsGraph() {
    return new StateGraph(InsightsState)
        .addNode('extractMetrics', extractMetricsNode)
        .addNode('analyzeSpending', analyzeSpendingNode)
        .addNode('synthesizeCoaching', synthesizeCoachingNode)
        .addEdge(START, 'extractMetrics')
        .addEdge('extractMetrics', 'analyzeSpending')
        .addEdge('analyzeSpending', 'synthesizeCoaching')
        .addEdge('synthesizeCoaching', END)
        .compile();
}

let _insightsGraph: ReturnType<typeof buildInsightsGraph> | null = null;
function getInsightsGraph() {
    if (!_insightsGraph) _insightsGraph = buildInsightsGraph();
    return _insightsGraph;
}

export async function runTrackerInsightsAgent(
    promptContext: string,
    userQuery: string
): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        return null;
    }

    try {
        const graph = getInsightsGraph();
        const output = await graph.invoke({
            promptContext,
            userQuery,
            metricsSummary: '',
            coachingPlan: '',
            result: '',
            isFallback: false,
        });

        if (output.result && !output.isFallback) {
            return output.result;
        }
    } catch (err) {
        console.warn('[runTrackerInsightsAgent] Graph execution failed:', err);
    }

    return null;
}
