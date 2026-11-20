import { useEffect, useState, useCallback } from 'react';
import {
    Wallet,
    Zap,
    Sparkles,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Coins,
    Trophy,
    RefreshCw,
    ArrowRight,
    PiggyBank,
    Lightbulb,
    BookOpen,
} from 'lucide-react';
import MatrixLoader from '../../components/ui/MatrixLoader';
import { api } from '../api';
import { useDashboard } from '../DashboardLayout';

interface PlayItem {
    id: string;
    name: string;
    cost: number;
    hint: string;
}

interface PlayScenario {
    id: number;
    title: string;
    category: string;
    emoji: string;
    starting_budget: number;
    purpose: string;
    is_ai_generated?: boolean;
    sudden_expense: {
        title: string;
        cost: number;
        description: string;
    };
    items: PlayItem[];
}

interface BudgetFeedback {
    verdict: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
    made_right_choice: boolean;
    needs_vs_wants_score: number;
    headline: string;
    what_went_well: string;
    how_to_manage_better: string;
}

interface RevealItem extends PlayItem {
    type: 'NEED' | 'WANT';
    selected: boolean;
}

interface SubmitResult {
    is_daily: boolean;
    total_spent: number;
    money_saved: number;
    starting_budget?: number;
    coins_earned: number;
    xp_earned: number;
    feedback: BudgetFeedback;
    reveal: {
        ideal_tip: string;
        sudden_expense: {
            title: string;
            cost: number;
            description: string;
            is_essential: boolean;
            included: boolean;
        };
        items: RevealItem[];
    };
}

