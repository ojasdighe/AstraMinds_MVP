/**
 * AstraMinds LangGraph Receipt & Expense Analyzer Agent
 *
 * Graph Topology:
 *   [START]
 *      │
 *      ▼
 *   multimodalOcrNode         Extracts raw bill/receipt items via Gemini Multimodal
 *      │
 *      ▼
 *   categorizeAndAuditNode    Classifies into youth categories, audits amounts and dates
 *      │
 *      ▼
 *    [END]
 */

import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { GoogleGenAI, Type } from '@google/genai';

const ReceiptState = Annotation.Root({
    fileBase64: Annotation<string>(),
    mimeType: Annotation<string>(),
    rawResult: Annotation<Record<string, any> | null>(),
    finalResult: Annotation<Record<string, any> | null>(),
    isFallback: Annotation<boolean>(),
});

type State = typeof ReceiptState.State;

async function multimodalOcrNode(state: State): Promise<Partial<State>> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        return { isFallback: true };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt =
            'You are an expert OCR receipt and financial invoice parser. Analyze this uploaded document/image and extract merchant, date (YYYY-MM-DD), numeric total amount, tax, currency (default INR), invoice_number, suggested_category, line_items, and confidence scores.';

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: state.mimeType,
                            data: state.fileBase64,
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
        return { rawResult: raw ? JSON.parse(raw) : null };
    } catch (err) {
        console.warn('[ReceiptAgent] Multimodal OCR error:', err);
        return { isFallback: true };
    }
}

async function categorizeAndAuditNode(state: State): Promise<Partial<State>> {
    if (!state.rawResult) {
        return { finalResult: null, isFallback: true };
    }

    const data = { ...state.rawResult };

    // Standardize youth-friendly category
    const validCategories = [
        'Food & Dining',
        'Books & School',
        'Toys & Games',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Hobbies & Sports',
        'Gifts',
        'Other',
    ];

    let category = data.suggested_category || 'Other';
    if (!validCategories.includes(category)) {
        if (/snack|food|cafe|restaurant|bakery|canteen|biscuit|chocolate/i.test(category + ' ' + (data.merchant || ''))) {
            category = 'Food & Dining';
        } else if (/book|stationery|pen|pencil|notebook|school|tuition/i.test(category + ' ' + (data.merchant || ''))) {
            category = 'Books & School';
        } else if (/game|toy|steam|playstation|arcade/i.test(category + ' ' + (data.merchant || ''))) {
            category = 'Toys & Games';
        } else {
            category = 'Shopping';
        }
    }
    data.suggested_category = category;

    // Validate date format or fallback to today
    if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        data.date = new Date().toISOString().slice(0, 10);
    }

    return { finalResult: data, isFallback: false };
}

function buildReceiptGraph() {
    return new StateGraph(ReceiptState)
        .addNode('ocr', multimodalOcrNode)
        .addNode('audit', categorizeAndAuditNode)
        .addEdge(START, 'ocr')
        .addEdge('ocr', 'audit')
        .addEdge('audit', END)
        .compile();
}

let _receiptGraph: ReturnType<typeof buildReceiptGraph> | null = null;
function getReceiptGraph() {
    if (!_receiptGraph) _receiptGraph = buildReceiptGraph();
    return _receiptGraph;
}

export async function runReceiptAnalyzerAgent(
    fileBuffer: Buffer,
    mimeType: string
): Promise<Record<string, any> | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        return null;
    }

    try {
        const graph = getReceiptGraph();
        const res = await graph.invoke({
            fileBase64: fileBuffer.toString('base64'),
            mimeType,
            rawResult: null,
            finalResult: null,
            isFallback: false,
        });

        if (res.finalResult && !res.isFallback) {
            return res.finalResult;
        }
    } catch (err) {
        console.warn('[runReceiptAnalyzerAgent] Graph error:', err);
    }

    return null;
}
