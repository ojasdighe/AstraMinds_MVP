import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Layers,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    Shuffle,
    CheckCircle2,
    Sparkles,
    LayoutGrid,
    SquareStack,
    RotateCcw,
} from 'lucide-react';

type CardCategory = 'Saving & Goals' | 'Smart Spending' | 'Earning & Sharing' | 'Digital Safety';

interface MoneyFlashcard {
    id: string;
    category: CardCategory;
    emoji: string;
    term: string;
    shortHint: string;
    definition: string;
    kidExample: string;
    proTip: string;
}

const FLASHCARDS: MoneyFlashcard[] = [
    // Saving & Goals
    {
        id: 'allowance',
        category: 'Saving & Goals',
        emoji: '🪙',
        term: 'Pocket Money (Allowance)',
        shortHint: 'Regular cash earned or given for your own budget',
        definition:
            'A fixed amount of money you receive weekly or monthly from parents or chores to practice saving, spending, and sharing responsibly.',
        kidExample:
            'Getting ₹200 every Sunday and putting ₹100 into your Bicycle Jar before buying snacks.',
        proTip: 'Always save your share first—even small weekly rupees grow fast!',
    },
    {
        id: 'savings-goal',
        category: 'Saving & Goals',
        emoji: '🎯',
        term: 'Savings Goal',
        shortHint: 'A specific item or milestone you save toward',
        definition:
            'Choosing something meaningful you want to afford in the future, finding its price, and steadily setting money aside until you reach it.',
        kidExample:
            'Saving ₹150 every week for 10 weeks to buy a ₹1,500 cricket bat.',
        proTip: 'Break big prices into smaller weekly milestones so saving feels exciting!',
    },
    {
        id: 'rainy-day',
        category: 'Saving & Goals',
        emoji: '☔',
        term: 'Rainy Day Jar',
        shortHint: 'Backup money saved for surprises',
        definition:
            'Extra money kept aside strictly for unexpected events so a surprise problem doesn’t wreck your main savings goal.',
        kidExample:
            'Having ₹200 saved in your Rainy Day Jar when your cycle tire suddenly goes flat.',
        proTip: 'Keep even ₹10–₹20 of spare change in a backup jar for emergencies.',
    },
    {
        id: 'interest',
        category: 'Saving & Goals',
        emoji: '🌱',
        term: 'Interest',
        shortHint: 'Bonus money a bank pays savers',
        definition:
            'A small thank-you reward paid by a bank when you keep your money safely inside a savings account over time.',
        kidExample:
            'If ₹1,000 earns 5% simple interest in a year, the bank adds ₹50 extra to your account!',
        proTip: 'When you save money instead of spending it, interest lets your money work for you.',
    },
    {
        id: 'auto-save',
        category: 'Saving & Goals',
        emoji: '⚡',
        term: 'Auto-Save Habit',
        shortHint: 'Saving automatically before spending',
        definition:
            'Moving a chosen amount into your Savings Goal on a regular schedule so you never forget to pay your future self first.',
        kidExample:
            'Setting ₹30 to go automatically into your Science Kit goal every day.',
        proTip: 'Small automatic saves build huge streaks without feeling hard!',
    },
    {
        id: 'compound-growth',
        category: 'Saving & Goals',
        emoji: '❄️',
        term: 'Snowball (Compound) Growth',
        shortHint: 'Savings growing faster as bonus coins stack up',
        definition:
            'Just like a snowball rolling downhill gets bigger faster, earning interest on top of earlier interest makes savings speed up over time.',
        kidExample:
            'Your ₹1,000 earns ₹50 in Year 1; in Year 2 you earn interest on ₹1,050!',
        proTip: 'Starting young is your biggest superpower because time grows your snowball!',
    },

    // Smart Spending
    {
        id: 'need',
        category: 'Smart Spending',
        emoji: '🎒',
        term: 'Need',
        shortHint: 'Something essential for health, safety, or school',
        definition:
            'Items you genuinely must have to stay healthy, safe, and ready for everyday life and school.',
        kidExample:
            'School notebooks, warm winter socks, healthy lunch, or fixing broken bicycle brakes.',
        proTip: 'Always cover your Needs first before looking at fun extras.',
    },
    {
        id: 'want',
        category: 'Smart Spending',
        emoji: '🍦',
        term: 'Want',
        shortHint: 'A fun extra that is nice to have—not essential',
        definition:
            'Things you enjoy or wish for, like treats, toys, or cosmetic game skins, that you can live happily without right now.',
        kidExample:
            'Glow-in-the-dark stickers, double ice cream sundaes, or shiny game outfits.',
        proTip: 'Wants aren’t bad—just plan for them after covering Needs and Savings!',
    },
    {
        id: 'budget',
        category: 'Smart Spending',
        emoji: '📊',
        term: 'Budget',
        shortHint: 'A clear plan for every rupee you have',
        definition:
            'A simple money plan created before you shop that decides how much goes to Needs, Savings, and fun Wants.',
        kidExample:
            'Planning ₹500 for a school fair: ₹250 for project supplies, ₹150 backup, ₹100 savings.',
        proTip: 'A budget gives every rupee a job so you never run out unexpectedly!',
    },
    {
        id: 'impulse-buy',
        category: 'Smart Spending',
        emoji: '⏳',
        term: 'Impulse Buy',
        shortHint: 'Buying fast without thinking first',
        definition:
            'Grabbing something on the spot just because it looks shiny or "on sale," then wishing later you kept the money.',
        kidExample:
            'Buying a ₹150 keychain right by the shop counter and missing your goal by ₹150.',
        proTip: 'Use the 24-Hour Wait Rule: sleep on any Want overnight before buying!',
    },
    {
        id: 'opportunity-cost',
        category: 'Smart Spending',
        emoji: '⚖️',
        term: 'Opportunity Cost',
        shortHint: 'What you give up when you choose something else',
        definition:
            'Every rupee spent on one item is a rupee you can no longer use toward your next favorite choice or goal.',
        kidExample:
            'Spending ₹200 on arcade tokens means giving up ₹200 toward your new storybook.',
        proTip: 'Before buying a Want, ask: "Would I rather have this now or my bigger goal sooner?"',
    },
    {
        id: 'discount-trap',
        category: 'Smart Spending',
        emoji: '🏷️',
        term: 'Smart Discount Check',
        shortHint: 'A sale only saves money on things you needed',
        definition:
            'Comparing unit prices and checking whether you actually planned to buy an item before falling for a "50% OFF!" sign.',
        kidExample:
            'A ₹400 toy "50% off" still costs you ₹200 if you never planned to buy it!',
        proTip: 'Check the price per single item (like ₹80 for 4 pens = ₹20 each) to spot real deals.',
    },

    // Earning & Sharing
    {
        id: 'income',
        category: 'Earning & Sharing',
        emoji: '💼',
        term: 'Income (Earning)',
        shortHint: 'Money coming in from effort or gifts',
        definition:
            'Any money you receive—whether from pocket money, extra household chores, crafts, or birthday envelopes.',
        kidExample:
            'Earning ₹150 for organizing the family bookshelf plus ₹200 pocket money.',
        proTip: 'Log every rupee coming in so you know your true starting budget.',
    },
    {
        id: 'chore-reward',
        category: 'Earning & Sharing',
        emoji: '🧹',
        term: 'Chore Reward',
        shortHint: 'Kid-safe way to earn by helping out',
        definition:
            'Extra money earned through helpful, parent-approved tasks beyond your regular daily responsibilities.',
        kidExample:
            'Washing the family car or watering the garden on weekends for ₹100.',
        proTip: 'Work + pride makes reaching a goal feel twice as awesome!',
    },
    {
        id: 'profit',
        category: 'Earning & Sharing',
        emoji: '🍋',
        term: 'Profit',
        shortHint: 'What stays after paying supply costs',
        definition:
            'The money left over from selling something (like homemade lemonade or crafts) after subtracting what ingredients cost.',
        kidExample:
            'Selling ₹300 of handmade bookmarks that cost ₹100 in paper = ₹200 profit!',
        proTip: 'Always subtract your supply costs first before counting earnings!',
    },
    {
        id: 'value-for-money',
        category: 'Earning & Sharing',
        emoji: '💎',
        term: 'Value for Money',
        shortHint: 'Quality that lasts vs. cheap stuff that breaks',
        definition:
            'Picking items that work well and last a long time for their price, rather than the flashiest or cheapest item that breaks fast.',
        kidExample:
            'Buying a sturdy ₹180 water bottle that lasts all year instead of three ₹80 leaky ones.',
        proTip: 'Read honest reviews with a parent before buying gear or games.',
    },
    {
        id: 'three-jars',
        category: 'Earning & Sharing',
        emoji: '🫙',
        term: 'Save · Spend · Share',
        shortHint: 'The classic 3-jar kid money method',
        definition:
            'Splitting your money into three clear buckets: Save (big goals), Spend (small treats), and Share (gifts or helping others).',
        kidExample:
            'Out of ₹100: ₹50 Save, ₹35 Spend, ₹15 Share for a friend’s birthday card or charity.',
        proTip: 'Sharing even a small slice builds kindness alongside smart money habits.',
    },
    {
        id: 'money-log',
        category: 'Earning & Sharing',
        emoji: '📝',
        term: 'Money Log (Tracking)',
        shortHint: 'Writing down cash in and cash out',
        definition:
            'Keeping a simple record of every snack, comic, or chore rupee so small spending leaks don’t surprise you.',
        kidExample:
            'Noticing that ₹25 daily snacks added up to ₹500 over 20 school days!',
        proTip: 'Track entries in Pocket Money Tracker right after buying.',
    },

    // Digital Safety
    {
        id: 'otp',
        category: 'Digital Safety',
        emoji: '🔐',
        term: 'OTP (One-Time Password)',
        shortHint: 'Secret 4–6 digit code that unlocks payments',
        definition:
            'A temporary secret code sent to a parent’s phone to confirm a payment or login. Sharing it lets scammers take money immediately.',
        kidExample:
            'A stranger says "Send the OTP to claim 5,000 free game gems!" — it’s 100% a scam!',
        proTip: 'NEVER share an OTP with anyone—not friends, strangers, or fake "support."',
    },
    {
        id: 'pin-cvv',
        category: 'Digital Safety',
        emoji: '💳',
        term: 'PIN & CVV',
        shortHint: 'Private card secrets nobody else should see',
        definition:
            'A PIN is a secret 4–6 digit lock code, and the CVV is the 3-digit code on the back of a payment card. Both must stay hidden.',
        kidExample:
            'Never take photos of the front or back of a parent’s bank card to share in chat.',
        proTip: 'Even real bank staff will NEVER ask you for a PIN, CVV, or password.',
    },
    {
        id: 'phishing',
        category: 'Digital Safety',
        emoji: '🕵️',
        term: 'Phishing Scam',
        shortHint: 'Fake links dressed up to steal logins',
        definition:
            'Tricky pop-ups, messages, or misspelled lookalike websites promising free prizes or urgent warnings to steal passwords or money.',
        kidExample:
            'A weird link like "free-g00gle-gems.xyz" asking you to type your password.',
        proTip: 'If a prize says "pay ₹50 first" or looks too good to be true, close it and tell a parent!',
    },
    {
        id: 'in-game-purchase',
        category: 'Digital Safety',
        emoji: '🎮',
        term: 'In-Game Purchase',
        shortHint: 'Virtual coins & skins cost real rupees',
        definition:
            'Buying coins, gems, passes, or skins inside a mobile or console game—often linked to a real family payment method.',
        kidExample:
            'Clicking "1-Tap Buy" by mistake can charge real money without a second warning.',
        proTip: 'Always ask a parent first and keep purchase password locks turned ON.',
    },
    {
        id: 'free-trial',
        category: 'Digital Safety',
        emoji: '⏰',
        term: 'Free Trial Trap',
        shortHint: '"Free for 7 days" often bills automatically next week',
        definition:
            'An app offer that starts free for a few days and then automatically charges a monthly fee if not cancelled in time.',
        kidExample:
            'Joining a "7-day free VIP pass" that silently starts charging ₹299 every month.',
        proTip: 'Never start a "free trial" without asking a parent or guardian first.',
    },
    {
        id: 'two-fa',
        category: 'Digital Safety',
        emoji: '🛡️',
        term: '2FA (Two-Factor Lock)',
        shortHint: 'Two locks protecting your account',
        definition:
            'An extra layer of security requiring both your unique password AND a second confirmation (like a code or parent approval) to sign in.',
        kidExample:
            'Even if someone guesses your game password, 2FA stops them at the door!',
        proTip: 'Never reuse your game password for school, email, or money apps.',
    },
];

