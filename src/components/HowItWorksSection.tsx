import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedCounter } from './ui/AnimatedCounter';

export default function HowItWorksSection() {
    return (
        <section id="spotlight" className="py-24 md:py-32 bg-[#0D1B2A] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-14 observe-animate">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-[#0F2744] border border-[#1E3448] text-[11px] font-semibold tracking-wider text-[#D4EAF5] uppercase mb-6">
                        <span>Spotlight</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white max-w-3xl leading-[1.15]">
                            Helping young learners build real money &amp; digital safety habits
                        </h2>
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-[#8AAFC4] hover:text-white uppercase transition-colors flex-shrink-0"
                        >
                            <span>Start Exploring Free</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* 2-Column Spotlight Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left Card: Digital Safety Spotlight */}
                    <div 
                        className="lg:col-span-6 rounded-3xl bg-[#0F2744] border border-[#1E3448] p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors observe-animate"
                        style={{ transitionDelay: '0.08s' }}
                    >
                        <div>
                            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-[#5A8FA8] uppercase mb-6">
                                <span>DIGITAL SAFETY QUIZ</span>
                                <span>INTERACTIVE LEARNING</span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-medium text-white mb-4 leading-snug">
                                How kids learn to spot fake game scams, OTP traps, and sneaky links
                            </h3>

                            <p className="text-xs sm:text-sm text-[#8AAFC4] leading-relaxed font-normal mb-8">
                                Alongside our Weekly Money Smarts Quiz, AstraMinds includes a dedicated Digital Money Safety Quiz. Kids practice saying &ldquo;no&rdquo; to fake prize pop-ups, keeping OTPs and PINs secret, and checking with parents before any online spend.
                            </p>

                            <Link
                                to="/dashboard/safety-quiz"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-white hover:text-[#D4EAF5] transition-colors mb-8"
                            >
                                <span>Try the Digital Safety Quiz</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {/* Bottom Metric Tiles */}
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-900">
                            <div>
                                <div className="text-4xl font-sans font-bold text-white mb-1">
                                    <AnimatedCounter value={100} suffix="%" duration={1600} />
                                </div>
                                <div className="text-xs text-[#5A8FA8] leading-snug">
                                    Age-appropriate scenarios on OTPs, passwords &amp; game safety
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-sans font-bold text-white mb-1">
                                    <AnimatedCounter value={200} prefix="+" duration={1800} />
                                </div>
                                <div className="text-xs text-[#5A8FA8] leading-snug">
                                    Gold Coins awarded each week for mastering safety skills
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Digital Safety Mockup + Teacher Quote */}
                    <div 
                        className="lg:col-span-6 flex flex-col gap-6 observe-animate"
                        style={{ transitionDelay: '0.16s' }}
                    >
                        <div className="rounded-3xl bg-[#0F2744] border border-[#1E3448] p-6 sm:p-7 flex-1 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                            <div className="p-4 rounded-2xl bg-[#0F2744] border border-[#1E3448] space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <span className="font-semibold text-white">Scam Trap Blocked</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#5A8FA8]">QUIZ CHALLENGE</span>
                                </div>

                                <div className="p-3 rounded-xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-xs font-bold text-white">
                                            &ldquo;Claim 5,000 Free Coins — Enter Parent OTP Now&rdquo;
                                        </div>
                                        <div className="text-[11px] text-[#8AAFC4] mt-0.5">Player Action: Closed pop-up &amp; asked a parent</div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex-shrink-0">
                                        +40 Coins
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-[#8AAFC4] pt-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Golden Rule: Never share OTPs, PINs, or passwords online</span>
                                </div>
                            </div>

                            {/* Quote Card */}
                            <div className="pt-6 mt-4 border-t border-zinc-900">
                                <p className="text-xs sm:text-sm text-[#D4EAF5] leading-relaxed font-normal mb-4">
                                    &ldquo;Kids today encounter in-game coins and sneaky links long before high school. AstraMinds turns both saving pocket money and staying safe online into fun weekly challenges my students genuinely look forward to.&rdquo;
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="/game_avatar.png"
                                            alt="Meera Iyer"
                                            className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                                        />
                                        <div>
                                            <div className="text-xs font-semibold text-white">Meera Iyer</div>
                                            <div className="text-[11px] text-[#5A8FA8]">Middle School Math Teacher</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono tracking-widest text-[#5A8FA8] uppercase">
                                        EDUCATOR
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
