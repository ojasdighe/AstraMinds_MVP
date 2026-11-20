/**
 * AstraMinds LangGraph Budget Challenge & Scenario Generation Agent
 *
 * Implements two distinct LangGraph agentic workflows:
 *
 * 1. Budget Evaluation Agent Graph:
 *    [START] ➔ auditDecisionsNode ➔ critiquePedagogyNode ➔ synthesizeFeedbackNode ➔ [END]
 *
 * 2. Scenario Generation Agent Graph:
 *    [START] ➔ draftScenarioNode ➔ validateScenarioMathNode ➔ [END]
 */

import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getLangChainGemini } from './llm.js';
import type { BudgetScenario, BudgetPlanItem } from '../data/budgetScenarios.js';
import type { BudgetEvaluationFeedback, DynamicBudgetScenarioRecord, DynamicBudgetItemRecord } from '../store.js';

// ════════════════════════════════════════════════════════════════════════════
// 1. EVALUATION AGENT GRAPH
// ════════════════════════════════════════════════════════════════════════════

interface MathAudit {
    totalSpent: number;
    moneySaved: number;
    overBudget: boolean;
    missedNeeds: BudgetPlanItem[];
    boughtWants: BudgetPlanItem[];
    suddenHandledCorrectly: boolean;
    ruleScore: number;
    isOptimal: boolean;
    isGood: boolean;
}

const EvaluationState = Annotation.Root({
    scenario: Annotation<BudgetScenario>(),
    selectedItemIds: Annotation<string[]>(),
    includedSuddenExpense: Annotation<boolean>(),
    reasoning: Annotation<string | undefined>(),

    mathAudit: Annotation<MathAudit>(),
    pedagogicalInsights: Annotation<string>(),
    feedback: Annotation<BudgetEvaluationFeedback | null>(),
    isFallback: Annotation<boolean>(),
});

type EvalState = typeof EvaluationState.State;

async function auditDecisionsNode(state: EvalState): Promise<Partial<EvalState>> {
    const { scenario, selectedItemIds, includedSuddenExpense } = state;
    const selectedSet = new Set(selectedItemIds);
    const selectedItems = scenario.items.filter(i => selectedSet.has(i.id));

    const needs = scenario.items.filter(i => i.type === 'NEED');
    const wants = scenario.items.filter(i => i.type === 'WANT');

    const missedNeeds = needs.filter(i => !selectedSet.has(i.id));
    const boughtWants = wants.filter(i => selectedSet.has(i.id));

    const suddenCost = includedSuddenExpense ? scenario.sudden_expense.cost : 0;
    const totalSpent = selectedItems.reduce((sum, i) => sum + i.cost, 0) + suddenCost;
    const moneySaved = scenario.starting_budget - totalSpent;
    const overBudget = totalSpent > scenario.starting_budget;

    const suddenHandledCorrectly = scenario.sudden_expense.is_essential
        ? includedSuddenExpense
        : !includedSuddenExpense;

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

    return {
        mathAudit: {
            totalSpent,
            moneySaved,
            overBudget,
            missedNeeds,
            boughtWants,
            suddenHandledCorrectly,
            ruleScore,
            isOptimal,
            isGood,
        },
    };
}

async function critiquePedagogyNode(state: EvalState): Promise<Partial<EvalState>> {
    const audit = state.mathAudit;
    const { scenario, reasoning } = state;

    const critique = [
        `Scenario: "${scenario.title}" (Budget: ₹${scenario.starting_budget})`,
        `Total Spent: ₹${audit.totalSpent} | Saved: ₹${audit.moneySaved} | Over Budget: ${audit.overBudget}`,
        `Missed Needs: ${audit.missedNeeds.map(n => n.name).join(', ') || 'None (All covered!)'}`,
        `Bought Wants: ${audit.boughtWants.map(w => w.name).join(', ') || 'None (Great discipline!)'}`,
        `Sudden Expense: "${scenario.sudden_expense.title}" (Essential: ${scenario.sudden_expense.is_essential}) was ${state.includedSuddenExpense ? 'PAID' : 'SKIPPED'}. Handled Correctly: ${audit.suddenHandledCorrectly}`,
        reasoning ? `Student's Reasoning: "${reasoning}"` : '',
    ].filter(Boolean).join('\n');

    return { pedagogicalInsights: critique };
}