export default function BudgetChallengePage() {
    const { user, refreshUser, addNotification } = useDashboard();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [scenario, setScenario] = useState<PlayScenario | null>(null);
    const [isDaily, setIsDaily] = useState(true);
    const [challengeDate, setChallengeDate] = useState('');
    const [completedCount, setCompletedCount] = useState(0);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [includeSudden, setIncludeSudden] = useState(true);
    const [reasoning, setReasoning] = useState('');
    const [result, setResult] = useState<SubmitResult | null>(null);

    // Past Challenges Journal state
    const [pageTab, setPageTab] = useState<'today' | 'journal'>('today');
    const [journalHistory, setJournalHistory] = useState<any[]>([]);
    const [journalStats, setJournalStats] = useState<{ total_attempts: number; total_savings: number; total_coins: number } | null>(null);
    const [journalLoading, setJournalLoading] = useState(false);

    const loadJournal = useCallback(async () => {
        setJournalLoading(true);
        try {
            const data = await api.get('/api/budget-challenge/history');
            setJournalHistory(data.history || []);
            setJournalStats({
                total_attempts: data.total_attempts || 0,
                total_savings: data.total_savings || 0,
                total_coins: data.total_coins || 0,
            });
        } catch (err) {
            console.error('Failed to load journal:', err);
        } finally {
            setJournalLoading(false);
        }
    }, []);

    useEffect(() => {
        if (pageTab === 'journal') {
            loadJournal();
        }
    }, [pageTab, loadJournal]);

    const applyLoadedData = (data: any) => {
        const sc: PlayScenario = data.scenario;
        setScenario(sc);
        setIsDaily(Boolean(data.is_daily));
        setChallengeDate(String(data.date || ''));
        setCompletedCount(Number(data.completed_scenarios_count || 0));

        if (data.already_completed_today && data.previous_attempt) {
            const prev = data.previous_attempt;
            setSelectedIds(prev.selected_item_ids || []);
            setIncludeSudden(Boolean(prev.included_sudden_expense));
            setReasoning(prev.reasoning || '');
            setResult({
                is_daily: true,
                total_spent: prev.total_spent,
                money_saved: prev.money_saved,
                starting_budget: sc.starting_budget,
                coins_earned: prev.coins_earned,
                xp_earned: prev.xp_earned,
                feedback: prev.feedback,
                reveal: prev.reveal,
            });
        } else {
            // Start with all planned items + sudden expense checked so kids visibly see the budget crunch and decide what to cut!
            setSelectedIds(sc.items.map(i => i.id));
            setIncludeSudden(true);
            setReasoning('');
            setResult(null);
        }
    };

    const loadDailyChallenge = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.get('/api/budget-challenge/daily');
            applyLoadedData(data);
        } catch (e: any) {
            setError(e.message || 'Could not load daily budgeting challenge.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPracticeScenario = async () => {
        setLoading(true);
        setError('');
        try {
            const exclude = scenario?.id ? `?excludeId=${scenario.id}` : '';
            const data = await api.get(`/api/budget-challenge/practice${exclude}`);
            applyLoadedData(data);
        } catch (e: any) {
            setError(e.message || 'Could not load practice scenario.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDailyChallenge();
    }, [loadDailyChallenge]);

    const toggleItem = (id: string) => {
        if (result) return;
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const itemsCost = scenario
        ? scenario.items.filter(i => selectedIds.includes(i.id)).reduce((s, i) => s + i.cost, 0)
        : 0;
    const suddenCost = scenario && includeSudden ? scenario.sudden_expense.cost : 0;
    const totalSpent = itemsCost + suddenCost;
    const startingBudget = scenario?.starting_budget || 0;
    const remainingBudget = startingBudget - totalSpent;
    const isOverBudget = remainingBudget < 0;
    const budgetUsagePct = startingBudget > 0 ? Math.min(100, Math.round((totalSpent / startingBudget) * 100)) : 0;

    const handleSubmit = async () => {
        if (!scenario || submitting) return;
        if (isOverBudget) {
            setError(
                `You are ₹${Math.abs(remainingBudget)} over your ₹${startingBudget} budget! Skip a Want item first to stay within budget.`
            );
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            const data = await api.post('/api/budget-challenge/submit', {
                scenario_id: scenario.id,
                selected_item_ids: selectedIds,
                include_sudden_expense: includeSudden,
                reasoning,
                is_daily: isDaily,
            });
            setResult(data);
            setCompletedCount(Number(data.completed_scenarios_count || completedCount));
            if (isDaily && (data.coins_earned > 0 || data.xp_earned > 0)) {
                addNotification(
                    'Daily Budget Challenge Complete!',
                    `Score: ${data.feedback?.needs_vs_wants_score || 0}/100 · Earned +${data.coins_earned} coins & +${data.xp_earned} XP!`,
                    'reward'
                );
                refreshUser();
            }
        } catch (e: any) {
            setError(e.message || 'Could not evaluate your budget plan.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">
                                Daily Challenge
                            </h2>
                            <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${isDaily
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                    }`}
                            >
                                {isDaily ? 'Refreshes Every Day' : 'Bonus AI Practice'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">
                            A fresh AI budgeting mission every day{user?.grade ? ` calibrated for ${user.grade}` : ''}—handle surprise costs, pick Needs over Wants &amp; get AI feedback!
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="bg-[#0F2744] border border-white/10 rounded-xl px-3.5 py-2 text-xs">
                        <span className="text-gray-400">Challenges Played: </span>
                        <span className="font-bold text-white">{completedCount}</span>
                    </div>
                    {isDaily && !result && (
                        <div className="bg-[#0F2744] border border-amber-500/25 rounded-xl px-3.5 py-2 text-xs flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-amber-300">Up to +100 coins</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Tabs: Today's Mission vs Past Scenarios Journal */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                    type="button"
                    onClick={() => setPageTab('today')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pageTab === 'today'
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-gray-950 shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Today&apos;s Challenge</span>
                </button>
                <button
                    type="button"
                    onClick={() => setPageTab('journal')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pageTab === 'journal'
                            ? 'bg-white text-gray-950 shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Past Scenarios Journal 📖</span>
                </button>
            </div>

            {/* TAB: PAST SCENARIOS JOURNAL */}
            {pageTab === 'journal' ? (
                <div className="space-y-6 animate-fade-in">
                    {/* Summary Header Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[#0F2744] border border-white/10">
                            <div className="text-xs text-gray-400">Total Missions Completed</div>
                            <div className="text-2xl font-black text-white mt-1">{journalStats?.total_attempts || 0}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#0F2744] border border-white/10">
                            <div className="text-xs text-gray-400">Total Money Saved</div>
                            <div className="text-2xl font-black text-emerald-400 mt-1">₹{Number(journalStats?.total_savings || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#0F2744] border border-white/10">
                            <div className="text-xs text-gray-400">Total Coins Earned</div>
                            <div className="text-2xl font-black text-amber-300 mt-1 flex items-center gap-1.5">
                                <Coins className="w-5 h-5 text-amber-400" />
                                <span>{Number(journalStats?.total_coins || 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {journalLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <MatrixLoader size="lg" variant="orbit" rounded />
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Loading your Decision Journal...</span>
                        </div>
                    ) : journalHistory.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl bg-[#0F2744] border border-white/10 space-y-3">
                            <PiggyBank className="w-12 h-12 text-gray-500 mx-auto" />
                            <h3 className="font-bold text-lg text-white">No Past Challenges Yet</h3>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">
                                Complete today&apos;s challenge and your smart budgeting decisions, savings notes, and AI advice will be archived here!
                            </p>
                            <button
                                type="button"
                                onClick={() => setPageTab('today')}
                                className="px-5 py-2.5 rounded-xl bg-amber-400 text-gray-950 font-bold text-xs hover:bg-amber-300 transition-colors cursor-pointer"
                            >
                                Play Today&apos;s Challenge
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {journalHistory.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className="p-5 rounded-2xl bg-[#0F2744] border border-white/10 space-y-3 hover:border-white/20 transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.scenario_emoji || '🎯'}</span>
                                            <div>
                                                <h4 className="font-bold text-base text-white">{item.scenario_title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                    <span>{item.date}</span>
                                                    <span>&bull;</span>
                                                    <span>Starting Budget: ₹{Number(item.starting_budget || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                                item.feedback?.verdict === 'EXCELLENT'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                    : item.feedback?.verdict === 'GOOD'
                                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                            }`}>
                                                {item.feedback?.verdict || 'COMPLETED'}
                                            </span>
                                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                +{item.coins_earned || 0} Coins
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reasoning & Savings */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-white/5">
                                        <div className="space-y-1">
                                            <span className="text-gray-400 font-medium">Your Reasoning:</span>
                                            <p className="text-gray-200 italic">&ldquo;{item.reasoning || 'Balanced essential needs first.'}&rdquo;</p>
                                        </div>
                                        <div className="space-y-1 sm:text-right">
                                            <span className="text-gray-400 font-medium">Money Saved: </span>
                                            <span className="font-bold text-emerald-400">₹{Number(item.money_saved || 0).toLocaleString('en-IN')}</span>
                                            <div className="text-[11px] text-gray-500">
                                                Total Spent: ₹{Number(item.total_spent || 0).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>

                                    {item.feedback?.what_went_well && (
                                        <div className="p-3 rounded-xl bg-white/5 text-xs text-gray-300 space-y-1">
                                            <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                                                <Lightbulb className="w-3.5 h-3.5" /> AI Feedback Tip
                                            </span>
                                            <p className="text-gray-300 text-[11px] leading-relaxed">
                                                {item.feedback.what_went_well} {item.feedback.how_to_manage_better}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}

            {pageTab === 'today' && (
                <>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-72 gap-3">
                    <MatrixLoader size="lg" variant="orbit" rounded />
                    <span className="text-xs text-gray-500 tracking-wider uppercase font-medium">
                        Crafting Today&apos;s Fresh AI Daily Challenge...
                    </span>
                </div>
            ) : !scenario ? (
                <div className="bg-[#0F2744] border border-white/10 rounded-3xl p-8 text-center space-y-4">
                    <p className="text-gray-300">{error || 'Unable to load scenario.'}</p>
                    <button
                        type="button"
                        onClick={loadDailyChallenge}
                        className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    {/* Mission Card + Live Budget Meter */}
                    <div className="bg-[#0F2744] border border-white/10 rounded-[28px] p-6 sm:p-7 space-y-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-1.5 max-w-2xl">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-gray-200 font-semibold">
                                        {scenario.category}
                                    </span>
                                    {scenario.is_ai_generated && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                                            <Sparkles className="w-3 h-3" /> Fresh AI Scenario
                                        </span>
                                    )}
                                    {challengeDate && (
                                        <span className="text-gray-500">
                                            {isDaily ? `Daily Challenge · ${challengeDate}` : 'Extra Practice Round'}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-heading font-black text-xl sm:text-2xl text-white flex items-center gap-2.5">
                                    <span className="text-3xl">{scenario.emoji}</span>
                                    <span>{scenario.title}</span>
                                </h3>
                                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                                    {scenario.purpose}
                                </p>
                            </div>

                            <div className="bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-right flex-shrink-0">
                                <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                                    Starting Budget
                                </div>
                                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                                    ₹{startingBudget}
                                </div>
                            </div>
                        </div>

                        {/* Live Wallet Progress Bar */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-gray-300">
                                    Planned Spend:{' '}
                                    <strong className={isOverBudget ? 'text-red-400' : 'text-white'}>
                                        ₹{totalSpent}
                                    </strong>{' '}
                                    <span className="text-gray-500">/ ₹{startingBudget}</span>
                                </span>
                                {isOverBudget ? (
                                    <span className="inline-flex items-center gap-1.5 font-bold text-red-400 text-xs sm:text-sm">
                                        <AlertTriangle className="w-4 h-4" /> Over Budget by ₹{Math.abs(remainingBudget)}! Drop a Want!
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 text-xs sm:text-sm">
                                        <PiggyBank className="w-4 h-4" /> Savings Left: ₹{remainingBudget}
                                    </span>
                                )}
                            </div>
                            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${isOverBudget
                                            ? 'bg-red-500'
                                            : budgetUsagePct > 85
                                                ? 'bg-amber-400'
                                                : 'bg-emerald-400'
                                        }`}
                                    style={{ width: `${budgetUsagePct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sudden Expense Curveball */}
                    <div
                        className={`rounded-[24px] p-5 sm:p-6 border transition-all ${includeSudden
                                ? 'bg-amber-500/10 border-amber-500/35'
                                : 'bg-[#0F2744] border-white/10'
                            }`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                                    <Zap className="w-4 h-4" /> Sudden Expense Curveball!
                                </div>
                                <h4 className="font-heading font-bold text-lg text-white">
                                    {scenario.sudden_expense.title} —{' '}
                                    <span className="font-mono text-amber-300">₹{scenario.sudden_expense.cost}</span>
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {scenario.sudden_expense.description}
                                </p>
                            </div>

                            {!result ? (
                                <button
                                    type="button"
                                    onClick={() => setIncludeSudden(prev => !prev)}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex-shrink-0 transition-all cursor-pointer border ${includeSudden
                                            ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                                            : 'bg-black/40 text-gray-300 border-white/15 hover:border-white/35'
                                        }`}
                                >
                                    {includeSudden
                                        ? `Paying ₹${scenario.sudden_expense.cost} ✓`
                                        : `Skipped (₹0) — Tap to Pay`}
                                </button>
                            ) : (
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span
                                        className={`text-xs font-bold px-3 py-1 rounded-full ${result.reveal.sudden_expense.is_essential
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : 'bg-amber-500/20 text-amber-300'
                                            }`}
                                    >
                                        {result.reveal.sudden_expense.is_essential
                                            ? 'Official: URGENT NEED'
                                            : 'Official: WANT TRAP'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        You: {result.reveal.sudden_expense.included ? 'Paid' : 'Skipped'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Play Decision Board OR Post-Submit Results */}
                    {!result ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="font-heading font-bold text-lg text-white">
                                    Choose What to Buy &amp; What to Skip
                                </h4>
                                <span className="text-xs text-gray-400">
                                    Tip: Keep the real Needs, skip Wants when budget gets tight!
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {scenario.items.map(item => {
                                    const selected = selectedIds.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleItem(item.id)}
                                            className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${selected
                                                    ? 'bg-white text-black border-white shadow-lg'
                                                    : 'bg-[#0F2744] text-gray-300 border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className={`font-bold text-base ${selected ? 'text-black' : 'text-white'}`}>
                                                        {item.name}
                                                    </div>
                                                    <p className={`text-xs mt-1 ${selected ? 'text-gray-600' : 'text-gray-400'}`}>
                                                        {item.hint}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`font-mono font-black text-base flex-shrink-0 ${selected ? 'text-black' : 'text-white'
                                                        }`}
                                                >
                                                    ₹{item.cost}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-current/10 text-xs font-bold">
                                                <span>{selected ? 'Included in Basket' : 'Skipped (Saved!)'}</span>
                                                <span>{selected ? 'Tap to Skip' : 'Tap to Include'}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Optional Reasoning */}
                            <div className="bg-[#0F2744] border border-white/10 rounded-2xl p-4 space-y-2">
                                <label
                                    htmlFor="budget-reason"
                                    className="block text-xs font-bold uppercase tracking-wider text-gray-400"
                                >
                                    Optional: Explain why you made this plan (AstraBot reads this!)
                                </label>
                                <input
                                    id="budget-reason"
                                    type="text"
                                    value={reasoning}
                                    onChange={e => setReasoning(e.target.value)}
                                    maxLength={250}
                                    placeholder="Example: I skipped the snacks and stickers so I could fix my bike tire and save ₹90!"
                                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-900/25 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || isOverBudget}
                                className="w-full py-4 rounded-2xl bg-white text-black font-bold text-base hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Sparkles className="w-5 h-5" />
                                {submitting
                                    ? 'AstraBot is Checking Your Choices...'
                                    : isOverBudget
                                        ? `Over Budget by ₹${Math.abs(remainingBudget)} — Skip an Item Above First`
                                        : `Lock In My Budget (Spend ₹${totalSpent} · Save ₹${remainingBudget})`}
                            </button>
                        </div>
                    ) : (
                        /* AI Coach Feedback & Needs vs. Wants Reveal */
                        <div className="space-y-5">
                            {/* Verdict Banner */}
                            <div
                                className={`rounded-[28px] p-6 sm:p-7 border ${result.feedback.verdict === 'EXCELLENT'
                                        ? 'bg-emerald-500/10 border-emerald-500/35'
                                        : result.feedback.verdict === 'GOOD'
                                            ? 'bg-sky-500/10 border-sky-500/35'
                                            : 'bg-amber-500/10 border-amber-500/35'
                                    }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        {result.feedback.made_right_choice ? (
                                            <CheckCircle2 className="w-9 h-9 text-emerald-400 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-9 h-9 text-amber-400 flex-shrink-0" />
                                        )}
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                                AI Money Coach Verdict · Score {result.feedback.needs_vs_wants_score}/100
                                            </div>
                                            <h4 className="font-heading font-black text-xl sm:text-2xl text-white">
                                                {result.feedback.headline}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {result.is_daily && (
                                            <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-center">
                                                <div className="text-lg font-black text-amber-300">
                                                    🪙 +{result.coins_earned}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase">Coins</div>
                                            </div>
                                        )}
                                        <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-center">
                                            <div className="text-lg font-black text-emerald-300">
                                                ₹{result.money_saved}
                                            </div>
                                            <div className="text-[10px] text-gray-400 uppercase">Saved</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                            <Trophy className="w-3.5 h-3.5" /> What You Did Well
                                        </div>
                                        <p className="text-sm text-gray-200 leading-relaxed">
                                            {result.feedback.what_went_well}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                                        <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                                            <Lightbulb className="w-3.5 h-3.5" /> How to Manage It Even Better
                                        </div>
                                        <p className="text-sm text-gray-200 leading-relaxed">
                                            {result.feedback.how_to_manage_better}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Needs vs. Wants Breakdown */}
                            <div className="bg-[#0F2744] border border-white/10 rounded-[24px] p-6 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="font-heading font-bold text-lg text-white">
                                        Needs vs. Wants Breakdown
                                    </h4>
                                    <span className="text-xs text-gray-400">
                                        Spent ₹{result.total_spent} · Saved ₹{result.money_saved}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {result.reveal.items.map(item => {
                                        const isNeed = item.type === 'NEED';
                                        const goodChoice = isNeed ? item.selected : !item.selected;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-4 rounded-2xl border ${goodChoice
                                                        ? 'bg-emerald-500/5 border-emerald-500/25'
                                                        : 'bg-amber-500/5 border-amber-500/25'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span
                                                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isNeed
                                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                                : 'bg-amber-500/20 text-amber-300'
                                                            }`}
                                                    >
                                                        {item.type}
                                                    </span>
                                                    <span className="font-mono text-sm font-bold text-white">
                                                        ₹{item.cost}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-sm text-white">{item.name}</div>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.hint}</p>
                                                <div className="mt-2 text-xs font-semibold">
                                                    {item.selected ? (
                                                        <span className={isNeed ? 'text-emerald-400' : 'text-amber-300'}>
                                                            ✓ You bought this {isNeed ? '(Smart Need!)' : '(Optional Want)'}
                                                        </span>
                                                    ) : (
                                                        <span className={!isNeed ? 'text-emerald-400' : 'text-red-400'}>
                                                            ✕ You skipped this {!isNeed ? '(Smart Save!)' : '(Missed Need!)'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-200 flex items-start gap-2.5">
                                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-white">Best Strategy: </span>
                                        {result.reveal.ideal_tip}
                                    </div>
                                </div>
                            </div>

                            {/* Next / Practice Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {!isDaily ? (
                                    <button
                                        type="button"
                                        onClick={loadDailyChallenge}
                                        className="px-5 py-3 rounded-xl bg-[#0F2744] border border-white/15 text-sm font-bold text-white hover:border-white/35 transition-colors cursor-pointer"
                                    >
                                        Back to Today&apos;s Daily Challenge
                                    </button>
                                ) : (
                                    <div className="text-xs text-gray-400">
                                        Today&apos;s daily coins claimed! Come back tomorrow for a new Daily Challenge, or try a bonus practice mission now.
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={loadPracticeScenario}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer ml-auto"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Play Another Scenario (Practice)
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
            </>
            )}
        </div>
    );
}
