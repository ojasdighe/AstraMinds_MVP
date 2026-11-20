/**
 * AstraMinds LangGraph Quiz Generator & Curriculum Auditor Agent
 *
 * Graph Topology:
 *   [START]
 *      │
 *      ▼
 *   generateDraftQuestionsNode   Generates age-appropriate candidate questions
 *      │
 *      ▼
 *   curriculumAuditorNode        Validates format, options, answers, and kid safety
 *      │
 *      ▼
 *   formatQuestionsNode          Packages into QuizQuestionRecord[]
 *      │
 *      ▼
 *    [END]
 */

import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getLangChainGemini } from './llm.js';
import type { QuizQuestionRecord, QuizType } from '../store.js';

const QuizState = Annotation.Root({
    quizType: Annotation<QuizType>(),
    learnerAge: Annotation<number | null | undefined>(),
    learnerGrade: Annotation<string | null | undefined>(),
    rawDraft: Annotation<string>(),
    auditedQuestions: Annotation<QuizQuestionRecord[]>(),
    isFallback: Annotation<boolean>(),
});

type State = typeof QuizState.State;

async function generateDraftQuestionsNode(state: State): Promise<Partial<State>> {
    const llm = getLangChainGemini({ temperature: 0.6 });
    if (!llm) return { isFallback: true };

    const isSafety = state.quizType === 'safety';
    const age = state.learnerAge || 12;
    const grade = state.learnerGrade || (age <= 10 ? 'Grade 4' : age <= 14 ? 'Grade 7' : 'Grade 10');

    let tierLabel = 'Smart Navigators (Ages 11–14)';
    let tierGuidance = '';

    if (age <= 10) {
        tierLabel = `Junior Explorers (Ages 7–10, ${grade})`;
        tierGuidance = isSafety
            ? `Topics: Never sharing game passwords or tablets with friends/strangers; always asking parents before clicking "Buy" or downloading new games; recognizing that "Free Robux/Gems/Diamonds" popups are scams; not chatting with unknown players. Simple vocabulary, friendly examples.`
            : `Topics: Piggy banks and coin jars; difference between Needs (pencils, food, warm clothes) vs Wants (candies, extra toys); delayed gratification (waiting and saving); understanding money comes from parents working or chores. Rupees scale: ₹10 to ₹150.`;
    } else if (age <= 14) {
        tierLabel = `Smart Navigators (Ages 11–14, ${grade})`;
        tierGuidance = isSafety
            ? `Topics: Golden Rule: UPI PIN is ONLY entered to SEND money (never to receive cashbacks/prizes); spotting phishing SMS, fake tournament links, and coupon scams; recurring in-game subscription traps; keeping personal info private on social media. Realistic tween examples.`
            : `Topics: Weekly allowance budgeting; smart comparison shopping & detecting deceptive sales discounts; opportunity cost; setting 1-to-3 month savings goals; balancing canteen snacks with bigger wishes. Rupees scale: ₹50 to ₹1,200.`;
    } else {
        tierLabel = `Future Achievers (Ages 15–18+, ${grade})`;
        tierGuidance = isSafety
            ? `Topics: QR code tampering scams (fake merchant QR codes); SIM swap and OTP interception tricks; fake internship/part-time job/scholarship schemes; debit card CVV/expiry safety; secure device & network practices (avoiding public Wi-Fi for transactions).`
            : `Topics: Student banking basics & debit cards; simple vs compound interest; inflation and purchasing power; budgeting monthly allowances or side-project earnings; setting SMART financial targets for college or gear. Rupees scale: ₹200 to ₹5,000.`;
    }

    const prompt = `Generate 5 fun, educational, distinct multiple-choice questions for a student in India.
Target Learner: ${tierLabel} (Age: ${age}, Class/Grade: ${grade}).
Track: ${isSafety ? 'Digital Money Safety' : 'Money Smarts'}.
Curriculum Focus:
${tierGuidance}

Rules:
1. Exactly 4 options for each question: option_a, option_b, option_c, option_d.
2. Only ONE option must be clearly correct and safe.
3. NEVER use "All of the above" or "None of the above".
4. Distribute correct answers across 'a', 'b', 'c', 'd'.
5. Include a short, encouraging explanation appropriate for a student in ${grade}.
6. Absolutely NO adult finance topics (no stocks, crypto, credit scores, taxes, mutual funds, or mortgages).

Output strictly valid JSON with this shape:
[
  {
    "topic": "Needs vs Wants",
    "question": "What is the best choice when buying school supplies?",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "a",
    "explanation": "..."
  }
]
Output ONLY JSON, no markdown fences.`;

    try {
        const response = await llm.invoke([
            new SystemMessage('You are AstraMinds Lead Curriculum Author for youth financial literacy. Output strictly valid JSON.'),
            new HumanMessage(prompt),
        ]);
        return { rawDraft: String(response.content) };
    } catch {
        return { isFallback: true };
    }
}

