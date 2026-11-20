import { useState, useEffect } from 'react';
import { ShoppingBag, BookOpen, FlaskConical, Palette, Sparkles, Gamepad2, CheckCircle, Coins, Zap, Ticket, Award, X, Check } from 'lucide-react';
import { useDashboard } from '../DashboardLayout';
import { api } from '../api';

const PARENT_VOUCHERS = [
    {
        id: 101,
        title: '1 Extra Hour of Weekend Gaming',
        emoji: '🎮',
        cost: 150,
        desc: 'Redeem with parents for 60 bonus minutes on your favorite game or console.',
        code: 'GAME-PASS-60',
    },
    {
        id: 102,
        title: 'Ice Cream Parlor Outing with Parents',
        emoji: '🍦',
        cost: 200,
        desc: 'Good for a special 2-scoop treat of your choice on the weekend!',
        code: 'ICE-CREAM-TREAT',
    },
    {
        id: 103,
        title: 'Friday Family Movie & Popcorn Pick',
        emoji: '🎬',
        cost: 120,
        desc: 'You choose the movie and the flavor of popcorn for family movie night.',
        code: 'MOVIE-NIGHT-PICK',
    },
    {
        id: 104,
        title: 'One Night Chore Pass',
        emoji: '🧹',
        cost: 180,
        desc: 'Take the night off from washing dishes or making your bed—pass approved by parents!',
        code: 'CHORE-EXEMPT-01',
    },
    {
        id: 105,
        title: 'Bookstore / Comic Pick of Choice',
        emoji: '📚',
        cost: 250,
        desc: 'Visit a bookstore with parents and pick a new paperback or graphic novel.',
        code: 'BOOK-PICK-PASS',
    },
];

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    icon: React.ElementType;
    color: string;
    bg: string;
    badge?: string;
}

const PRODUCTS: Product[] = [
    {
        id: 1,
        name: 'Comic Book Bundle',
        description: 'Pick an awesome 3-book adventure & mystery comic pack for weekend reading.',
        price: 500,
        icon: BookOpen,
        color: 'text-[#0BBFBF]',
        bg: 'bg-[#E0F7FA] dark:bg-[#0F2744]',
        badge: '⭐ Popular',
    },
    {
        id: 2,
        name: 'DIY Science Lab Kit',
        description: 'Build mini circuits, volcano reactions, and cool tabletop experiments at home.',
        price: 1200,
        icon: FlaskConical,
        color: 'text-[#10B981]',
        bg: 'bg-[#ECFDF5] dark:bg-[#0F2744]',
        badge: '🔥 Hot',
    },
    {
        id: 3,
        name: 'Art & Sketch Studio Set',
        description: '36-piece watercolor, brush pen, and thick sketchpad kit for young creators.',
        price: 1800,
        icon: Palette,
        color: 'text-[#FF6B9D]',
        bg: 'bg-[#FFF0F6] dark:bg-[#0F2744]',
    },
    {
        id: 4,
        name: 'Cool Badge & Sticker Pack',
        description: 'Collectible holographic AstraMinds Saver & Cyber Safety Ranger stickers.',
        price: 300,
        icon: Sparkles,
        color: 'text-[#FF7A2F]',
        bg: 'bg-[#FFF4EE] dark:bg-[#0F2744]',
    },
    {
        id: 5,
        name: 'Mini RC Stunt Car',
        description: 'Rechargeable 360° flip remote-control racer for indoor and outdoor tracks.',
        price: 3500,
        icon: Gamepad2,
        color: 'text-[#3B82F6]',
        bg: 'bg-[#EFF6FF] dark:bg-[#0F2744]',
        badge: '✨ New',
    },
];

const PREMIUM_AVATARS = [
    {
        id: 'ninja',
        name: 'Shadow Ninja',
        description: 'A master of shadow. Equip this avatar to show off your disciplined saving habits.',
        price: 2000,
        image: '/ninja.jpg',
    },
    {
        id: 'alien',
        name: 'Extraterrestrial',
        description: 'Out of this world! Perfect for those whose savings goals are astronomical.',
        price: 5000,
        image: '/alien.jpg',
    },
    {
        id: 'spartan',
        name: 'Spartan Warrior',
        description: 'Unbreakable resolve. Show the world your fierce dedication to your financial goals.',
        price: 7000,
        image: '/spartan.jpg',
    },
    {
        id: 'god_of_war',
        name: 'God of War',
        description: 'The ultimate conqueror. For those who dominate their savings targets.',
        price: 10000,
        image: '/god_of_war.jpg',
        badge: '🔥 Legendary',
    }
];

