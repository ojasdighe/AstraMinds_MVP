import React, { useState } from 'react';
import { ChevronDown, ArrowRight, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
    question: string;
    answer: React.ReactNode;
}

export default function FaqSection() {
    const [activeCategory, setActiveCategory] = useState<'general' | 'goals' | 'tracker' | 'safety'>('general');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const categories = [
        { id: 'general', label: 'General' },
        { id: 'goals', label: 'Savings Goals' },
        { id: 'tracker', label: 'Pocket Money' },
        { id: 'safety', label: 'Digital Safety' },
    ] as const;

    const faqsByCategory: Record<'general' | 'goals' | 'tracker' | 'safety', FaqItem[]> = {
        general: [
            {
                question: 'Who is AstraMinds built for, and do kids need a real bank account?',
                answer: 'AstraMinds is built specifically for young savers aged 8–14! No real bank account, debit card, or money transfer is needed—kids practice with virtual pocket money, goals, and quizzes in a safe, ad-free sandbox.',
            },
            {
                question: 'Is AstraMinds free for families and classrooms?',
                answer: (
                    <div className="space-y-3.5 leading-relaxed text-[#8AAFC4]">
                        <p>
                            AstraMinds operates on an institutional and community-focused <strong className="text-white font-medium">hybrid delivery model</strong>. Schools and learning communities in select cities can partner with us for experiential offline curriculum delivery and interactive workshops, or onboard their student cohorts through our subscription-based digital learning platform.
                        </p>
                        <div className="pt-2 border-t border-[#1E3448]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <span className="text-[#8AAFC4]">
                                For institutional partnerships, classroom pilots, or subscription inquiries:
                            </span>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-medium">
                                <a
                                    href="mailto:contact@astraminds.in"
                                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>contact@astraminds.in</span>
                                </a>
                                <span className="text-[#5A8FA8] hidden sm:inline">•</span>
                                <a
                                    href="tel:+917378655805"
                                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>+91 73786 55805</span>
                                </a>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                question: 'How do streaks, XP, Gold Coins, and avatars work?',
                answer: 'Kids earn XP and Gold Coins every time they stick to a daily saving streak, complete the Money Smarts Quiz, or pass the Digital Money Safety Quiz. Coins unlock cool profile avatars, streak shields, and fun rewards in the Coin Shop.',
            },
            {
                question: 'Can parents review progress and savings reports?',
                answer: 'Yes! You can view clear goal progress charts, category spending summaries, and one-click printable reports showing what your child saved, spent, and learned.',
            },
        ],
        goals: [
            {
                question: 'How do Savings Goals and Auto-Save work?',
                answer: 'Pick a fun target—like a Mountain Bicycle, Art Kit, or Books—set a goal date, and choose a daily, weekly, or monthly Auto-Save plan. AstraMinds moves virtual pocket money into your goal jar automatically.',
            },
            {
                question: 'Can kids pause or edit a goal if plans change?',
                answer: 'Yes! You can pause Auto-Save, adjust your target amount, or change your goal anytime without losing the progress you already saved.',
            },
            {
                question: 'What happens if the Pocket Money Balance is low?',
                answer: 'AstraMinds checks your balance before running Auto-Save so you never go negative. If your jar is low, Auto-Save simply pauses and sends a friendly reminder.',
            },
        ],
        tracker: [
            {
                question: 'What can kids track in the Pocket Money Tracker?',
                answer: 'Kids can log allowance, chore rewards, and birthday gift money alongside spending on snacks, books, games, sports, and hobbies—learning the difference between Needs and Wants.',
            },
            {
                question: 'Can we set weekly or monthly category limits?',
                answer: 'Yes! Kids and parents can set category caps for Snacks & Treats or Games & Apps, with friendly alerts before a limit is reached.',
            },
            {
                question: 'How does AstraBot help with spending choices?',
                answer: 'AstraBot answers questions in kid-friendly language—showing whether buying an item today will delay a big savings goal and suggesting smart alternatives.',
            },
        ],
        safety: [
            {
                question: 'What does the Digital Money Safety Quiz teach?',
                answer: 'It covers critical real-world digital safety habits: keeping OTPs and PINs private, spotting fake "free coins or gems" scams, checking with parents before in-game purchases, and creating strong passwords.',
            },
            {
                question: 'How is the Digital Safety Quiz different from the Money Quiz?',
                answer: 'AstraMinds has two separate weekly quiz tracks—Money Smarts (saving, budgeting, needs vs. wants) and Digital Money Safety (cyber scams, OTP safety, parent approval)—so kids can earn up to 200 bonus Gold Coins in each!',
            },
            {
                question: 'Are answers explained after finishing the quiz?',
                answer: 'Yes! Every question includes a clear, encouraging explanation right after submission so kids learn why a choice is safe or risky.',
            },
        ],
    };

    const currentFaqs = faqsByCategory[activeCategory];

    const toggleAccordion = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <section id="faq" className="py-24 md:py-32 bg-[#0D1B2A] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 2-Column FAQ Layout (Image 4 style) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Title & Help Box */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-10">
                        <div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-[1.15]">
                                Frequently Asked Questions
                            </h2>
                        </div>

                        {/* Contact Card (matching bottom left of Image 4) */}
                        <div className="rounded-3xl bg-[#0F2744] border border-[#1E3448] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#0F2744] border border-[#1E3448] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <img
                                    src="/AstraMinds.ico"
                                    alt="AstraBot Support"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="space-y-3 flex-1">
                                <div>
                                    <div className="text-sm font-semibold text-white">Parents &amp; Kids Have Questions?</div>
                                    <p className="text-xs text-[#8AAFC4] mt-0.5">
                                        Create a free learning account or chat with AstraBot inside your dashboard anytime.
                                    </p>
                                </div>
                                <Link
                                    to="/signup"
                                    className="btn-white inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-white !text-black hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                                >
                                    <span className="!text-black font-bold">Contact Us</span>
                                    <ArrowRight className="w-3.5 h-3.5 !text-black" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Category Tabs & Accordion */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Category Filter Tabs */}
                        <div className="flex items-center gap-1 border-b border-[#1E3448] pb-2 overflow-x-auto">
                            {categories.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveCategory(cat.id);
                                            setOpenIndex(0);
                                        }}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                                            isActive
                                                ? 'bg-[#0F2744] text-white font-semibold border border-[#1E3448]'
                                                : 'text-[#8AAFC4] hover:text-zinc-200 hover:bg-[#0F2744]/40'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Accordion Questions List */}
                        <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
                            {currentFaqs.map((faq, idx) => {
                                const isOpen = openIndex === idx;
                                return (
                                    <div key={idx} className="py-5">
                                        <button
                                            type="button"
                                            onClick={() => toggleAccordion(idx)}
                                            className="w-full text-left flex items-center justify-between gap-4 cursor-pointer group"
                                        >
                                            <span className={`text-sm sm:text-base font-normal transition-colors ${
                                                isOpen ? 'text-white font-medium' : 'text-[#D4EAF5] group-hover:text-white'
                                            }`}>
                                                {faq.question}
                                            </span>
                                            <ChevronDown
                                                className={`w-4 h-4 text-[#5A8FA8] transition-transform duration-200 flex-shrink-0 ${
                                                    isOpen ? 'transform rotate-180 text-white' : ''
                                                }`}
                                            />
                                        </button>

                                        {isOpen && (
                                            <div className="pt-3 text-xs sm:text-sm text-[#8AAFC4] leading-relaxed font-normal pr-6 animate-fadeIn">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