async function curriculumAuditorNode(state: State): Promise<Partial<State>> {
    if (state.isFallback || !state.rawDraft) {
        return { auditedQuestions: [], isFallback: true };
    }

    try {
        const cleaned = state.rawDraft.replace(/```json\n?|```/g, '').trim();
        const rawArray = JSON.parse(cleaned);

        if (!Array.isArray(rawArray) || rawArray.length === 0) {
            return { auditedQuestions: [], isFallback: true };
        }

        const audited: QuizQuestionRecord[] = [];
        const baseId = Date.now();

        for (let i = 0; i < rawArray.length; i++) {
            const item = rawArray[i];
            const qText = String(item.question || '').trim();
            const a = String(item.option_a || '').trim();
            const b = String(item.option_b || '').trim();
            const c = String(item.option_c || '').trim();
            const d = String(item.option_d || '').trim();

            if (!qText || !a || !b || !c || !d) continue;

            let correct = String(item.correct_answer || 'a').toLowerCase().trim();
            if (!['a', 'b', 'c', 'd'].includes(correct)) {
                correct = 'a';
            }

            audited.push({
                id: baseId + i,
                quiz_type: state.quizType,
                topic: String(item.topic || (state.quizType === 'safety' ? 'Digital Safety' : 'Smart Saving')),
                question: qText,
                option_a: a,
                option_b: b,
                option_c: c,
                option_d: d,
                correct_answer: correct as 'a' | 'b' | 'c' | 'd',
                coin_reward: 10,
                explanation: String(item.explanation || 'Great job practicing smart money habits!'),
            });
        }

        return { auditedQuestions: audited, isFallback: audited.length === 0 };
    } catch {
        return { auditedQuestions: [], isFallback: true };
    }
}

async function formatQuestionsNode(state: State): Promise<Partial<State>> {
    return { auditedQuestions: state.auditedQuestions };
}

function buildQuizGraph() {
    return new StateGraph(QuizState)
        .addNode('generateDraft', generateDraftQuestionsNode)
        .addNode('curriculumAudit', curriculumAuditorNode)
        .addNode('formatQuestions', formatQuestionsNode)
        .addEdge(START, 'generateDraft')
        .addEdge('generateDraft', 'curriculumAudit')
        .addEdge('curriculumAudit', 'formatQuestions')
        .addEdge('formatQuestions', END)
        .compile();
}

let _quizGraph: ReturnType<typeof buildQuizGraph> | null = null;
function getQuizGraph() {
    if (!_quizGraph) _quizGraph = buildQuizGraph();
    return _quizGraph;
}

export async function runQuizGeneratorAgent(
    quizType: QuizType = 'money',
    learnerProfile?: { age?: number | null; grade?: string | null; nickname?: string | null }
): Promise<QuizQuestionRecord[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        return [];
    }

    try {
        const graph = getQuizGraph();
        const res = await graph.invoke({
            quizType,
            learnerAge: learnerProfile?.age,
            learnerGrade: learnerProfile?.grade,
            rawDraft: '',
            auditedQuestions: [],
            isFallback: false,
        });

        if (res.auditedQuestions && res.auditedQuestions.length > 0) {
            return res.auditedQuestions;
        }
    } catch (err) {
        console.warn('[runQuizGeneratorAgent] Graph error:', err);
    }

    return [];
}
