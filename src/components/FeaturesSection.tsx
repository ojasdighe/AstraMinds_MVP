import { useState } from 'react';
import { Target, PieChart, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, BookOpen, Mic, AlertTriangle, Layers, Wallet } from 'lucide-react';
import { AnimatedCounter } from './ui/AnimatedCounter';

export default function FeaturesSection() {
    const [activeTab, setActiveTab] = useState<'goals' | 'tracker' | 'safety' | 'flashcards' | 'ai'>('goals');

    const tabs = [
        { id: 'goals', label: 'Savings Goals', icon: Target },
        { id: 'tracker', label: 'Pocket Money Tracker', icon: PieChart },
        { id: 'safety', label: 'Digital Money Safety Quiz', icon: ShieldCheck },
        { id: 'flashcards', label: 'Flashcards & Daily Challenge', icon: Layers },
        { id: 'ai', label: 'AstraBot', icon: Sparkles },
    ] as const;

    return (
        <section id="features" className="py-24 md:py-32 bg-[#0D1B2A] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-14 observe-animate">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-[#0F2744] border border-[#1E3448] text-[11px] font-semibold tracking-wider text-[#D4EAF5] uppercase mb-6">
                        <span>Features</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-7">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-[1.15]">
                                What young learners practice every day
                            </h2>
                        </div>
                        <div className="lg:col-span-5">
                            <p className="text-sm sm:text-base text-[#8AAFC4] leading-relaxed font-normal">
                                No confusing bank jargon. Just hands-on pocket-money goals, fun money &amp; digital safety quizzes, and friendly coaching designed for young savers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabbed Interactive Feature Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Navigation Tabs */}
                    <div className="lg:col-span-4 flex flex-col space-y-1 observe-animate" style={{ transitionDelay: '0.05s' }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between text-sm cursor-pointer ${
                                        isActive
                                            ? 'bg-[#0F2744] text-white font-semibold border-l-2 border-violet-400 shadow-sm'
                                            : 'text-[#8AAFC4] hover:text-[#D4EAF5] hover:bg-[#0F2744]/40 border-l-2 border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {tab.id === 'ai' ? (
                                            <img src="/AstraMinds.ico" alt="AI" className="w-4 h-4 rounded-sm object-cover" />
                                        ) : (
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5A8FA8]'}`} />
                                        )}
                                        <span>{tab.label}</span>
                                    </div>
                                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Large Feature Card Showcase */}
                    <div 
                        className="lg:col-span-8 rounded-3xl bg-[#0F2744] border border-[#1E3448] p-6 sm:p-8 min-h-[500px] flex flex-col justify-between observe-animate hover:border-zinc-700 transition-colors"
                        style={{ transitionDelay: '0.1s' }}
                    >
                        {/* Tab 1: Savings Goals */}
                        {activeTab === 'goals' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                                        Savings Goals &amp; Auto-Save Habits
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#8AAFC4] leading-relaxed max-w-2xl">
                                        Pick something awesome—like a bicycle, science kit, or comic collection—set a weekly target, protect your daily streak, and watch your piggy bank bar fill up.
                                    </p>
                                </div>

                                {/* Mockup Container */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {/* Mockup Card 1: Goal Overview */}
                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8AAFC4] font-semibold px-2 py-0.5 rounded-full bg-[#122236]/60">
                                                Active Goal
                                            </span>
                                            <span className="text-xs font-mono font-bold text-white">
                                                <AnimatedCounter value={78} suffix="% Complete" duration={1500} />
                                            </span>
                                        </div>

                                        <div>
                                            <div className="text-base font-bold text-white">🚲 Mountain Bicycle Fund</div>
                                            <div className="text-xs text-[#8AAFC4] mt-0.5">
                                                Target: ₹4,500 · Saved: <AnimatedCounter value={3510} formatNumber prefix="₹" duration={1600} />
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-[#122236] rounded-full h-2 overflow-hidden">
                                            <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: '78%' }} />
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-[#8AAFC4] pt-1">
                                            <span>Auto-Save: ₹350/week</span>
                                            <span className="text-emerald-400 font-medium">On Track</span>
                                        </div>
                                    </div>

                                    {/* Mockup Card 2: Smart Habit Settings */}
                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8AAFC4] font-semibold block">
                                            Smart Saving Plan
                                        </span>

                                        <div className="space-y-2 text-xs">
                                            <div className="p-2.5 rounded-xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#8AAFC4]">Schedule</span>
                                                <span className="font-semibold text-white">Every Sunday</span>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#8AAFC4]">24-Hour Pause Rule</span>
                                                <span className="font-semibold text-emerald-400">Helps Skip Wants</span>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#8AAFC4]">Streak Shield</span>
                                                <span className="font-semibold text-white">Active (+50 XP/day)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Pocket Money Tracker */}
                        {activeTab === 'tracker' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                                        Pocket Money Tracker &amp; Category Limits
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#8AAFC4] leading-relaxed max-w-2xl">
                                        See where your allowance, chore rewards, and birthday gift money go. Compare Needs vs. Wants across snacks, comics, and games in seconds.
                                    </p>
                                </div>

                                {/* Mockup Container */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {/* Mockup Card 1: Weekly Limit */}
                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8AAFC4] font-semibold px-2 py-0.5 rounded-full bg-[#122236]/60">
                                                Monthly Pocket Money
                                            </span>
                                            <span className="text-xs font-mono font-bold text-white">
                                                <AnimatedCounter value={62} suffix="% Used" duration={1500} />
                                            </span>
                                        </div>

                                        <div>
                                            <div className="text-2xl font-mono font-bold text-white">
                                                <AnimatedCounter value={310} formatNumber prefix="₹" suffix=".00" duration={1600} />
                                            </div>
                                            <div className="text-xs text-[#8AAFC4] mt-0.5">Budget cap: ₹500.00 · Left to save: ₹190.00</div>
                                        </div>

                                        <div className="w-full bg-[#122236] rounded-full h-2 overflow-hidden">
                                            <div className="bg-zinc-300 h-full rounded-full transition-all duration-1000" style={{ width: '62%' }} />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#8AAFC4]">
                                            <div className="p-2 rounded-lg bg-[#0F2744] text-center">
                                                <span className="block text-[10px] text-[#5A8FA8]">Snacks</span>
                                                <span className="font-semibold text-white">₹120</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#0F2744] text-center">
                                                <span className="block text-[10px] text-[#5A8FA8]">Books</span>
                                                <span className="font-semibold text-white">₹110</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#0F2744] text-center">
                                                <span className="block text-[10px] text-[#5A8FA8]">Games</span>
                                                <span className="font-semibold text-white">₹80</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mockup Card 2: Recent Pocket Money Log */}
                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                        <div className="flex items-center gap-2 text-white font-semibold text-xs">
                                            <BookOpen className="w-4 h-4 text-[#8AAFC4]" />
                                            <span>Quick Pocket Money Entry</span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-[#0F2744] border border-[#1E3448] space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-[#8AAFC4]">Where</span>
                                                <span className="text-white font-semibold">School Book Fair</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#8AAFC4]">Amount</span>
                                                <span className="font-mono text-emerald-400 font-bold">₹110.00</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#8AAFC4]">Category</span>
                                                <span className="text-[#D4EAF5]">Books &amp; Comics</span>
                                            </div>
                                            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Saved from Pocket Money Jar</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Digital Money Safety Quiz */}
                        {activeTab === 'safety' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                                        Digital Money Safety Quiz &amp; Scam Spotter
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#8AAFC4] leading-relaxed max-w-2xl">
                                        Practice spotting fake free-gems pop-ups, OTP &amp; PIN traps, and sneaky in-game purchases in a safe sandbox—and earn Gold Coins for every smart choice.
                                    </p>
                                </div>

                                {/* Mockup Container */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {/* Mockup Card 1: Scam Alert Challenge */}
                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                                Scam Spotter Challenge
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#122236] text-[#D4EAF5]">
                                                INTERACTIVE
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-[#0F2744] border border-[#1E3448] space-y-2 text-xs">
                                            <div className="text-[#D4EAF5] font-medium">
                                                &ldquo;FREE 10,000 GEMS! Just type your parent&apos;s card PIN and OTP below!&rdquo;
                                            </div>
                                            <div className="pt-2 border-t border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#8AAFC4]">Safe Choice</span>
                                                <span className="text-emerald-400 font-bold">Close &amp; Tell a Parent</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#8AAFC4]">Quiz Reward</span>
                                                <span className="text-amber-400 font-mono font-semibold">+200 Gold Coins</span>
                                            </div>
                                        </div>

                                        <div className="text-[11px] text-[#8AAFC4]">
                                            <span>5 interactive scenarios · Instant explanations</span>
                                        </div>
                                    </div>

                                    {/* Mockup Card 2: Key Rules Covered */}
                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8AAFC4] font-semibold block">
                                            Safety Topics Covered
                                        </span>

                                        <div className="space-y-2 text-xs">
                                            <div className="p-2.5 rounded-xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#D4EAF5]">🔐 OTP &amp; PIN Guard</span>
                                                <span className="text-emerald-400 font-medium">Never Share</span>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#D4EAF5]">🎮 In-Game Purchase Traps</span>
                                                <span className="text-emerald-400 font-medium">Ask Parent First</span>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#D4EAF5]">🕵️ Phishing &amp; Fake Links</span>
                                                <span className="text-emerald-400 font-medium">Spot &amp; Block</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Flashcards & Daily Challenge */}
                        {activeTab === 'flashcards' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                                        Flip Flashcards &amp; AI Daily Challenge
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#8AAFC4] leading-relaxed max-w-2xl">
                                        Flip interactive money terminology cards to master key ideas, then solve a fresh AI-generated Daily Challenge every day with personalized Needs vs. Wants coaching.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5" />
                                                Interactive 3D Flashcards
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#122236] text-[#D4EAF5]">
                                                24 TERMS
                                            </span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-[#0F2744] border border-[#1E3448] space-y-1.5 text-xs">
                                            <div className="font-bold text-white">⚖️ Opportunity Cost</div>
                                            <p className="text-[#8AAFC4] leading-relaxed">
                                                Spending ₹200 on arcade tokens means giving up ₹200 toward your new storybook!
                                            </p>
                                        </div>
                                        <div className="text-[11px] text-[#8AAFC4]">
                                            Flip &amp; unflip cards · Save · Spend · Safety decks
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                                <Wallet className="w-3.5 h-3.5" />
                                                Daily Challenge
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#122236] text-[#D4EAF5]">
                                                REFRESHES DAILY
                                            </span>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-[#0F2744] border border-[#1E3448] space-y-2 text-xs">
                                            <div className="text-[#D4EAF5] font-medium">
                                                ⚡ New AI-crafted surprise expense mission generated every single day!
                                            </div>
                                            <div className="pt-2 border-t border-[#1E3448] flex items-center justify-between">
                                                <span className="text-[#8AAFC4]">AI Coach Check</span>
                                                <span className="text-emerald-400 font-bold">Needs Covered · ₹90 Saved</span>
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-[#8AAFC4]">
                                            Brand-new daily mission · AI explains how to improve
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 5: AstraBot */}
                        {activeTab === 'ai' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-medium text-white mb-2">
                                        AstraBot — Friendly Money &amp; Safety Coach
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#8AAFC4] leading-relaxed max-w-2xl">
                                        Ask simple questions by typing or using your voice! Get kid-friendly tips on pocket money, saving goals, and staying safe from online tricks.
                                    </p>
                                </div>

                                {/* Mockup Container */}
                                <div className="p-5 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                    {/* User message */}
                                    <div className="flex items-start gap-3 justify-end">
                                        <div className="p-3 rounded-2xl rounded-tr-sm bg-[#122236] text-white text-xs max-w-md">
                                            Can I buy a ₹500 board game without delaying my Mountain Bicycle goal?
                                        </div>
                                    </div>

                                    {/* AI Response */}
                                    <div className="flex items-start gap-3">
                                        <img src="/AstraMinds.ico" alt="AstraBot" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                        <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#0F2744] border border-[#1E3448] text-[#D4EAF5] text-xs max-w-lg space-y-2">
                                            <p>
                                                Great question! You have <strong className="text-white">₹650</strong> left in your Pocket Money Jar right now:
                                            </p>
                                            <ul className="list-disc list-inside space-y-1 text-[#8AAFC4] text-[11px]">
                                                <li>If you use ₹500 today, your bicycle goal takes <strong className="text-amber-400">1 extra week</strong>.</li>
                                                <li>Try waiting 24 hours—or earn +200 coins in today&apos;s quizzes first!</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Voice Input bar */}
                                    <div className="pt-2 flex items-center justify-between text-xs border-t border-[#1E3448]">
                                        <div className="flex items-center gap-2 text-[#8AAFC4]">
                                            <Mic className="w-3.5 h-3.5 text-[#D4EAF5]" />
                                            <span>Voice Input supported · Clear, simple answers</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#5A8FA8] uppercase">
                                            KID-SAFE COACH
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Feature Navigation Footer */}
                        <div className="pt-6 border-t border-[#1E3448] flex items-center justify-between text-xs text-[#5A8FA8]">
                            <span>Built with zero ads and zero real-bank risk</span>
                            <span className="font-mono text-[#8AAFC4]">100% SAFE SANDBOX</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
