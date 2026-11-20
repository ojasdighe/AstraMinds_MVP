import React, { useState, useMemo } from 'react';
import { Sparkles, GraduationCap, Calendar, User, ShieldCheck, Rocket, CheckCircle2 } from 'lucide-react';
import MascotCompanion from '../../components/MascotCompanion';
import { api } from '../api';
import type { UserProfile } from '../DashboardLayout';

interface OnboardingModalProps {
    isOpen: boolean;
    user: UserProfile | null;
    onCompleted: (updatedUser: UserProfile) => void;
}

const AGE_OPTIONS = [8, 9, 10, 11, 12, 13, 14];

const GRADE_OPTIONS = [
    { label: 'Grade 3 (Age 8)', grade: 'Grade 3', typicalAge: 8 },
    { label: 'Grade 4 (Age 9)', grade: 'Grade 4', typicalAge: 9 },
    { label: 'Grade 5 (Age 10)', grade: 'Grade 5', typicalAge: 10 },
    { label: 'Grade 6 (Age 11)', grade: 'Grade 6', typicalAge: 11 },
    { label: 'Grade 7 (Age 12)', grade: 'Grade 7', typicalAge: 12 },
    { label: 'Grade 8 (Age 13)', grade: 'Grade 8', typicalAge: 13 },
    { label: 'Grade 9 (Age 14)', grade: 'Grade 9', typicalAge: 14 },
];

