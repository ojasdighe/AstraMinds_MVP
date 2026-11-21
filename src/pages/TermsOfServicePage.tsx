import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, GraduationCap, ShieldAlert, Scale, Mail, Phone, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TermsOfServicePage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="dark min-h-screen bg-[#0D1B2A] text-white font-body flex flex-col">
            <Navbar />

            <main className="flex-1 pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-teal-300 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Header Card with Official Logo */}
                <div className="rounded-3xl border border-violet-500/25 bg-[#131f38]/90 p-6 sm:p-10 mb-8 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <img
                                src="/AstraMinds.svg"
                                alt="AstraMinds Logo"
                                className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_2px_10px_rgba(253,105,13,0.35)]"
                            />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-400/30 self-start sm:self-center">
                            Effective: November 2026
                        </span>
                    </div>

                    <h1 className="font-heading font-black text-3xl sm:text-4xl text-white mt-6 mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-teal-200/80 text-sm sm:text-base leading-relaxed">
                        Welcome to <strong className="text-white">AstraMinds</strong>, an educational financial literacy and digital safety initiative by <strong className="text-white">Asterra Solutions</strong>. By accessing or using our platform, you agree to these terms.
                    </p>
                </div>

                {/* Terms Sections */}
                <div className="space-y-6 text-gray-200 text-sm sm:text-base leading-relaxed">
                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                1. Educational Purpose Only
                            </h2>
                        </div>
                        <p className="text-gray-300">
                            AstraMinds is an interactive learning sandbox designed for students aged 8–14. It is <strong className="text-white">not</strong> a bank, payment gateway, wallet, or licensed financial advisor. Virtual pocket money, Gold Coins, XP, and reward vouchers hold no real-world monetary value and cannot be exchanged for cash.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                2. Accounts, Families &amp; Schools
                            </h2>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 text-gray-300">
                            <li>Students under 18 must use AstraMinds with the consent and supervision of a parent, legal guardian, or authorized school educator.</li>
                            <li>Schools and learning communities may access AstraMinds through our hybrid offline/online subscription programs managed directly with Asterra Solutions.</li>
                            <li>Users are responsible for keeping their login credentials confidential.</li>
                        </ul>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                3. Acceptable Use &amp; Safety
                            </h2>
                        </div>
                        <p className="text-gray-300">
                            Users agree to use AstraMinds respectfully and solely for learning. Attempting to disrupt the platform, bypass authentication, upload harmful content, or misuse AI coaching tools is prohibited and may result in account suspension.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                                <Scale className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                4. Intellectual Property &amp; Service Availability
                            </h2>
                        </div>
                        <p className="text-gray-300">
                            All AstraMinds branding, logos, curriculum content, quizzes, and visual designs are the property of Asterra Solutions. While we strive for uninterrupted access, we may update or maintain platform features periodically to improve student learning.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-cyan-500/25 bg-[#0F2744]/80 p-6">
                        <h2 className="font-heading font-bold text-lg text-white mb-3">
                            5. Questions &amp; Support
                        </h2>
                        <p className="text-gray-300 mb-4">
                            For questions regarding these Terms of Service or school/community partnerships, contact Asterra Solutions:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 text-sm">
                            <a
                                href="mailto:asterrasolutions@gmail.com"
                                className="inline-flex items-center gap-2 text-cyan-300 hover:text-white transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                asterrasolutions@gmail.com
                            </a>
                            <a
                                href="tel:+917378655805"
                                className="inline-flex items-center gap-2 text-cyan-300 hover:text-white transition-colors"
                            >
                                <Phone className="w-4 h-4" />
                                +91 73786 55805
                            </a>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
