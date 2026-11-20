import MatrixLoader from '../../components/ui/MatrixLoader';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ShieldCheck, CheckCircle, XCircle, Coins, AlertCircle, Lock, AlertTriangle, UserCheck } from 'lucide-react';
import { api } from '../api';
import { useDashboard } from '../DashboardLayout';
import MascotCompanion from '../../components/MascotCompanion';

type QuizTrack = 'money' | 'safety';

const TOPICS: Record<string, string> = {
    Saving: '🐷',
    'Needs vs Wants': '⚖️',
    'Pocket Money': '🪙',
    'Smart Shopping': '🏷️',
    Earning: '🌱',
    'OTP & PIN Safety': '🔐',
    'Scam Spotting': '🕵️',
    'In-Game Purchases': '🎮',
    'Parent Approval': '🛡️',
    'Password Safety': '🔑',
};

interface QuizPageProps {
    initialTrack?: QuizTrack;
}

export default function QuizPage({ initialTrack = 'money' }: QuizPageProps) {
    const navigate = useNavigate();
    const { user, refreshUser, addNotification } = useDashboard();
    const [track, setTrack] = useState<QuizTrack>(initialTrack);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [alreadyDone, setAlreadyDone] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        setTrack(initialTrack);
    }, [initialTrack]);

    const fetchQuiz = useCallback(async (activeTrack: QuizTrack) => {
        setLoading(true);
        setSubmitted(false);
        setResult(null);
        setAnswers({});
        setError('');
        try {
            const endpoint = activeTrack === 'safety' ? '/api/safety-quiz' : '/api/weekly-quiz?type=money';
            const data = await api.get(endpoint);
            setQuestions(data.questions || []);
            setAlreadyDone(Boolean(data.already_attempted));
            if (data.already_attempted) {
                setResult({ coins_earned: data.coins_earned_this_week });
            }
        } catch (e: any) {
            setError(e.message || 'Could not load quiz.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuiz(track);
    }, [track, fetchQuiz]);

    const switchTrack = (nextTrack: QuizTrack) => {
        setTrack(nextTrack);
        navigate(nextTrack === 'safety' ? '/dashboard/safety-quiz' : '/dashboard/quiz');
    };

    const seedAndFetch = async () => {
        setSeeding(true);
        try {
            await fetch('/api/seed-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true }),
            });
            await fetchQuiz(track);
        } finally {
            setSeeding(false);
        }
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            setError('Answer all 5 questions first so you can earn maximum coins!');
            return;
        }
        setError('');
        setSubmitting(true);
        const payload: Record<string, string> = {};
        Object.entries(answers).forEach(([k, v]) => { payload[k] = v; });

        try {
            const endpoint = track === 'safety' ? '/api/submit-safety-quiz' : '/api/submit-quiz';
            const data = await api.post(endpoint, { answers: payload, quiz_type: track });
            setResult(data);
            setSubmitted(true);
            const quizTitle = track === 'safety' ? 'Digital Safety Quiz' : 'Money Smarts Quiz';
            if (data.coins_earned > 0 || (data.xp_earned && data.xp_earned > 0)) {
                addNotification(`${quizTitle} Completed!`, `You scored ${data.score}/${data.total} and won ${data.coins_earned} coins + ${data.xp_earned || 0} XP!`, 'reward');
            } else {
                addNotification(`${quizTitle} Completed!`, `You scored ${data.score}/${data.total}. Nice try—keep learning!`, 'info');
            }
            refreshUser();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const isSafety = track === 'safety';
    const otherTrack: QuizTrack = isSafety ? 'money' : 'safety';
    const otherLabel = isSafety ? 'Play Money Smarts Quiz' : 'Play Digital Money Safety Quiz';

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            {/* Quiz Track Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => switchTrack('money')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        !isSafety
                            ? 'bg-white text-black border-white shadow-lg'
                            : 'bg-[#0F2744] text-gray-300 border-[#1E3448] hover:border-white/25 hover:text-white'
                    }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!isSafety ? 'bg-black text-white' : 'bg-white/5 text-white'}`}>
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-heading font-bold text-sm">Money Smarts Quiz</div>
                        <div className={`text-xs ${!isSafety ? 'text-gray-600' : 'text-gray-400'}`}>
                            Saving, pocket money, needs vs. wants
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => switchTrack('safety')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSafety
                            ? 'bg-white text-black border-white shadow-lg'
                            : 'bg-[#0F2744] text-gray-300 border-[#1E3448] hover:border-white/25 hover:text-white'
                    }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSafety ? 'bg-black text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-heading font-bold text-sm">Digital Money Safety Quiz</div>
                        <div className={`text-xs ${isSafety ? 'text-gray-600' : 'text-gray-400'}`}>
                            OTPs, game scams, passwords &amp; online safety
                        </div>
                    </div>
                </button>
            </div>

            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isSafety ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-[#FF6B9D]/15 text-[#FF6B9D] border border-[#FF6B9D]/20'}`}>
                    {isSafety ? <ShieldCheck className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                </div>
                <div>
                    <h2 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">
                        {isSafety ? 'Digital Money Safety Quiz' : 'Weekly Money Smarts Quiz'}
                    </h2>
                    <p className="text-sm text-gray-400">
                        {user?.grade ? `${user.grade} Curriculum` : 'Youth Curriculum'} · {isSafety
                            ? 'Spot scams & protect digital money'
                            : 'Build smart pocket money habits'}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2 bg-[#122236] dark:bg-[#122236] px-3 py-1.5 rounded-xl border border-[#1E3448]">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">Up to 200 coins</span>
                </div>
            </div>

            {/* Visual Scam Spotter Interactive Challenge (For Safety Track) */}
            {isSafety && !loading && !submitted && (
                <div className="rounded-3xl bg-[#091524] border border-cyan-500/30 p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider border border-cyan-400/30 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
                                Visual Scam Red-Flag Challenge
                            </span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Tap the 3 red flags below</span>
                    </div>

                    {/* Smartphone Notification Visual Mockup */}
                    <div className="max-w-md mx-auto rounded-2xl bg-[#0c1c2e] border-2 border-gray-700/60 p-4 shadow-2xl relative overflow-hidden">
                        {/* Phone Header Bar */}
                        <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-gray-700/40 pb-2 mb-3 font-mono">
                            <span>💬 Messages &bull; Unknown Sender</span>
                            <span className="text-amber-400 font-semibold">⚠️ Unverified</span>
                        </div>

                        {/* Message Bubble */}
                        <div className="rounded-xl bg-gray-800/90 border border-amber-500/40 p-3.5 text-xs text-gray-200 space-y-2">
                            <div className="font-bold text-amber-300 flex items-center gap-1">
                                <span>🎁</span> CONGRATS! You won 10,000 Free Game Gems!
                            </div>
                            <p className="leading-relaxed">
                                You have been selected! Click <span className="underline text-cyan-300 font-mono">bit.ly/free-gems-claim</span> and enter your parent&apos;s phone OTP to credit within 5 mins!
                            </p>
                        </div>

                        {/* Interactive Red Flags To Tap */}
                        <div className="mt-4 pt-3 border-t border-gray-700/40">
                            <div className="text-[11px] font-semibold text-gray-300 mb-2">
                                Spot &amp; Tap the 3 Scam Warning Signs:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {[
                                    { id: 'otp', label: '🚩 Demands Secret OTP', tip: 'Real companies and games never ask for your bank/phone OTP!' },
                                    { id: 'link', label: '🚩 Weird Shortlink (bit.ly)', tip: 'Fake links steal passwords or download hidden malware!' },
                                    { id: 'urgency', label: '🚩 Urgency ("within 5 mins")', tip: 'Scammers rush you so you don’t stop to ask a parent!' },
                                ].map((flag) => (
                                    <button
                                        key={flag.id}
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById(`flag-hint-${flag.id}`);
                                            if (el) el.classList.toggle('hidden');
                                        }}
                                        className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-emerald-500/20 border border-amber-500/30 hover:border-emerald-500/40 text-[11px] font-bold text-amber-300 hover:text-emerald-300 transition-all text-center cursor-pointer"
                                    >
                                        <div>{flag.label}</div>
                                        <div id={`flag-hint-${flag.id}`} className="hidden text-[10px] text-gray-300 mt-1 font-normal text-left pt-1 border-t border-white/10">
                                            {flag.tip}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Digital Safety Mini-Guide Banner */}
            {isSafety && !loading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#0F2744] border border-[#1E3448] rounded-2xl p-3.5 flex items-start gap-2.5">
                        <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <div className="font-bold text-white">Secret OTPs &amp; PINs</div>
                            <p className="text-gray-400 mt-0.5">Never share OTPs, PINs, or photos of bank cards.</p>
                        </div>
                    </div>
                    <div className="bg-[#0F2744] border border-[#1E3448] rounded-2xl p-3.5 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <div className="font-bold text-white">Too-Good-To-Be-True</div>
                            <p className="text-gray-400 mt-0.5">Skip &ldquo;free gems/Robux&rdquo; links—they are traps!</p>
                        </div>
                    </div>
                    <div className="bg-[#0F2744] border border-[#1E3448] rounded-2xl p-3.5 flex items-start gap-2.5">
                        <UserCheck className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <div className="font-bold text-white">Ask a Trusted Adult</div>
                            <p className="text-gray-400 mt-0.5">Check with a parent before clicking Buy or joining trials.</p>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <MatrixLoader size="lg" variant="orbit" rounded />
                    <span className="text-xs text-gray-500 tracking-wider uppercase font-medium">
                        {isSafety ? 'Loading Safety Quiz...' : 'Loading Money Quiz...'}
                    </span>
                </div>
            ) : alreadyDone && !submitted ? (
                <div className="text-center py-16 bg-[#0F2744] rounded-[24px] border border-[#1E3448] px-6">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="font-heading font-black text-3xl text-white mb-2">
                        {isSafety ? 'Safety Mission Complete!' : 'Money Quiz Complete!'}
                    </h3>
                    <p className="text-gray-400 mb-2">
                        You already finished this week&apos;s {isSafety ? 'Digital Money Safety Quiz' : 'Money Smarts Quiz'}.
                    </p>
                    <p className="text-white font-bold text-lg">🪙 {result?.coins_earned ?? 0} coins earned this week</p>
                    <p className="text-gray-400 text-sm mt-2 mb-6">New questions unlock every Monday!</p>
                    <button
                        type="button"
                        onClick={() => switchTrack(otherTrack)}
                        className="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                        {otherLabel}
                    </button>
                </div>
            ) : submitted && result ? (
                <div className="text-center py-10">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-6 bg-[#e2e9fd] relative">
                        <MascotCompanion
                            state={result.score >= 3 ? 'success' : 'error'}
                            showSpeechBubble={true}
                            speechText={result.score >= 3 ? `Woohoo! You scored ${result.score}/${result.total}! Super proud of you! 🎉` : `Good try! Let's check the explanations and try again! 💪`}
                            className="w-full h-full"
                        />
                    </div>
                    <h3 className="font-heading font-black text-3xl text-gray-900 dark:text-white mb-2">
                        {result.score}/{result.total} Correct!
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {result.score === result.total
                            ? isSafety
                                ? 'Cyber Guardian! You spotted every money trap!'
                                : 'Money Master! Perfect score!'
                            : result.score >= 3
                            ? 'Awesome job! You are leveling up fast!'
                            : 'Great effort! Read the tips below to power up for next week!'}
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap mb-6">
                        <div className="bg-[#122236] dark:bg-[#122236] border border-[#1E3448] rounded-2xl px-6 py-4">
                            <p className="text-3xl font-black text-white">🪙 {result.coins_earned}</p>
                            <p className="text-sm text-gray-400 mt-1">Coins Earned</p>
                        </div>
                        <div className="bg-[#122236] dark:bg-[#122236] border border-[#1E3448] rounded-2xl px-6 py-4">
                            <p className="text-3xl font-black text-emerald-400">+{result.xp_earned || 0} XP</p>
                            <p className="text-sm text-gray-400 mt-1">Level Boost</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => switchTrack(otherTrack)}
                        className="mb-8 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                        {otherLabel} →
                    </button>

                    {/* Answer review */}
                    <div className="text-left space-y-6">
                        {(result.results || []).map((res: any, i: number) => {
                            const qObj = questions.find(q => q.id === res.id);
                            const isCorrect = res.user_answer === res.correct_answer;

                            return (
                                <div key={res.id} className={`bg-white dark:bg-gray-900 rounded-2xl p-6 border ${isCorrect ? 'border-[#0BBFBF]/20' : 'border-red-900/50'}`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        {isCorrect ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{i + 1}. {res.question}</p>
                                        </div>
                                    </div>

                                    <div className="pl-9 space-y-2 mb-4">
                                        {qObj && ['a', 'b', 'c', 'd'].map(opt => {
                                            const text = qObj[`option_${opt}`];
                                            let style = 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';

                                            if (opt === res.correct_answer) {
                                                style = 'bg-[#ffffff] text-[#000000] font-bold border border-[#ffffff]';
                                            } else if (opt === res.user_answer) {
                                                style = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50';
                                            }

                                            return (
                                                <div key={opt} className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all ${style}`}>
                                                    <span className="opacity-80 w-5">{opt.toUpperCase()}.</span>
                                                    {text}
                                                    {opt === res.correct_answer && <CheckCircle className="w-4 h-4 ml-auto opacity-70" />}
                                                    {opt === res.user_answer && opt !== res.correct_answer && <XCircle className="w-4 h-4 ml-auto opacity-70" />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {res.explanation && (
                                        <div className="pl-9 mt-4">
                                            <div className="bg-[#0F2744] dark:bg-[#0F2744] rounded-xl p-4 border border-[#0BBFBF]/20">
                                                <div className="flex items-center gap-2 mb-1 text-white font-semibold text-sm">
                                                    {isSafety ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Brain className="w-4 h-4" />}
                                                    <span>Why this matters</span>
                                                </div>
                                                <p className="text-sm text-gray-300 leading-relaxed">{res.explanation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No quiz questions available yet.</p>
                    <button onClick={seedAndFetch} disabled={seeding} className="bg-[#ffffff] text-[#000000] px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-60">
                        {seeding ? 'Loading…' : 'Load Questions'}
                    </button>
                </div>
            ) : (
                <>
                    {/* Progress */}
                    <div className="flex gap-2">
                        {questions.map((_: any, i: number) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${answers[questions[i].id] ? 'bg-[#ffffff]' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                    </div>

                    {questions.map((q: any, qi: number) => (
                        <div key={q.id} className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 card-glow">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold bg-[#0F2744] text-white px-2.5 py-0.5 rounded-full">
                                    {TOPICS[q.topic] || (isSafety ? '🛡️' : '📚')} {q.topic}
                                </span>
                                <span className="text-xs text-gray-400">Question {qi + 1} of {questions.length}</span>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white mb-4">{q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {['a', 'b', 'c', 'd'].map(opt => {
                                    const selected = answers[q.id] === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                            className={`text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${selected
                                                    ? 'border-[#ffffff] bg-[#ffffff] text-[#000000] shadow-md scale-[1.02]'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-[#ffffff] hover:bg-[#ffffff] hover:text-[#000000]'
                                                }`}
                                        >
                                            <span className={`font-bold mr-2 ${selected ? 'text-[#000000]' : 'text-gray-300'}`}>{opt.toUpperCase()}.</span>
                                            {q[`option_${opt}`]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-500 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-[#ffffff] text-[#000000] py-4 rounded-2xl font-bold text-base hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:scale-100"
                    >
                        {submitting ? 'Checking Answers…' : `Submit ${isSafety ? 'Safety' : 'Money'} Quiz · ${Object.keys(answers).length}/${questions.length} answered`}
                    </button>
                </>
            )}
        </div>
    );
}

