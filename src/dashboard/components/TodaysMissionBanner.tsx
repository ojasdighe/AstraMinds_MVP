import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, CheckCircle2, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useDashboard } from '../DashboardLayout';

export default function TodaysMissionBanner() {
    const { user } = useDashboard();
    const [dismissedGuide, setDismissedGuide] = useState(() => {
        return localStorage.getItem('astraminds_ftue_dismissed') === 'true';
    });
    const [guideExpanded, setGuideExpanded] = useState(true);

    // Track checklist items
    const [completedSteps, setCompletedSteps] = useState<{ goal: boolean; quiz: boolean; tracker: boolean }>({
        goal: false,
        quiz: false,
        tracker: false,
    });

    useEffect(() => {
        const saved = localStorage.getItem('astraminds_ftue_progress');
        if (saved) {
            try {
                setCompletedSteps(JSON.parse(saved));
            } catch (_) {}
        }
    }, []);

    const toggleStep = (step: 'goal' | 'quiz' | 'tracker') => {
        setCompletedSteps(prev => {
            const next = { ...prev, [step]: !prev[step] };
            localStorage.setItem('astraminds_ftue_progress', JSON.stringify(next));
            return next;
        });
    };

    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const allCompleted = completedCount === 3;

    return (
        <div className="space-y-4">
            {/* ── Today's Primary Mission Banner ────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F2744] via-[#132C4A] to-[#0A3A54] border border-[#0BBFBF]/30 p-5 sm:p-6 shadow-[0_8px_30px_rgba(11,191,191,0.15)] group hover:border-[#0BBFBF]/60 transition-all">
                {/* Background decorative glows */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold tracking-wider uppercase border border-cyan-400/30">
                                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                Today&apos;s Mission
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                +50 Coins &bull; +30 XP
                            </span>
                            <span className="text-[11px] text-cyan-200/70 font-mono hidden sm:inline">
                                Refreshes Daily
                            </span>
                        </div>

                        <h3 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
                            Complete the 2-min Scam Spotter Quiz &amp; Guard Your OTP
                        </h3>
                        <p className="text-xs sm:text-sm text-cyan-100/80 leading-relaxed font-normal">
                            Test your digital safety superpowers! Spot fake game-gem links, learn the OTP golden rule, and level up your avatar rank.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Link
                            to="/dashboard/safety-quiz"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 text-gray-950 font-bold text-sm sm:text-base hover:shadow-[0_0_25px_rgba(11,191,191,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-center"
                        >
                            <span>Start Mission</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── First-Day Mission (Coachmarks / 3-Step Starter Guide) ───────── */}
            {!dismissedGuide && (
                <div className="rounded-2xl bg-[#0c1a2c]/80 border border-[#1E3448] p-4 sm:p-5 transition-all">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm sm:text-base text-white">
                                        Welcome, {user?.nickname || user?.full_name || 'Young Saver'}! First-Day Mission
                                    </h4>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                                        {completedCount}/3 Done
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Complete these 3 starter habits to kick off your smart money journey!
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setGuideExpanded(!guideExpanded)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                aria-label="Toggle Guide"
                            >
                                {guideExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDismissedGuide(true);
                                    localStorage.setItem('astraminds_ftue_dismissed', 'true');
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                aria-label="Dismiss Guide"
                                title="Dismiss checklist"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#16273a] h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(completedCount / 3) * 100}%` }}
                        />
                    </div>

                    {/* Expandable Step List */}
                    {guideExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#1E3448]/60">
                            {/* Step 1: Goal */}
                            <div className={`p-3.5 rounded-xl border transition-all ${
                                completedSteps.goal ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-[#0F2236] border-[#1E3448] hover:border-cyan-500/40'
                            }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🎯</span>
                                        <span className="text-xs font-bold text-white">Step 1: Dream Goal</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleStep('goal')}
                                        className="cursor-pointer text-gray-400 hover:text-emerald-400 transition-colors"
                                    >
                                        <CheckCircle2 className={`w-4 h-4 ${completedSteps.goal ? 'text-emerald-400' : 'text-gray-500'}`} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                                    Pick an awesome target (bike, books, science kit) and create your first jar.
                                </p>
                                <Link
                                    to="/dashboard/goals"
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                                >
                                    <span>Open Goals</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {/* Step 2: Safety Quiz */}
                            <div className={`p-3.5 rounded-xl border transition-all ${
                                completedSteps.quiz ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-[#0F2236] border-[#1E3448] hover:border-cyan-500/40'
                            }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🛡️</span>
                                        <span className="text-xs font-bold text-white">Step 2: Safety Quiz</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleStep('quiz')}
                                        className="cursor-pointer text-gray-400 hover:text-emerald-400 transition-colors"
                                    >
                                        <CheckCircle2 className={`w-4 h-4 ${completedSteps.quiz ? 'text-emerald-400' : 'text-gray-500'}`} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                                    Learn to spot fake free gem links, protect OTPs &amp; earn 50 Gold Coins.
                                </p>
                                <Link
                                    to="/dashboard/safety-quiz"
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                                >
                                    <span>Take Safety Quiz</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {/* Step 3: Tracker */}
                            <div className={`p-3.5 rounded-xl border transition-all ${
                                completedSteps.tracker ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-[#0F2236] border-[#1E3448] hover:border-cyan-500/40'
                            }`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">💰</span>
                                        <span className="text-xs font-bold text-white">Step 3: Pocket Money</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleStep('tracker')}
                                        className="cursor-pointer text-gray-400 hover:text-emerald-400 transition-colors"
                                    >
                                        <CheckCircle2 className={`w-4 h-4 ${completedSteps.tracker ? 'text-emerald-400' : 'text-gray-500'}`} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                                    Record an allowance or chore reward to start seeing your balance grow.
                                </p>
                                <Link
                                    to="/dashboard/tracker"
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                                >
                                    <span>Log Pocket Money</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {allCompleted && (
                        <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 font-semibold">
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                Outstanding! You completed all 3 starter missions!
                            </span>
                            <span className="text-amber-300 font-bold">🏆 First Mission Master</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
