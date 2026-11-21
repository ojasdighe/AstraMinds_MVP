import MatrixLoader from '../components/ui/MatrixLoader';
import SoundWave from '../components/ui/SoundWave';
import { useState, useRef, useEffect } from 'react';
import { X, RefreshCw, ArrowUp, Mic } from 'lucide-react';
import { api } from './api';
import { MovingBorder } from '@/components/ui/moving-border';
import MascotCompanion from '../components/MascotCompanion';

interface Message {
    role: 'user' | 'ai';
    text: string;
}

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [userName, setUserName] = useState('there');
    const recognitionRef = useRef<any>(null);
    const baseTextRef = useRef('');
    const spinTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── 2 random sample questions picked once on mount ────────────────────────
    const ALL_SAMPLE_QUESTIONS = [
        { emoji: '🎯', text: "What's a savings goal and how do I set one?" },
        { emoji: '⚖️',  text: "What is 'opportunity cost'? Can you give me an example?" },
        { emoji: '⏳', text: "What is the 24-hour rule and when should I use it?" },
        { emoji: '🎒', text: "What is the difference between a Need and a Want?" },
        { emoji: '🧹', text: "How can I earn extra pocket money through chores?" },
        { emoji: '🔐', text: "What is an OTP and why should I never share it?" },
        { emoji: '🎮', text: "How do I stay safe from in-game purchase traps?" },
        { emoji: '🫙', text: "What is the Save · Spend · Share jar method?" },
    ];
    const [sampleQuestions] = useState(() => {
        const shuffled = [...ALL_SAMPLE_QUESTIONS].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2);
    });

    // ── Periodic spin animation on the floating button ────────────────────────
    // Spins for 1.2 s every 6 s while the chat is closed, to signal availability.
    useEffect(() => {
        if (open) {
            if (spinTimerRef.current) clearInterval(spinTimerRef.current);
            setIsSpinning(false);
            return;
        }
        const trigger = () => {
            setIsSpinning(true);
            setTimeout(() => setIsSpinning(false), 1200);
        };
        trigger(); // spin once immediately when closed
        spinTimerRef.current = setInterval(trigger, 6000);
        return () => {
            if (spinTimerRef.current) clearInterval(spinTimerRef.current);
        };
    }, [open]);

    useEffect(() => {
        const userStr = localStorage.getItem('astraminds_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.full_name) setUserName(user.full_name.split(' ')[0]);
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                const prefix = baseTextRef.current ? baseTextRef.current + ' ' : '';
                setInput(prefix + transcript);
            };

            recognition.onerror = (event: any) => {
                console.warn('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch { /* ignore abort error */ }
            }
        };
    }, []);

    useEffect(() => {
        if (!open && isListening && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch { /* ignore stop error */ }
            setIsListening(false);
        }
    }, [open, isListening]);

    useEffect(() => {
        if (open) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [messages, open]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Voice input is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a supported browser.');
            return;
        }
        if (isListening) {
            try {
                recognitionRef.current.stop();
            } catch { /* ignore stop error */ }
            setIsListening(false);
        } else {
            try {
                baseTextRef.current = input.trim();
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.warn('Could not start speech recognition:', err);
            }
        }
    };

    const sendMessage = async (overrideText?: string) => {
        if (isListening && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch { /* ignore stop error */ }
            setIsListening(false);
        }

        const text = (overrideText ?? input).trim();
        if (!text || loading) return;

        const userMsg: Message = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }));
            const data = await api.post('/api/chat', { message: text, history });
            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    const resetChat = () => {
        setMessages([]);
    };

    const formatText = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-4 font-body">
            {/* Chat window */}
            <div
                className={`transition-all duration-500 ease-in-out origin-bottom-right ${open ? 'scale-100 opacity-100 mb-0' : 'scale-90 opacity-0 pointer-events-none -mb-10 absolute'
                    }`}
            >
                <div className="w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] bg-[#0b0b0b] rounded-[24px] shadow-2xl flex flex-col border border-[#1E3448] relative overflow-hidden"
                    style={{ height: 'min(600px, calc(100dvh - 7rem))' }}>

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-[#1E3448] flex items-center justify-between bg-[#0b0b0b] z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-teal-400/60 shadow-[0_0_12px_rgba(11,191,191,0.35)] relative bg-[#e2e9fd] flex-shrink-0">
                                <MascotCompanion
                                    state={loading ? 'loading' : input.trim() ? 'email-focus' : 'idle'}
                                    variant="compact"
                                    blendEdges={false}
                                    crisp={true}
                                    className="w-full h-full"
                                />
                            </div>
                            <div>
                                <h1 className="font-semibold text-white text-[16px] leading-tight">AstraBot</h1>
                                <span className="text-[11px] text-teal-400 font-medium">Money Mentor Companion</span>
                            </div>
                        </div>
                        <button
                            onClick={resetChat}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1E3448] hover:bg-[#122236] text-[#888] transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area / Empty State */}
                    <div className="flex-1 overflow-y-auto flex flex-col relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-[-0.5rem]">
                                <div className="w-28 h-28 rounded-3xl bg-[#e2e9fd] border-2 border-teal-500/50 shadow-[0_0_25px_rgba(11,191,191,0.3)] flex items-center justify-center mb-4 overflow-hidden relative group">
                                    <MascotCompanion
                                        state={loading ? 'loading' : input.trim() ? 'email-focus' : 'idle'}
                                        variant="card"
                                        blendEdges={false}
                                        crisp={true}
                                        className="w-full h-full"
                                    />
                                </div>
                                <h2 className="text-white text-lg font-semibold mb-2 tracking-wide">Hey, <span className="bg-gradient-to-r from-[#0BBFBF] via-[#3B82F6] to-[#10B981] text-transparent bg-clip-text font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{userName}</span>!</h2>
                                <p className="text-[#888] text-[14px] leading-relaxed max-w-[260px] mb-8">
                                    Ask AstraBot about saving goals, pocket money, or online money safety!
                                </p>

                                <div className="w-full flex flex-col gap-2.5">
                                    {sampleQuestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(s.text)}
                                            className="w-full text-left bg-[#0F2744] border border-[#1E3448] hover:bg-[#122236] hover:border-teal-500/30 text-[#ccc] hover:text-white px-4 py-3 rounded-xl transition-all text-[13px] flex items-center gap-2.5"
                                        >
                                            <span className="text-base flex-shrink-0">{s.emoji}</span>
                                            <span>{s.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-6 pb-28">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-4 py-3 text-[14.5px] leading-relaxed ${msg.role === 'ai'
                                            ? 'text-white'
                                            : 'bg-[#1c1c1c] text-white rounded-2xl rounded-tr-sm border border-[#2a2a2a]'
                                            }`} dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="text-[#888] text-[14px] flex items-center gap-2.5 px-2">
                                            <MatrixLoader size="sm" variant="orbit" rounded />
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} className="h-4" />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b] to-transparent pt-8 pb-4 px-4 z-10">
                        <div className={`relative flex items-center bg-[#1c1c1c] border rounded-[20px] p-1.5 transition-all ${
                            isListening ? 'border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-[#2a2a2a] focus-within:border-[#444]'
                        }`}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder={isListening ? "Listening..." : "Ask about saving or digital safety..."}
                                className="w-full bg-transparent border-none px-4 py-2 text-[14.5px] text-white placeholder-[#666] focus:outline-none focus:ring-0"
                            />
                            
                            {/* Voice Input Mic Button - in black and white with sound wave animation */}
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={loading}
                                title={isListening ? "Stop listening" : "Voice input (English)"}
                                aria-label={isListening ? "Stop listening" : "Voice input in English"}
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 mr-1.5 ${
                                    isListening
                                        ? 'bg-white/15 text-white border border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {isListening ? (
                                    <SoundWave color="#ffffff" barWidth={2.5} height={14} />
                                ) : (
                                    <Mic className="w-4 h-4" />
                                )}
                            </button>

                            {/* Submit Button */}
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="w-8 h-8 rounded-full bg-[#ffffff] text-[#000000] hover:bg-gray-200 flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-all active:scale-95 mr-1"
                            >
                                {loading ? <MatrixLoader size="sm" variant="orbit" rounded baseColor="#666" activeColor="#000" /> : <ArrowUp className="w-4 h-4 text-black stroke-[3]" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div 
                className="relative z-50 cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setOpen(o => !o)}
            >
                <MovingBorder
                    isCircle={true}
                    borderWidth={isHovered ? 4 : 2}
                    gradientWidth={isHovered ? 150 : 80}
                    duration={isHovered ? 2 : 4}
                    colors={isHovered ? ["#0BBFBF", "#3B82F6", "#10B981"] : ["#0BBFBF55", "#3B82F644", "#0BBFBF55"]}
                    outerClassName="rounded-full shadow-2xl transition-all duration-300"
                    className="bg-[#0D1B2A]"
                >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${open ? 'scale-95' : isHovered ? 'scale-105' : 'scale-100'}`}>
                        {open ? (
                            <X className="w-6 h-6 text-white" />
                        ) : (
                            <div 
                                style={{
                                    animation: isSpinning ? 'astrabotSpin 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none',
                                }}
                                className="w-full h-full rounded-full overflow-hidden bg-[#e2e9fd] relative"
                            >
                                <MascotCompanion
                                    state={isHovered ? 'email-focus' : 'idle'}
                                    variant="compact"
                                    blendEdges={false}
                                    crisp={true}
                                    className="w-full h-full"
                                />
                            </div>
                        )}
                    </div>
                </MovingBorder>

                {/* "Chat with AstraBot" tooltip — shows when not spinning and not open */}
                {!open && !isSpinning && (
                    <div className="absolute bottom-full right-0 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-[#0F2744] text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap border border-[#1E3448] shadow-lg">
                            Chat with AstraBot 🤖
                        </div>
                    </div>
                )}

                {/* Pulse ring — draws attention when idle */}
                {!open && (
                    <span className="absolute -inset-1 rounded-full border-2 border-teal-400/30 animate-ping pointer-events-none" />
                )}
            </div>

            {/* Spin keyframe injected inline so it works without a CSS file edit */}
            <style>{`
                @keyframes astrabotSpin {
                    0%   { transform: rotate(0deg) scale(1); }
                    25%  { transform: rotate(180deg) scale(1.12); }
                    60%  { transform: rotate(340deg) scale(1.05); }
                    80%  { transform: rotate(355deg) scale(1.02); }
                    100% { transform: rotate(360deg) scale(1); }
                }
            `}</style>
        </div>
    );
}
