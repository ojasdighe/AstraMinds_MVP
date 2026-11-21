import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Send, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [topic, setTopic] = useState('School / Community Partnership');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subject = encodeURIComponent(`[AstraMinds Inquiry] ${topic} - ${name || 'Visitor'}`);
        const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`
        );
        window.location.href = `mailto:asterrasolutions@gmail.com?subject=${subject}&body=${body}`;
        setSubmitted(true);
    };

    return (
        <div className="dark min-h-screen bg-[#0D1B2A] text-white font-body flex flex-col">
            <Navbar />

            <main className="flex-1 pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-teal-300 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Header with Official Logo */}
                <div className="rounded-3xl border border-violet-500/25 bg-[#131f38]/90 p-6 sm:p-10 mb-8 shadow-2xl">
                    <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                        <img
                            src="/AstraMinds.svg"
                            alt="AstraMinds Logo"
                            className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_2px_10px_rgba(253,105,13,0.35)]"
                        />
                    </div>
                    <h1 className="font-heading font-black text-3xl sm:text-4xl text-white mt-6 mb-3">
                        Contact Team AstraMinds
                    </h1>
                    <p className="text-teal-200/80 text-sm sm:text-base max-w-2xl leading-relaxed">
                        Have questions about our youth financial literacy platform, school workshops, or hybrid classroom programs? Reach out to <strong className="text-white">Asterra Solutions</strong> directly.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
                    {/* Direct Contact Cards */}
                    <div className="lg:col-span-2 space-y-4">
                        <a
                            href="mailto:asterrasolutions@gmail.com"
                            className="block rounded-2xl border border-cyan-500/25 bg-[#111c33]/90 hover:bg-[#152544] p-6 transition-all group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-white text-lg mb-1">Email Us</h2>
                            <p className="text-xs text-gray-400 mb-2">For parents, schools, and support</p>
                            <span className="text-sm font-semibold text-cyan-300 break-all">
                                asterrasolutions@gmail.com
                            </span>
                        </a>

                        <a
                            href="tel:+917378655805"
                            className="block rounded-2xl border border-emerald-500/25 bg-[#111c33]/90 hover:bg-[#152544] p-6 transition-all group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Phone className="w-5 h-5" />
                            </div>
                            <h2 className="font-heading font-bold text-white text-lg mb-1">Call / WhatsApp</h2>
                            <p className="text-xs text-gray-400 mb-2">Speak directly with our team</p>
                            <span className="text-sm font-semibold text-emerald-300">
                                +91 73786 55805
                            </span>
                        </a>

                        <div className="rounded-2xl border border-white/10 bg-[#111c33]/70 p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Building2 className="w-5 h-5 text-violet-400" />
                                <h2 className="font-heading font-bold text-white text-base">Asterra Solutions</h2>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                Building practical money smarts and digital safety superpowers for students aged 8–14 across families, schools, and learning communities.
                            </p>
                        </div>
                    </div>

                    {/* Message Form */}
                    <div className="lg:col-span-3 rounded-3xl border border-white/10 bg-[#111c33]/90 p-6 sm:p-8">
                        <h2 className="font-heading font-bold text-xl text-white mb-2">
                            Send a Message
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-400 mb-6">
                            Fill out the details below to compose an email directly to asterrasolutions@gmail.com.
                        </p>

                        {submitted && (
                            <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 p-4 text-sm text-emerald-200">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span>
                                    Your email client has been opened! You can also write directly to{' '}
                                    <strong className="text-white">asterrasolutions@gmail.com</strong> or call{' '}
                                    <strong className="text-white">+91 73786 55805</strong>.
                                </span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Parent / Educator Name"
                                        className="w-full rounded-xl bg-[#0D1B2A] border border-white/15 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                        Your Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl bg-[#0D1B2A] border border-white/15 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Inquiry Topic
                                </label>
                                <select
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full rounded-xl bg-[#0D1B2A] border border-white/15 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                                >
                                    <option value="School / Community Partnership">School / Community Partnership</option>
                                    <option value="Family Subscription & Support">Family Subscription &amp; Support</option>
                                    <option value="Privacy & Account Request">Privacy &amp; Account Request</option>
                                    <option value="General Feedback">General Feedback</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us how we can help..."
                                    className="w-full rounded-xl bg-[#0D1B2A] border border-white/15 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                                Send Inquiry
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