const CATEGORIES: Array<'All' | CardCategory> = [
    'All',
    'Saving & Goals',
    'Smart Spending',
    'Earning & Sharing',
    'Digital Safety',
];

const CATEGORY_COLORS: Record<CardCategory, string> = {
    'Saving & Goals': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'Smart Spending': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'Earning & Sharing': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    'Digital Safety': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

const STORAGE_KEY = 'astraminds_mastered_flashcards_v1';

function FlippableCard({
    card,
    isFlipped,
    isMastered,
    onFlipToggle,
    compact = false,
}: {
    card: MoneyFlashcard;
    isFlipped: boolean;
    isMastered: boolean;
    onFlipToggle: () => void;
    compact?: boolean;
}) {
    return (
        <div
            className={`w-full [perspective:1200px] cursor-pointer select-none ${
                compact ? 'h-[290px]' : 'h-[380px] sm:h-[400px]'
            }`}
            onClick={onFlipToggle}
            role="button"
            tabIndex={0}
            aria-label={`${card.term} flashcard. Click to ${isFlipped ? 'unflip' : 'flip'}.`}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onFlipToggle();
                }
            }}
        >
            <motion.div
                className="relative w-full h-full [transform-style:preserve-3d]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }}
            >
                {/* FRONT FACE */}
                <div
                    className={`absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-[28px] bg-[#0F2744] border ${
                        isMastered ? 'border-emerald-500/40' : 'border-white/10'
                    } shadow-2xl flex flex-col justify-between ${compact ? 'p-5' : 'p-7 sm:p-9'}`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <span
                            className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                                CATEGORY_COLORS[card.category]
                            }`}
                        >
                            {card.category}
                        </span>
                        {isMastered ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                <RotateCw className="w-3.5 h-3.5" /> Tap to flip
                            </span>
                        )}
                    </div>

                    <div className="text-center space-y-3 my-auto px-2">
                        <div className={compact ? 'text-4xl' : 'text-6xl'}>{card.emoji}</div>
                        <h3
                            className={`font-heading font-black text-white tracking-tight ${
                                compact ? 'text-xl' : 'text-2xl sm:text-4xl'
                            }`}
                        >
                            {card.term}
                        </h3>
                        <p className={`text-gray-400 max-w-md mx-auto ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>
                            {card.shortHint}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2 border-t border-white/5">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>{compact ? 'Click card to flip' : 'Click card or press Space to flip'}</span>
                    </div>
                </div>

                {/* BACK FACE */}
                <div
                    className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[28px] bg-gradient-to-br from-[#0D2D6B] via-[#0F3D5F] to-[#0A3350] border border-emerald-500/30 shadow-2xl flex flex-col justify-between ${
                        compact ? 'p-5' : 'p-7 sm:p-9'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{card.emoji}</span>
                            <span>{card.term}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                            <RotateCcw className="w-3 h-3" /> Tap to unflip
                        </span>
                    </div>

                    <div className={`space-y-3 my-auto ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>
                        <p className="text-gray-100 leading-relaxed font-medium">{card.definition}</p>

                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
                                Real-Life Kid Example
                            </div>
                            <p className={`text-gray-300 leading-snug ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
                                {card.kidExample}
                            </p>
                        </div>

                        {!compact && (
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs sm:text-sm text-emerald-200 leading-snug">
                                    <span className="font-bold">AstraMinds Tip:</span> {card.proTip}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2 border-t border-white/5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Click again to flip back</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function FlashcardsPage() {
    const [selectedCategory, setSelectedCategory] = useState<'All' | CardCategory>('All');
    const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');
    const [deckOrder, setDeckOrder] = useState<string[]>(() => FLASHCARDS.map(c => c.id));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [gridFlipped, setGridFlipped] = useState<Record<string, boolean>>({});
    const [masteredIds, setMasteredIds] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(masteredIds));
        } catch {
            // Ignore localStorage quota issues
        }
    }, [masteredIds]);

    const orderedCards = useMemo(() => {
        const cardMap = new Map(FLASHCARDS.map(c => [c.id, c]));
        return deckOrder
            .map(id => cardMap.get(id))
            .filter((c): c is MoneyFlashcard => Boolean(c))
            .filter(c => selectedCategory === 'All' || c.category === selectedCategory);
    }, [deckOrder, selectedCategory]);

    const safeIndex = orderedCards.length > 0 ? Math.min(currentIndex, orderedCards.length - 1) : 0;
    const activeCard = orderedCards[safeIndex];

    const goNext = () => {
        if (orderedCards.length === 0) return;
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % orderedCards.length);
    };

    const goPrev = () => {
        if (orderedCards.length === 0) return;
        setIsFlipped(false);
        setCurrentIndex(prev => (prev - 1 + orderedCards.length) % orderedCards.length);
    };

    const shuffleDeck = () => {
        setIsFlipped(false);
        setCurrentIndex(0);
        setDeckOrder(prev => {
            const copy = [...prev];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        });
    };

    const toggleMastered = (cardId: string) => {
        setMasteredIds(prev =>
            prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
        );
    };

    useEffect(() => {
        if (viewMode !== 'deck') return;
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setIsFlipped(false);
                setCurrentIndex(prev => (orderedCards.length ? (prev + 1) % orderedCards.length : 0));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setIsFlipped(false);
                setCurrentIndex(prev =>
                    orderedCards.length ? (prev - 1 + orderedCards.length) % orderedCards.length : 0
                );
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewMode, orderedCards.length]);

    const masteredCount = masteredIds.length;
    const masteryPct = Math.round((masteredCount / FLASHCARDS.length) * 100);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">
                            Money Smarts Flashcards
                        </h2>
                        <p className="text-sm text-gray-400">
                            Flip &amp; unflip cards to learn real-world money words for ages 8–14
                        </p>
                    </div>
                </div>

                {/* Progress + View Switcher */}
                <div className="flex items-center gap-3">
                    <div className="bg-[#0F2744] border border-white/10 rounded-xl px-3.5 py-2 text-xs">
                        <span className="text-gray-400">Mastered: </span>
                        <span className="font-bold text-emerald-400">
                            {masteredCount}/{FLASHCARDS.length}
                        </span>
                    </div>
                    <div className="inline-flex rounded-xl bg-[#0F2744] border border-white/10 p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode('deck')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                viewMode === 'deck' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <SquareStack className="w-3.5 h-3.5" /> Deck
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> All Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* Mastery Progress Bar */}
            <div className="bg-[#0F2744] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-400 font-medium">Your Glossary Mastery</span>
                    <span className="text-white font-bold">{masteryPct}% Complete</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${masteryPct}%` }}
                    />
                </div>
            </div>

            {/* Category Filters & Shuffle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => {
                        const active = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setCurrentIndex(0);
                                    setIsFlipped(false);
                                }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    active
                                        ? 'bg-white text-black border-white shadow-sm'
                                        : 'bg-[#0F2744] text-gray-300 border-white/10 hover:border-white/25 hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={shuffleDeck}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2744] border border-white/10 text-gray-300 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
                    >
                        <Shuffle className="w-3.5 h-3.5" /> Shuffle
                    </button>
                    {masteredIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setMasteredIds([])}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#0F2744] border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                            Reset Progress
                        </button>
                    )}
                </div>
            </div>

            {/* Deck View */}
            {viewMode === 'deck' && activeCard && (
                <div className="max-w-2xl mx-auto space-y-5">
                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                        <span>
                            Card <strong className="text-white">{safeIndex + 1}</strong> of{' '}
                            <strong className="text-white">{orderedCards.length}</strong>
                        </span>
                        <span>Use Space to flip · ← / → arrows to switch cards</span>
                    </div>

                    <FlippableCard
                        card={activeCard}
                        isFlipped={isFlipped}
                        isMastered={masteredIds.includes(activeCard.id)}
                        onFlipToggle={() => setIsFlipped(prev => !prev)}
                    />

                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <button
                            type="button"
                            onClick={goPrev}
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0F2744] border border-white/10 text-sm font-bold text-white hover:border-white/30 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsFlipped(prev => !prev)}
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold text-white hover:bg-white/15 transition-colors cursor-pointer"
                            >
                                <RotateCw className="w-4 h-4" />
                                {isFlipped ? 'Unflip Card' : 'Flip Card'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    toggleMastered(activeCard.id);
                                    if (!masteredIds.includes(activeCard.id)) {
                                        setTimeout(goNext, 220);
                                    }
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                    masteredIds.includes(activeCard.id)
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-white text-black hover:bg-gray-200'
                                }`}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {masteredIds.includes(activeCard.id) ? 'Mastered ✓' : 'Got It!'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={goNext}
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0F2744] border border-white/10 text-sm font-bold text-white hover:border-white/30 transition-colors cursor-pointer"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {orderedCards.map(card => (
                        <div key={card.id} className="space-y-2">
                            <FlippableCard
                                card={card}
                                compact
                                isFlipped={Boolean(gridFlipped[card.id])}
                                isMastered={masteredIds.includes(card.id)}
                                onFlipToggle={() =>
                                    setGridFlipped(prev => ({ ...prev, [card.id]: !prev[card.id] }))
                                }
                            />
                            <div className="flex items-center justify-between px-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setGridFlipped(prev => ({ ...prev, [card.id]: !prev[card.id] }))
                                    }
                                    className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <RotateCw className="w-3 h-3" />
                                    {gridFlipped[card.id] ? 'Unflip' : 'Flip'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleMastered(card.id)}
                                    className={`text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                                        masteredIds.includes(card.id)
                                            ? 'text-emerald-400'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {masteredIds.includes(card.id) ? 'Mastered' : 'Mark Got It'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