export default function ShopPage() {
    const { user, refreshUser, addNotification } = useDashboard();
    const [bought, setBought] = useState<number[]>([]);
    const [loading, setLoading] = useState<number | null>(null);
    const [msg, setMsg] = useState<{ id: number; text: string; success: boolean } | null>(null);

    // Parent Vouchers Tab state
    const [shopTab, setShopTab] = useState<'rewards' | 'vouchers'>('rewards');
    const [redeemedVouchers, setRedeemedVouchers] = useState<number[]>([]);
    const [activePass, setActivePass] = useState<typeof PARENT_VOUCHERS[0] | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('astraminds_redeemed_vouchers');
        if (saved) {
            try { setRedeemedVouchers(JSON.parse(saved)); } catch (_) {}
        }
    }, []);

    const handleRedeemVoucher = async (voucher: typeof PARENT_VOUCHERS[0]) => {
        if (!user || user.coins < voucher.cost) {
            setMsg({ id: voucher.id, text: `Not enough coins! You need ${voucher.cost - (user?.coins || 0)} more coins.`, success: false });
            setTimeout(() => setMsg(null), 3000);
            return;
        }
        setLoading(voucher.id);
        try {
            await api.post('/api/spend-coins', { amount: voucher.cost, reason: `Redeemed ${voucher.title}` });
            await refreshUser();
            const updated = [...redeemedVouchers, voucher.id];
            setRedeemedVouchers(updated);
            localStorage.setItem('astraminds_redeemed_vouchers', JSON.stringify(updated));
            setActivePass(voucher);
            addNotification('Parent Voucher Unlocked!', `Show your parent your verified voucher for ${voucher.title}!`, 'reward');
        } catch (e: any) {
            setMsg({ id: voucher.id, text: e.message || 'Redemption failed.', success: false });
            setTimeout(() => setMsg(null), 3000);
        } finally {
            setLoading(null);
        }
    };

    const handleBuy = async (product: Product) => {
        if (!user || user.coins < product.price) {
            setMsg({ id: product.id, text: `Not enough coins! You need ${product.price - (user?.coins || 0)} more coins.`, success: false });
            setTimeout(() => setMsg(null), 3000);
            return;
        }
        setLoading(product.id);
        try {
            await api.post('/api/spend-coins', { amount: product.price, reason: `Bought ${product.name}` });
            await refreshUser();
            setBought(prev => [...prev, product.id]);
            setMsg({ id: product.id, text: `🎉 ${product.name} redeemed!`, success: true });
            addNotification('Item Redeemed!', `You got ${product.name} for ${product.price} coins.`, 'reward');
            setTimeout(() => setMsg(null), 3000);
        } catch (e: any) {
            setMsg({ id: product.id, text: e.message || 'Purchase failed.', success: false });
            setTimeout(() => setMsg(null), 3000);
        } finally {
            setLoading(null);
        }
    };

    const handleBuyAvatar = async (avatar: typeof PREMIUM_AVATARS[0]) => {
        if (!user || user.coins < avatar.price) {
            setMsg({ id: avatar.id as any, text: `Not enough coins! You need ${avatar.price - (user?.coins || 0)} more coins.`, success: false });
            setTimeout(() => setMsg(null), 3000);
            return;
        }
        setLoading(avatar.id as any);
        try {
            await api.post('/api/buy-avatar', { avatar_id: avatar.id, price: avatar.price });
            await refreshUser();
            setMsg({ id: avatar.id as any, text: `🎉 ${avatar.name} unlocked!`, success: true });
            addNotification('Avatar Unlocked!', `You can now equip ${avatar.name} in Settings!`, 'success');
            setTimeout(() => setMsg(null), 3000);
        } catch (e: any) {
            setMsg({ id: avatar.id as any, text: e.message || 'Purchase failed.', success: false });
            setTimeout(() => setMsg(null), 3000);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#0BBFBF]/15 dark:bg-[#0F2744] rounded-2xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-[#0BBFBF]" />
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">Coin Shop</h2>
                        <p className="text-sm text-gray-400">Redeem your coins for awesome rewards &amp; real-life parent perks</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-[#122236] dark:bg-[#122236] border border-[#1E3448] px-4 py-2 rounded-2xl">
                    <Coins className="w-4 h-4 text-gray-300" />
                    <span className="font-black text-gray-400 dark:text-white">{(user?.coins || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-300">coins</span>
                </div>
            </div>

            {/* Shop Category Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                    type="button"
                    onClick={() => setShopTab('rewards')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        shopTab === 'rewards'
                            ? 'bg-white text-gray-950 shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Avatars &amp; Gear</span>
                </button>
                <button
                    type="button"
                    onClick={() => setShopTab('vouchers')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        shopTab === 'vouchers'
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-gray-950 shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Parent Reward Vouchers 🎟️</span>
                </button>
            </div>

            {/* TAB: PARENT VOUCHERS */}
            {shopTab === 'vouchers' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                            <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-400" /> Real-World Parent Vouchers
                            </span>
                            <p className="text-gray-300">
                                Trade your hard-earned learning coins for real-life privileges approved by your parents!
                            </p>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">100% Kid &amp; Parent Safe</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {PARENT_VOUCHERS.map(v => {
                            const isRedeemed = redeemedVouchers.includes(v.id);
                            const canAfford = (user?.coins || 0) >= v.cost;
                            const isProcessing = loading === v.id;

                            return (
                                <div
                                    key={v.id}
                                    className={`rounded-3xl p-5 border flex flex-col justify-between transition-all ${
                                        isRedeemed
                                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg'
                                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-amber-400/40'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-3xl p-2 rounded-2xl bg-white/5 border border-white/10">{v.emoji}</span>
                                            {isRedeemed ? (
                                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Unlocked Pass
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                                    <Coins className="w-3.5 h-3.5" /> {v.cost} coins
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">{v.title}</h3>
                                        <p className="text-xs text-gray-400 leading-relaxed mb-4">{v.desc}</p>
                                    </div>

                                    <div>
                                        {isRedeemed ? (
                                            <button
                                                type="button"
                                                onClick={() => setActivePass(v)}
                                                className="w-full py-2.5 rounded-xl bg-emerald-500 text-gray-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                            >
                                                <Ticket className="w-3.5 h-3.5" />
                                                <span>View Digital Pass</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleRedeemVoucher(v)}
                                                disabled={isProcessing || !canAfford}
                                                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                    canAfford
                                                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-gray-950 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {isProcessing ? 'Claiming...' : canAfford ? 'Redeem Voucher' : `Need ${v.cost - (user?.coins || 0)} more coins`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB: PRODUCTS & AVATARS */}
            {shopTab === 'rewards' && (
                <>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {PRODUCTS.map(product => {
                    const Icon = product.icon;
                    const canAfford = (user?.coins || 0) >= product.price;
                    const isBought = bought.includes(product.id);
                    const isLoading = loading === product.id;
                    const feedback = msg?.id === product.id ? msg : null;

                    return (
                        <div key={product.id} className={`bg-white dark:bg-gray-900 rounded-[24px] p-5 border border-gray-100 dark:border-gray-800 card-glow flex flex-col gap-4 transition-all ${isBought ? 'opacity-80' : ''}`}>
                            {/* Icon + Badge */}
                            <div className="flex items-start justify-between">
                                <div className={`w-14 h-14 ${product.bg} rounded-2xl flex items-center justify-center`}>
                                    <Icon className={`w-7 h-7 ${product.color}`} />
                                </div>
                                {product.badge && (
                                    <span className="text-xs font-bold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                                        {product.badge}
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{product.name}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">{product.description}</p>
                            </div>

                            {/* Price + CTA */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-gray-300" />
                                    <span className="font-black text-lg text-gray-400 dark:text-white">{product.price.toLocaleString()}</span>
                                    <span className="text-xs text-gray-400">coins</span>
                                </div>

                                {feedback && (
                                    <p className={`text-xs font-semibold ${feedback.success ? 'text-gray-300' : 'text-red-500'}`}>
                                        {feedback.text}
                                    </p>
                                )}

                                <button
                                    onClick={() => handleBuy(product)}
                                    disabled={isBought || isLoading}
                                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                        ${isBought
                                            ? 'bg-[#122236] dark:bg-[#122236] text-gray-400 dark:text-white border border-[#1E3448] cursor-default'
                                            : canAfford
                                                ? 'btn-white !bg-white !text-black hover:!bg-gray-100 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isBought ? (
                                        <><CheckCircle className="w-4 h-4" /> Redeemed</>
                                    ) : isLoading ? (
                                        'Processing...'
                                    ) : canAfford ? (
                                        <><ShoppingBag className="w-4 h-4" /> Redeem Now</>
                                    ) : (
                                        `Need ${(product.price - (user?.coins || 0)).toLocaleString()} more coins`
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Premium Avatars Section */}
            <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 bg-[#8B5CF6]/15 dark:bg-[#0F2744] rounded-2xl flex items-center justify-center">
                        <span className="text-xl">🎭</span>
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-2xl text-gray-900 dark:text-white">Premium Avatars</h2>
                        <p className="text-sm text-gray-400">Unlock exclusive avatars to show off on your profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {PREMIUM_AVATARS.map(avatar => {
                        const canAfford = (user?.coins || 0) >= avatar.price;
                        const isBought = user?.unlocked_avatars ? user.unlocked_avatars.split(',').includes(avatar.id) : false;
                        const isLoading = loading === (avatar.id as any);
                        const feedback = msg?.id === (avatar.id as any) ? msg : null;

                        return (
                            <div key={avatar.id} className={`bg-white dark:bg-gray-900 rounded-[24px] p-5 border border-gray-100 dark:border-gray-800 card-glow flex flex-col gap-4 transition-all ${isBought ? 'opacity-80' : ''}`}>
                                {/* Image + Badge */}
                                <div className="flex items-start justify-between relative">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-[#555] dark:ring-[#555] flex-shrink-0 bg-gray-100 dark:bg-gray-800 shadow-lg">
                                        <img src={avatar.image} alt={avatar.name} className="w-full h-full object-cover" />
                                    </div>
                                    {avatar.badge && (
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#122236] dark:bg-[#122236] text-gray-400 dark:text-white px-2.5 py-1 rounded-full border border-[#1E3448] absolute -top-2 -right-2 shadow-sm">
                                            {avatar.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 mt-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">{avatar.name}</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">{avatar.description}</p>
                                </div>

                                {/* Price + CTA */}
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl py-2 border border-gray-100 dark:border-gray-800">
                                        <Zap className="w-3.5 h-3.5 text-gray-300" />
                                        <span className="font-black text-lg text-gray-400 dark:text-white">{avatar.price.toLocaleString()}</span>
                                        <span className="text-xs font-semibold text-gray-400">coins</span>
                                    </div>

                                    {feedback && (
                                        <p className={`text-xs font-semibold text-center ${feedback.success ? 'text-gray-300' : 'text-red-500'}`}>
                                            {feedback.text}
                                        </p>
                                    )}

                                    <button
                                        onClick={() => handleBuyAvatar(avatar)}
                                        disabled={isBought || isLoading}
                                        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                                            ${isBought
                                                ? 'bg-[#122236] dark:bg-[#122236] text-gray-400 dark:text-white border border-[#1E3448] cursor-default'
                                                : canAfford
                                                    ? 'btn-white !bg-white !text-black hover:!bg-gray-100 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isBought ? (
                                            <><CheckCircle className="w-4 h-4" /> Owned</>
                                        ) : isLoading ? (
                                            'Processing...'
                                        ) : canAfford ? (
                                            'Unlock Avatar'
                                        ) : (
                                            `Need ${(avatar.price - (user?.coins || 0)).toLocaleString()} more coins`
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            </>
            )}

            {/* Digital Parent Voucher Pass Modal */}
            {activePass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0c1c2e] via-[#0F2236] to-[#0A1828] border-2 border-amber-400/40 p-6 sm:p-7 shadow-2xl relative text-white space-y-5">
                        <button
                            type="button"
                            onClick={() => setActivePass(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-2">
                            <div className="text-5xl">{activePass.emoji}</div>
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-400/30">
                                <span>🎟️ Official Parent Reward Pass</span>
                            </div>
                            <h3 className="font-heading font-black text-xl text-white">
                                {activePass.title}
                            </h3>
                            <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                                {activePass.desc}
                            </p>
                        </div>

                        {/* Certificate Box */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 font-mono text-xs">
                            <div className="flex justify-between items-center text-gray-400 border-b border-white/10 pb-2">
                                <span>PASS CODE:</span>
                                <span className="font-bold text-cyan-300 text-sm tracking-widest">{activePass.code}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400">
                                <span>EARNED BY:</span>
                                <span className="font-bold text-white">{user?.nickname || user?.full_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400">
                                <span>COINS DEDUCTED:</span>
                                <span className="font-bold text-amber-400">{activePass.cost} Coins</span>
                            </div>
                            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                <span className="text-[11px] text-gray-400">PARENT SIGNATURE:</span>
                                <span className="text-gray-500 text-[11px] italic underline">Approved &bull; Verified</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setActivePass(null)}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-gray-950 font-bold text-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
                            >
                                Done &bull; Show To Parents
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
