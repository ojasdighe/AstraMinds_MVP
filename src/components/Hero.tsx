import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Hero() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const heroOpacity = Math.max(0, 1 - scrollY / 500);
    const heroTranslate = scrollY * 0.35;

    return (
        <section className="hero-section relative min-h-screen flex items-center pt-28 pb-20 font-space overflow-hidden border-none">
            {/* Background Video */}
            <div className="fixed inset-0 w-full h-full z-[-1] bg-black">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/background_video.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px]"></div>
            </div>

            <div
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
                style={{ opacity: heroOpacity, transform: `translateY(${heroTranslate}px)` }}
            >
                <div className="max-w-3xl text-left flex flex-col items-start animate-slide-up">
                    {/* Top Announcement Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-medium mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(11,191,191,0.2)]">
                        <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                        <span>Youth Financial Literacy &amp; Digital Safety Platform</span>
                    </div>

                    {/* Main Headline (Left Aligned) */}
                    <h1 className="font-heading font-black text-white text-4xl sm:text-6xl lg:text-7xl leading-[1.1] mb-6 tracking-tight drop-shadow-xl text-left">
                        Save Like a Pro.<br />
                        <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-indigo-400 text-transparent bg-clip-text">
                            Stay Safe Online.
                        </span>
                    </h1>

                    {/* Subtitle (Left Aligned) */}
                    <p className="text-base sm:text-xl text-gray-200 max-w-xl mb-10 leading-relaxed font-normal drop-shadow text-left">
                        Pocket-money budgeting, interactive daily challenges &amp; digital money safety superpowers built specifically for students aged 8–14.
                    </p>

                    {/* Action Buttons (Left Aligned) */}
                    <div
                        className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-start opacity-0 animate-slide-up mb-10 w-full sm:w-auto"
                        style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
                    >
                        <Link
                            to="/signup"
                            className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 text-black px-9 py-4 rounded-full font-bold text-base sm:text-[17px] hover:shadow-[0_0_30px_rgba(255,255,255,0.45)] hover:scale-105 transition-all duration-300 flex items-center justify-center border border-white/60 text-center"
                        >
                            Start Learning Free
                        </Link>
                        <Link
                            to="/login"
                            className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-bold text-base sm:text-[17px] hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center justify-center text-center gap-2"
                        >
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4 text-cyan-300" />
                        </Link>
                    </div>

                    {/* Trust Badges Bar (Left Aligned) */}
                    <div
                        className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs sm:text-sm text-gray-300 max-w-lg opacity-0 animate-slide-up text-left"
                        style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
                    >
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-teal-400 flex-shrink-0" />
                            <span>100% Safe Sandbox</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span>Daily Challenges</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <span>Age-Adaptive Curriculum</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
