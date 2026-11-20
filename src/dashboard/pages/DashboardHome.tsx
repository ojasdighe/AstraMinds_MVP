import { Link } from 'react-router-dom';
import { Brain, ShieldCheck, ArrowRight, Layers, Wallet } from 'lucide-react';
import MatrixLoader from '../../components/ui/MatrixLoader';
import UserSummaryCard from '../components/UserSummaryCard';
import AstraMindsDebitCard from '../components/AstraMindsDebitCard';
import LeaderboardCard from '../components/LeaderboardCard';
import SavingGraphCard from '../components/SavingGraphCard';
import TodaysMissionBanner from '../components/TodaysMissionBanner';
import { useDashboard } from '../DashboardLayout';

export default function DashboardHome() {
    const { loading } = useDashboard();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <MatrixLoader size="lg" variant="orbit" rounded />
                <span className="text-xs text-[#0BBFBF] tracking-wider uppercase font-medium">Loading Dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-8">
            {/* Header Area */}
            <div className="mb-2">
                <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight">
                    My Money Hub
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-base sm:text-lg">
                    Track your savings goals, pocket money, streaks, and digital safety superpowers.
                </p>
            </div>

            {/* Today's Mission & Guided Starter Checklist */}
            <TodaysMissionBanner />

            {/* Quick Quiz Challenges (Ages 8-14) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Money Smarts Quiz — coral/pink theme for quizzes */}
                <Link
                    to="/dashboard/quiz"
                    className="group rounded-2xl bg-white dark:bg-[#122236] border-l-4 border-l-[#FF6B9D] border-y border-r border-[#F1F5F9] dark:border-[#1E3448] hover:border-[#FF6B9D]/60 p-5 flex items-center justify-between gap-4 transition-all hover:shadow-[0_4px_20px_rgba(255,107,157,0.2)]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF6B9D]/12 text-[#FF6B9D] flex items-center justify-center flex-shrink-0">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-[#FF6B9D]">Weekly Challenge</div>
                            <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Money Smarts Quiz</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Earn up to 200 coins mastering saving &amp; smart shopping.</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#FF6B9D] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>

                {/* Digital Safety Quiz — green theme for success/goals */}
                <Link
                    to="/dashboard/safety-quiz"
                    className="group rounded-2xl bg-white dark:bg-[#122236] border-l-4 border-l-[#10B981] border-y border-r border-[#F1F5F9] dark:border-[#1E3448] hover:border-[#10B981]/60 p-5 flex items-center justify-between gap-4 transition-all hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#10B981]/12 text-[#10B981] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">Safety Challenge</div>
                            <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Digital Money Safety Quiz</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Spot fake links, guard OTPs &amp; earn up to 200 coins!</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#10B981] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>

                {/* Money Smarts Flashcards — teal/cyan theme */}
                <Link
                    to="/dashboard/flashcards"
                    className="group rounded-2xl bg-white dark:bg-[#122236] border-l-4 border-l-[#0BBFBF] border-y border-r border-[#F1F5F9] dark:border-[#1E3448] hover:border-[#0BBFBF]/60 p-5 flex items-center justify-between gap-4 transition-all hover:shadow-[0_4px_20px_rgba(11,191,191,0.2)]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#0BBFBF]/12 text-[#0BBFBF] flex items-center justify-center flex-shrink-0">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-[#0BBFBF]">Interactive Cards</div>
                            <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Money Smarts Flashcards</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Flip &amp; learn 24 key money words with real-life examples.</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#0BBFBF] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>

                {/* Daily Challenge — orange theme for rewards/energy */}
                <Link
                    to="/dashboard/budget-challenge"
                    className="group rounded-2xl bg-white dark:bg-[#122236] border-l-4 border-l-[#FF7A2F] border-y border-r border-[#F1F5F9] dark:border-[#1E3448] hover:border-[#FF7A2F]/60 p-5 flex items-center justify-between gap-4 transition-all hover:shadow-[0_4px_20px_rgba(255,122,47,0.2)]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF7A2F]/12 text-[#FF7A2F] flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-[#FF7A2F]">Refreshes Every Day · AI Powered</div>
                            <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Daily Challenge</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fresh daily budget surprise—balance Needs vs. Wants &amp; get AI coaching!</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#FF7A2F] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
            </div>

            {/* Main Content Grid: 60/40 Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Left Column (takes 2 of 3 col span) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UserSummaryCard />
                        <AstraMindsDebitCard />
                    </div>
                    <SavingGraphCard />
                </div>

                {/* Right Column (takes 1 of 3 col span) */}
                <div className="space-y-6">
                    <div className="sticky top-6">
                        <LeaderboardCard />
                    </div>
                </div>

            </div>
        </div>
    );
}