async function synthesizeFeedbackNode(state: EvalState): Promise<Partial<EvalState>> {
    const audit = state.mathAudit;
    const verdict: BudgetEvaluationFeedback['verdict'] = audit.isOptimal
        ? 'EXCELLENT'
        : audit.isGood
        ? 'GOOD'
        : 'NEEDS_IMPROVEMENT';

    const deterministicRightChoice = !audit.overBudget && audit.missedNeeds.length === 0 && audit.suddenHandledCorrectly;

    const llm = getLangChainGemini({ temperature: 0.3 });
    if (!llm) {
        return {
            feedback: {
                verdict,
                made_right_choice: deterministicRightChoice,
                needs_vs_wants_score: audit.ruleScore,
                headline: verdict === 'EXCELLENT'
                    ? 'Superstar Budgeting! 🌟'
                    : verdict === 'GOOD'
                    ? 'Solid Plan with Room to Save! 👍'
                    : 'Needs First! Let\'s Rebalance 💡',
                what_went_well: audit.missedNeeds.length === 0
                    ? 'You protected all critical needs and stayed within your budget!'
                    : 'You showed great effort working through unexpected expenses.',
                how_to_manage_better: state.scenario.ideal_tip || 'Always cover needs first before spending on wants!',
            },
            isFallback: true,
        };
    }

    try {
        const response = await llm.invoke([
            new SystemMessage(
                `You are AstraBot, a warm and encouraging money mentor for kids aged 8–14.
Evaluate the student's choices in a budget scenario. Ground advice in Needs vs. Wants from AstraMinds curriculum.
Return a valid JSON object matching this schema:
{
  "headline": "Short cheerful punchy title with one emoji",
  "what_went_well": "2 sentences praising what they did right (e.g. paying needs, saving rupees)",
  "how_to_manage_better": "2 actionable sentences advising how to handle trade-offs or unexpected expenses better"
}
Output ONLY the JSON object, with no markdown code fences.`
            ),
            new HumanMessage(state.pedagogicalInsights),
        ]);

        const text = String(response.content).replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(text);

        return {
            feedback: {
                verdict,
                made_right_choice: deterministicRightChoice,
                needs_vs_wants_score: audit.ruleScore,
                headline: parsed.headline || 'Budget Challenge Complete! 🎯',
                what_went_well: parsed.what_went_well || 'You showed thoughtful budgeting.',
                how_to_manage_better: parsed.how_to_manage_better || state.scenario.ideal_tip,
            },
            isFallback: false,
        };
    } catch {
        return {
            feedback: {
                verdict,
                made_right_choice: deterministicRightChoice,
                needs_vs_wants_score: audit.ruleScore,
                headline: verdict === 'EXCELLENT' ? 'Masterful Saver! 🌟' : 'Good Financial Effort! 💡',
                what_went_well: 'You made deliberate choices under a tight budget.',
                how_to_manage_better: state.scenario.ideal_tip,
            },
            isFallback: true,
        };
    }
}

function buildEvaluationGraph() {
    return new StateGraph(EvaluationState)
        .addNode('auditDecisions', auditDecisionsNode)
        .addNode('critiquePedagogy', critiquePedagogyNode)
        .addNode('synthesizeFeedback', synthesizeFeedbackNode)
        .addEdge(START, 'auditDecisions')
        .addEdge('auditDecisions', 'critiquePedagogy')
        .addEdge('critiquePedagogy', 'synthesizeFeedback')
        .addEdge('synthesizeFeedback', END)
        .compile();
}

let _evalGraph: ReturnType<typeof buildEvaluationGraph> | null = null;
function getEvalGraph() {
    if (!_evalGraph) _evalGraph = buildEvaluationGraph();
    return _evalGraph;
}

