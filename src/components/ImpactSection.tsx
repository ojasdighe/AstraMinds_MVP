import { Newspaper, TrendingUp, ShieldAlert, Brain } from 'lucide-react';
import { StaggerTestimonials } from './ui/stagger-testimonials';

export default function ImpactSection() {
    return (
        <section id="about" className="py-24 md:py-32 bg-[#0D1B2A] text-white relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0BBFBF]/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
                <div className="observe-animate text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0BBFBF]/10 border border-[#0BBFBF]/30 text-[#0BBFBF] text-xs font-bold uppercase tracking-wider mb-4">
                        <Newspaper className="w-4 h-4" />
                        <span>Headlines &amp; Research</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight text-white mb-4 leading-[1.15] max-w-4xl">
                        Why Financial Literacy for Kids Can&apos;t Wait
                    </h2>
                    <p className="text-sm sm:text-base text-[#8AAFC4] max-w-3xl font-normal leading-relaxed mb-8">
                        From digital gaming scams to money habits solidifying between ages 7-10, leading publications and central bank studies highlight why teaching real-world money smarts before high school is urgent.
                    </p>

                    {/* Quick Stat Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-4xl">
                        <div className="bg-[#0A1828]/80 border border-[#1E3448] rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-heading font-black text-xl text-white">76%</div>
                                <div className="text-xs font-bold text-gray-300">Adult Illiteracy Rate</div>
                                <div className="text-[11px] text-[#8AAFC4] mt-0.5">National Financial Capability Study</div>
                            </div>
                        </div>

                        <div className="bg-[#0A1828]/80 border border-[#1E3448] rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0BBFBF]/10 border border-[#0BBFBF]/20 text-[#0BBFBF] flex items-center justify-center flex-shrink-0">
                                <Brain className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-heading font-black text-xl text-white">Ages 7-10</div>
                                <div className="text-xs font-bold text-gray-300">Habits Form Permanently</div>
                                <div className="text-[11px] text-[#8AAFC4] mt-0.5">University of Cambridge Study</div>
                            </div>
                        </div>

                        <div className="bg-[#0A1828]/80 border border-[#1E3448] rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-heading font-black text-xl text-white">+45%</div>
                                <div className="text-xs font-bold text-gray-300">Accidental In-Game Buys</div>
                                <div className="text-[11px] text-[#8AAFC4] mt-0.5">Cyber Crime Awareness Cell</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Research & Clippings Carousel */}
            <div className="w-full relative z-10">
                <StaggerTestimonials />
            </div>
        </section>
    );
}
