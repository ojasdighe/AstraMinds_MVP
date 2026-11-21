import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PwaInstallButton from './pwa/PwaInstallButton';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-violet-500/25 bg-[#1a1040]/75 backdrop-blur-md min-h-[56px] md:min-h-[64px] h-auto transition-all duration-300 font-space text-white shadow-2xl shadow-violet-900/30">
                <div className="h-full min-h-[56px] md:min-h-[64px] px-6 py-1 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center cursor-pointer group py-0.5">
                        <img src="/AstraMinds.svg" alt="AstraMinds" className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_10px_rgba(253,105,13,0.35)]" />
                    </Link>

                    {/* Center Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="/#features" className="text-sm font-medium text-teal-200 hover:text-white transition-colors">Features</a>
                        <a href="/#spotlight" className="text-sm font-medium text-teal-200 hover:text-white transition-colors">Spotlight</a>
                        <a href="/#about" className="text-sm font-medium text-teal-200 hover:text-white transition-colors">Why It Matters</a>
                        <a href="/#faq" className="text-sm font-medium text-teal-200 hover:text-white transition-colors">FAQ</a>
                    </div>

                    {/* Right Side */}
                    <div className="hidden md:flex items-center gap-4">
                        <PwaInstallButton />
                        <Link to="/login" className="text-sm font-medium text-teal-200 hover:text-white transition-colors">Log In</Link>
                        <Link to="/signup" className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-2 rounded-full hover:from-violet-500 hover:to-indigo-400 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="flex items-center gap-2 md:hidden">
                        <PwaInstallButton variant="icon" />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden absolute top-full left-0 right-0 mt-2 border border-[#1E3448] bg-[#0D1B2A]/90 backdrop-blur-xl rounded-2xl transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 py-6 flex flex-col gap-5">
                        <a href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-200 hover:text-white font-medium text-lg">Features</a>
                        <a href="/#spotlight" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-200 hover:text-white font-medium text-lg">Spotlight</a>
                        <a href="/#about" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-200 hover:text-white font-medium text-lg">Why It Matters</a>
                        <a href="/#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-200 hover:text-white font-medium text-lg">FAQ</a>
                        <div className="pt-1">
                            <PwaInstallButton className="w-full justify-center py-2.5 text-sm" label="Install AstraMinds App" />
                        </div>
                        <div className="h-px bg-violet-500/20 w-full my-1"></div>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-200 hover:text-white font-medium text-lg">Log In</Link>
                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-5 py-3 rounded-xl font-bold text-lg text-center shadow-lg transition-all">Get Started</Link>
                    </div>
                </div>
            </nav>
        </>
    );
}