export async function runBudgetEvaluationAgent(params: {
    scenario: BudgetScenario;
    selectedItemIds: string[];
    includedSuddenExpense: boolean;
    reasoning?: string;
}): Promise<BudgetEvaluationFeedback> {
    try {
        const graph = getEvalGraph();
        const res = await graph.invoke({
            scenario: params.scenario,
            selectedItemIds: params.selectedItemIds,
            includedSuddenExpense: params.includedSuddenExpense,
            reasoning: params.reasoning,
            mathAudit: {} as MathAudit,
            pedagogicalInsights: '',
            feedback: null,
            isFallback: false,
        });

        if (res.feedback) {
            return res.feedback;
        }
    } catch (err) {
        console.warn('[runBudgetEvaluationAgent] Graph error:', err);
    }

    // Default fallback feedback
    return {
        verdict: 'GOOD',
        made_right_choice: true,
        needs_vs_wants_score: 80,
        headline: 'Great job trying the challenge! 🎯',
        what_went_well: 'You prioritized your spending and balanced your options.',
        how_to_manage_better: params.scenario.ideal_tip || 'Remember: Needs always come before Wants!',
    };
}

// ════════════════════════════════════════════════════════════════════════════
// 2. SCENARIO GENERATION AGENT GRAPH
// ════════════════════════════════════════════════════════════════════════════

const ScenarioState = Annotation.Root({
    dateKey: Annotation<string>(),
    avoidTitles: Annotation<string[]>(),
    learnerAge: Annotation<number | null | undefined>(),
    learnerGrade: Annotation<string | null | undefined>(),
    rawDraft: Annotation<string>(),
    validatedRecord: Annotation<DynamicBudgetScenarioRecord | null>(),
});

type ScenState = typeof ScenarioState.State;

async function draftScenarioNode(state: ScenState): Promise<Partial<ScenState>> {
    const llm = getLangChainGemini({ temperature: 0.7 });
    if (!llm) return { rawDraft: '' };

    const age = state.learnerAge || 12;
    const grade = state.learnerGrade || (age <= 10 ? 'Grade 4' : age <= 14 ? 'Grade 7' : 'Grade 10');

    let tierLabel = `Smart Navigator (Ages 11–14, ${grade})`;
    let budgetMin = 400;
    let budgetMax = 1200;
    let suddenMin = 80;
    let suddenMax = 250;
    let themeGuidance = 'Topics: Canteen meals, school supplies, sports gear, hobby project, weekend friend outing, saving for a sneaker.';

    if (age <= 10) {
        tierLabel = `Junior Explorer (Ages 7–10, ${grade})`;
        budgetMin = 150;
        budgetMax = 450;
        suddenMin = 30;
        suddenMax = 100;
        themeGuidance = 'Topics: Art supplies, storybooks, piggy bank saving, sibling gift, simple school items.';
    } else if (age >= 15) {
        tierLabel = `Future Achiever (Ages 15–18+, ${grade})`;
        budgetMin = 800;
        budgetMax = 3000;
        suddenMin = 150;
        suddenMax = 600;
        themeGuidance = 'Topics: Monthly study allowance, exam guidebooks, student bus/metro pass, tech accessory, group project expenses.';
    }

    const prompt = `Create a realistic, relatable daily budget challenge scenario for an Indian student.
Target Student: ${tierLabel} (Age: ${age}, Class: ${grade}).
${themeGuidance}
Avoid these existing titles: ${state.avoidTitles.slice(0, 5).join(', ')}.

Requirements:
- starting_budget: between ${budgetMin} and ${budgetMax} INR (realistic for a student of age ${age}).
- sudden_expense: title, cost (₹${suddenMin} to ₹${suddenMax}), description, is_essential (true or false).
- items: 4 distinct items (2 NEEDS, 2 WANTS), each with id ("1-a", "1-b", etc.), name, cost, type ('NEED' or 'WANT'), hint.
- All numbers must be mathematically solvable: the sum of NEEDS plus sudden expense (if essential) MUST be less than or equal to starting_budget.
- ideal_tip: 1 sentence teaching the right strategy tailored for a student in ${grade}.

Return ONLY a valid JSON object matching:
{
  "title": string,
  "category": string,
  "emoji": string,
  "starting_budget": number,
  "purpose": string,
  "sudden_expense": { "title": string, "cost": number, "description": string, "is_essential": boolean },
  "items": [{ "id": string, "name": string, "cost": number, "type": "NEED"|"WANT", "hint": string }],
  "ideal_tip": string
}`;

    try {
        const response = await llm.invoke([
            new SystemMessage('You are AstraMinds Curriculum Designer. Always output strict JSON only, no markdown fences.'),
            new HumanMessage(prompt),
        ]);
        return { rawDraft: String(response.content) };
    } catch {
        return { rawDraft: '' };
    }
}