export default function OnboardingModal({ isOpen, user, onCompleted }: OnboardingModalProps) {
    if (!isOpen) return null;

    const initialNickname = user?.nickname || user?.full_name?.split(' ')[0] || '';
    const [nickname, setNickname] = useState(initialNickname);
    const [age, setAge] = useState<number>(user?.age || 12);
    const [grade, setGrade] = useState<string>(user?.grade || 'Grade 7');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const tierInfo = useMemo(() => {
        if (age <= 10) {
            return {
                badge: 'Tier 1 • Junior Explorer',
                color: 'from-emerald-500 to-teal-400',
                border: 'border-emerald-500/30',
                bg: 'bg-emerald-500/10',
                textColor: 'text-emerald-400',
                summary: 'Pocket piggy banks, Needs vs. Wants, and safe fun gaming practices.',
                topics: ['Piggy Bank Habits', 'Needs vs Wants', 'Free Gems/Robux Traps', 'Ask Parents First'],
            };
        } else if (age <= 14) {
            return {
                badge: 'Tier 2 • Smart Navigator',
                color: 'from-cyan-500 to-blue-500',
                border: 'border-cyan-500/30',
                bg: 'bg-cyan-500/10',
                textColor: 'text-cyan-400',
                summary: 'Allowance budgeting, UPI PIN secrecy rules, and smart price comparisons.',
                topics: ['Pocket Money Planning', 'UPI PIN Only to SEND', 'Phishing Links & Scams', 'In-Game Purchases'],
            };
        } else {
            return {
                badge: 'Tier 3 • Future Achiever',
                color: 'from-indigo-500 to-purple-500',
                border: 'border-indigo-500/30',
                bg: 'bg-indigo-500/10',
                textColor: 'text-indigo-400',
                summary: 'Student banking basics, compound interest, scam-proofing QR codes, and career goals.',
                topics: ['Student Banking & Cards', 'Compound Growth', 'QR Code Scam Defense', '2FA & Account Safety'],
            };
        }
    }, [age]);

    const handleGradeChange = (selectedGrade: string) => {
        setGrade(selectedGrade);
        const match = GRADE_OPTIONS.find(g => g.grade === selectedGrade);
        if (match && !age) {
            setAge(match.typicalAge);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanNickname = nickname.trim();
        if (!cleanNickname) {
            setError('Please tell Astra what you would like to be called!');
            return;
        }

        if (!age || age < 8 || age > 14) {
            setError('Please select an age between 8 and 14 so Astra can calibrate your curriculum.');
            return;
        }

        if (!grade) {
            setError('Please select what grade you are studying in.');
            return;
        }

        setLoading(true);
        try {
            let data: any;
            try {
                data = await api.post('/api/complete-onboarding', {
                    nickname: cleanNickname,
                    age,
                    grade,
                });
            } catch (errFirst: any) {
                // Fallback attempt in case proxy or router path expects /api/auth
                data = await api.post('/api/auth/complete-onboarding', {
                    nickname: cleanNickname,
                    age,
                    grade,
                });
            }
            if (data?.user) {
                onCompleted(data.user);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[#0F1E33] border border-[#1E3448] rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6 md:p-8 text-white overflow-hidden my-8">
                {/* Glowing decorative orbs */}
                <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#0BBFBF]/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-[#3B82F6]/20 rounded-full blur-[80px] pointer-events-none" />

                {/* Top Section with Mascot */}
                <div className="flex flex-col sm:flex-row items-center gap-5 mb-6 relative z-10">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0BBFBF]/20 to-[#3B82F6]/20 border border-[#0BBFBF]/40 shadow-glow flex-shrink-0 flex items-center justify-center">
                        <MascotCompanion
                            state="idle"
                            variant="compact"
                            crisp={true}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0BBFBF]/15 border border-[#0BBFBF]/30 text-[#0BBFBF] text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>First-Time Mission Calibration</span>
                        </div>
                        <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
                            Welcome to AstraMinds! 🚀
                        </h2>
                        <p className="text-gray-300 text-sm mt-1">
                            Astra wants to get to know you so your <span className="text-[#0BBFBF] font-semibold">Quizzes</span>, <span className="text-[#3B82F6] font-semibold">Digital Safety</span>, and <span className="text-emerald-400 font-semibold">Daily Challenges</span> match your exact age and grade!
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {/* Question 1: What should we call you */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-[#0BBFBF]" />
                            <span>1. What should Astra call you? (Preferred Name or Nickname)</span>
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="e.g. Leo, Priya, Champ"
                            maxLength={30}
                            className="w-full px-4 py-3 rounded-xl bg-[#091524] border border-[#1E3448] focus:border-[#0BBFBF] focus:ring-2 focus:ring-[#0BBFBF]/30 text-white placeholder-gray-500 transition-all outline-none font-medium"
                            required
                        />
                    </div>

                    {/* Question 2: Age selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#3B82F6]" />
                                <span>2. How old are you? ({age} years old)</span>
                            </span>
                            <span className="text-[11px] text-[#0BBFBF] font-semibold lowercase">
                                (ages 8–14)
                            </span>
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                            {AGE_OPTIONS.map((val) => {
                                const isSelected = age === val;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setAge(val)}
                                        className={`py-2.5 text-sm font-bold rounded-xl transition-all border ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-[#0BBFBF] to-[#3B82F6] text-white border-transparent shadow-glow scale-105'
                                                : 'bg-[#091524] border-[#1E3448] text-gray-400 hover:border-gray-500 hover:text-white'
                                        }`}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Question 3: Grade selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                            <span>3. What grade / class are you studying in?</span>
                        </label>
                        <select
                            value={grade}
                            onChange={(e) => handleGradeChange(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#091524] border border-[#1E3448] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 text-white transition-all outline-none font-medium"
                            required
                        >
                            {GRADE_OPTIONS.map((opt) => (
                                <option key={opt.grade} value={opt.grade} className="bg-[#0D1B2A] text-white">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Real-time Curriculum Calibration Preview Card */}
                    <div className={`p-4 rounded-2xl border ${tierInfo.border} ${tierInfo.bg} transition-all duration-300`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-black uppercase tracking-wider ${tierInfo.textColor} flex items-center gap-1.5`}>
                                <ShieldCheck className="w-4 h-4" />
                                {tierInfo.badge}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">Auto-calibrated for you</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-3">
                            {tierInfo.summary}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {tierInfo.topics.map((t, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-black/30 text-gray-200 border border-white/5"
                                >
                                    <CheckCircle2 className="w-3 h-3 text-[#0BBFBF]" />
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0BBFBF] via-[#3B82F6] to-[#10B981] hover:brightness-110 active:scale-[0.99] transition-all font-heading font-black text-base tracking-wide text-white shadow-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <span>Calibrating your mission...</span>
                        ) : (
                            <>
                                <Rocket className="w-5 h-5" />
                                <span>Save & Begin My Mission 🚀</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
