import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, UserCheck, Mail, Phone, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {
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
                        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 self-start sm:self-center">
                            Last Updated: November 2026
                        </span>
                    </div>

                    <h1 className="font-heading font-black text-3xl sm:text-4xl text-white mt-6 mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-teal-200/80 text-sm sm:text-base leading-relaxed">
                        AstraMinds (an <strong className="text-white">Asterra Solutions</strong> initiative) is committed to protecting the privacy and safety of students aged 8–14, parents, and educators.
                    </p>
                </div>

                {/* Policy Sections */}
                <div className="space-y-6 text-gray-200 text-sm sm:text-base leading-relaxed">
                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                1. Zero-Real-Money &amp; Kid-Safe Sandbox
                            </h2>
                        </div>
                        <p className="text-gray-300">
                            AstraMinds is a purely educational financial literacy and digital safety platform. We <strong className="text-white">never</strong> collect bank account numbers, credit/debit card details, UPI PINs, Aadhaar numbers, or real-money payment credentials from students. All pocket money, savings jars, and reward coins inside the student dashboard are virtual learning units.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                2. Information We Collect
                            </h2>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 text-gray-300">
                            <li><strong className="text-white">Account Details:</strong> Name or nickname, email address (or Google Sign-In profile), and age/grade level to personalize learning challenges for ages 8–14.</li>
                            <li><strong className="text-white">Learning Progress:</strong> Virtual savings goals, quiz attempts, daily streaks, badges, and challenge history so students can pick up right where they left off.</li>
                            <li><strong className="text-white">Uploaded Receipts (Optional):</strong> Only if a student or parent uploads an image for practice bill-splitting or expense tracking; images are processed strictly for educational categorization.</li>
                        </ul>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                3. Data Storage, AI Coaching &amp; Security
                            </h2>
                        </div>
                        <p className="text-gray-300 mb-3">
                            Account data and learning progress are encrypted in transit via HTTPS and stored securely on Google Cloud / Firebase Firestore. Passwords are hashed using industry-standard cryptographic hashing.
                        </p>
                        <p className="text-gray-300">
                            When students use AstraBot or AI-generated challenges, only age-tier context and virtual scenario data are sent to generate age-appropriate educational feedback. We never sell student data or display third-party advertisements.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-[#111c33]/80 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                                <EyeOff className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                                4. Parental Rights &amp; Data Deletion
                            </h2>
                        </div>
                        <p className="text-gray-300">
                            Parents, guardians, and partner schools may review, update, or request complete deletion of a student&apos;s account and associated data at any time by contacting our support team.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-cyan-500/25 bg-[#0F2744]/80 p-6">
                        <h2 className="font-heading font-bold text-lg text-white mb-3">
                            5. Contact Us About Privacy
                        </h2>
                        <p className="text-gray-300 mb-4">
                            If you have questions about this Privacy Policy or wish to submit a data request, reach out to Team AstraMinds (Asterra Solutions):
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
