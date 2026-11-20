import { AnimatedCounter } from './ui/AnimatedCounter';
import { ClipboardCheck } from 'lucide-react';

export default function SolutionSection() {
    return (
        <section id="why-AstraMinds" className="py-24 md:py-32 bg-[#0D1B2A] text-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="mb-14 observe-animate">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F2744] border border-[#1E3448] text-xs font-semibold tracking-wider text-[#0BBFBF] uppercase mb-6">
                        <ClipboardCheck className="w-4 h-4 text-[#0BBFBF]" />
                        <span>Concept Testing &amp; Student-Parent Survey Findings</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight text-white max-w-4xl leading-[1.15] mb-4">
                        &ldquo;Every coin saved builds smart habits for tomorrow —{' '}
                        <span className="text-[#5A8FA8]">
                            goals reached, pocket money tracked, and online scams spotted early.&rdquo;
                        </span>
                    </h2>
                    <p className="text-sm sm:text-base text-[#8AAFC4] max-w-3xl font-normal leading-relaxed">
                        Insights, feedback, and key findings gathered during our pre-launch concept validation interviews, family prototype testing, and educational surveys with students and parents.
                    </p>
                </div>

                {/* Bento Grid with Scroll Animations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {/* Card 1: ₹4,500 Goal Milestone (4 cols) */}
                    <div
                        className="lg:col-span-4 rounded-3xl bg-zinc-950 border border-[#1E3448] p-8 flex flex-col justify-between relative overflow-hidden group min-h-[280px] observe-animate hover:border-zinc-700 transition-colors"
                        style={{ transitionDelay: '0.05s' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 via-zinc-900/40 to-black pointer-events-none" />
                        <div className="relative z-10">
                            <div className="text-6xl font-sans font-bold tracking-tight text-white mb-2">
                                <AnimatedCounter value={4500} formatNumber prefix="₹" duration={2000} />
                            </div>
                            <p className="text-xs text-[#8AAFC4] font-medium leading-relaxed">
                                Average aspirational savings milestone set by student testers during concept trials (e.g. bicycle or science kit).
                            </p>
                        </div>
                        <div className="relative z-10 pt-10 flex items-center justify-between text-[11px] font-mono tracking-widest text-[#5A8FA8] uppercase">
                            <span>PROTOTYPE TEST GOAL</span>
                            <span className="text-zinc-600">01</span>
                        </div>
                    </div>

                    {/* Card 2: 94% Completion Rate (3 cols) */}
                    <div
                        className="lg:col-span-3 rounded-3xl bg-[#0F2744] border border-[#1E3448] p-8 flex flex-col justify-between min-h-[280px] observe-animate hover:border-zinc-700 transition-colors"
                        style={{ transitionDelay: '0.1s' }}
                    >
                        <div>
                            <div className="text-6xl font-sans font-bold tracking-tight text-white mb-2">
                                <AnimatedCounter value={94} suffix="%" duration={1800} />
                            </div>
                            <p className="text-xs text-[#8AAFC4] font-medium leading-relaxed">
                                Of surveyed parents agreed gamified scenarios helped their kids grasp Needs vs. Wants faster than school lectures.
                            </p>
                        </div>
                        <div className="pt-10 text-[11px] font-mono tracking-widest text-[#5A8FA8] uppercase">
                            SURVEY APPROVAL
                        </div>
                    </div>

                    {/* Card 3: Parent Interview Feedback (5 cols) */}
                    <div
                        className="lg:col-span-5 rounded-3xl bg-[#0F2744] border border-[#1E3448] p-8 flex flex-col justify-between min-h-[280px] observe-animate hover:border-zinc-700 transition-colors"
                        style={{ transitionDelay: '0.15s' }}
                    >
                        <p className="text-sm sm:text-base text-[#D4EAF5] leading-relaxed font-normal">
                            &ldquo;During the concept walkthrough, my 11-year-old immediately understood why waiting 24 hours stops impulse buys. Seeing him ask questions about fake game currency proved how badly kids need practical digital money safety.&rdquo;
                        </p>
                        <div className="pt-6 flex items-center justify-between border-t border-zinc-900 mt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#1A365D] border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                                    PS
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-white">Parent Focus Group Participant</div>
                                    <div className="text-[11px] text-[#5A8FA8]">Parent of Grade 6 Student · Mumbai</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono tracking-wider text-[#5A8FA8] uppercase">
                                CONCEPT INTERVIEW
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Young Saver Tester Feedback (6 cols) */}
                    <div
                        className="lg:col-span-6 rounded-3xl bg-[#0F2744] border border-[#1E3448] p-8 flex flex-col justify-between min-h-[260px] observe-animate hover:border-zinc-700 transition-colors"
                        style={{ transitionDelay: '0.2s' }}
                    >
                        <p className="text-sm sm:text-base text-[#D4EAF5] leading-relaxed font-normal">
                            &ldquo;Testing the prototype was really fun! Instead of boring math, I had to choose between snacks and saving for a bicycle. Spotting the fake free-diamonds scam popup on the quiz felt like a real game challenge.&rdquo;
                        </p>
                        <div className="pt-6 flex items-center justify-between border-t border-zinc-900 mt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#1A365D] border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-xs">
                                    AM
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-white">Student Prototype Tester</div>
                                    <div className="text-[11px] text-[#5A8FA8]">Age 12 · Grade 7 Participant</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono tracking-wider text-[#5A8FA8] uppercase">
                                STUDENT TESTER
                            </span>
                        </div>
                    </div>

                    {/* Card 5: Sandbox Safety Confidence (3 cols) */}
                    <div
                        className="lg:col-span-3 rounded-3xl bg-[#0F2744] border border-[#1E3448] p-8 flex flex-col justify-between min-h-[260px] observe-animate hover:border-zinc-700 transition-colors"
                        style={{ transitionDelay: '0.25s' }}
                    >
                        <div>
                            <div className="text-6xl font-sans font-bold tracking-tight text-white mb-2">
                                <AnimatedCounter value={100} suffix="%" duration={1800} />
                            </div>
                            <p className="text-xs text-[#8AAFC4] font-medium leading-relaxed">
                                Of interviewed parents preferred a safe, simulated sandbox without real bank links or commercial ads.
                            </p>
                        </div>
                        <div className="pt-6 text-[11px] font-mono tracking-widest text-[#5A8FA8] uppercase">
                            PARENT CONFIDENCE
                        </div>
                    </div>

                    {/* Card 6: Concept Rating (3 cols) */}
                    <div
                        className="lg:col-span-3 rounded-3xl bg-[#0F2744] border border-[#1E3448] p-8 flex flex-col justify-between min-h-[260px] observe-animate hover:border-zinc-700 transition-colors"
                        style={{ transitionDelay: '0.3s' }}
                    >
                        <div>
                            <div className="text-6xl font-sans font-bold tracking-tight text-white mb-2">
                                <AnimatedCounter value={4.9} decimals={1} suffix="★" duration={1600} />
                            </div>
                            <p className="text-xs text-[#8AAFC4] font-medium leading-relaxed">
                                Average relevance rating from 100+ surveyed families looking for structured youth money literacy.
                            </p>
                        </div>
                        <div className="pt-6 text-[11px] font-mono tracking-widest text-[#5A8FA8] uppercase">
                            SURVEY RATING
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