async function validateScenarioMathNode(state: ScenState): Promise<Partial<ScenState>> {
    if (!state.rawDraft) return { validatedRecord: null };

    try {
        const cleaned = state.rawDraft.replace(/```json\n?|```/g, '').trim();
        const obj = JSON.parse(cleaned);

        if (
            !obj.title ||
            typeof obj.starting_budget !== 'number' ||
            !Array.isArray(obj.items) ||
            obj.items.length < 3 ||
            !obj.sudden_expense
        ) {
            return { validatedRecord: null };
        }

        const id = Date.now();
        const record: DynamicBudgetScenarioRecord = {
            id,
            title: String(obj.title),
            category: String(obj.category || 'School & Hobbies'),
            emoji: String(obj.emoji || '🎯'),
            starting_budget: Number(obj.starting_budget),
            purpose: String(obj.purpose || 'Plan your spending wisely.'),
            sudden_expense: {
                title: String(obj.sudden_expense.title || 'Unexpected Expense'),
                cost: Number(obj.sudden_expense.cost || 50),
                description: String(obj.sudden_expense.description || ''),
                is_essential: Boolean(obj.sudden_expense.is_essential),
            },
            items: obj.items.map((it: any, idx: number): DynamicBudgetItemRecord => ({
                id: String(it.id || `${id}-${idx}`),
                name: String(it.name),
                cost: Number(it.cost),
                type: it.type === 'NEED' ? 'NEED' : 'WANT',
                hint: String(it.hint || ''),
            })),
            ideal_tip: String(obj.ideal_tip || 'Cover needs first!'),
            date_key: state.dateKey,
            is_ai_generated: true,
        };

        return { validatedRecord: record };
    } catch {
        return { validatedRecord: null };
    }
}

function buildScenarioGraph() {
    return new StateGraph(ScenarioState)
        .addNode('draftScenario', draftScenarioNode)
        .addNode('validateScenarioMath', validateScenarioMathNode)
        .addEdge(START, 'draftScenario')
        .addEdge('draftScenario', 'validateScenarioMath')
        .addEdge('validateScenarioMath', END)
        .compile();
}

let _scenGraph: ReturnType<typeof buildScenarioGraph> | null = null;
function getScenGraph() {
    if (!_scenGraph) _scenGraph = buildScenarioGraph();
    return _scenGraph;
}

export async function runBudgetScenarioAgent(params: {
    dateKey: string;
    avoidTitles?: string[];
    learnerProfile?: { age?: number | null; grade?: string | null; nickname?: string | null };
}): Promise<DynamicBudgetScenarioRecord | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        return null;
    }

    try {
        const graph = getScenGraph();
        const res = await graph.invoke({
            dateKey: params.dateKey,
            avoidTitles: params.avoidTitles || [],
            learnerAge: params.learnerProfile?.age,
            learnerGrade: params.learnerProfile?.grade,
            rawDraft: '',
            validatedRecord: null,
        });

        if (res.validatedRecord) {
            return res.validatedRecord;
        }
    } catch (err) {
        console.warn('[runBudgetScenarioAgent] Graph error:', err);
    }

    return null;
}
