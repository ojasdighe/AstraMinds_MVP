import { useDashboard } from '../DashboardLayout';

export default function UserSummaryCard() {
    const { user, loading } = useDashboard();

    if (loading) return (
        <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-[#E2E8F0] dark:border-[#1E3448] animate-pulse h-48" />
    );

    return (
        <div className="glass-panel card-glow rounded-[24px] p-8 border border-[#E2E8F0] dark:border-[#1E3448] relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0BBFBF]/12 rounded-full blur-[60px]" />
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div>
                    <p className="text-[10px] font-bold text-[#0BBFBF] uppercase tracking-[0.2em] mb-1">Player Profile</p>
                    <h2 className="font-heading font-black text-3xl tracking-tight bg-gradient-to-r from-[#0BBFBF] via-[#3B82F6] to-[#10B981] text-transparent bg-clip-text">{user?.nickname || user?.full_name}</h2>
                    {(user?.grade || user?.age) && (
                        <div className="flex items-center gap-2 mt-1.5">
                            {user?.grade && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#0BBFBF]/15 text-[#0BBFBF] border border-[#0BBFBF]/30">
                                    {user.grade}
                                </span>
                            )}
                            {user?.age && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                                    Age {user.age}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-fintech ring-1 ring-[#0BBFBF]/25 bg-[#E0F7FA] dark:bg-[#0F2744]">
                        <img
                            src={user?.avatar || '/game_avatar.png'}
                            alt="Player Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#0BBFBF] to-[#3B82F6] border border-[#0BBFBF]/30 rounded-lg px-2 py-0.5 text-white text-[11px] font-black shadow-glow">
                        Lv.{user?.level}
                    </div>
                </div>
            </div>

            <div className="mb-2 relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">Level {user?.level}</span>
                    <span className="text-sm font-bold text-[#0BBFBF]">Level {(user?.level ?? 1) + 1}</span>
                </div>
                <div
                    className="h-2.5 bg-[#E2E8F0] dark:bg-[#1E3448] rounded-full overflow-hidden cursor-pointer border border-[#E2E8F0] dark:border-[#1E3448] shadow-inner"
                    title={`${(user?.xp ?? 0).toLocaleString()} / ${(user?.xp_to_next_level ?? 1000).toLocaleString()} XP`}
                >
                    <div
                        className="h-full bg-gradient-to-r from-[#0BBFBF] via-[#3B82F6] to-[#10B981] rounded-full transition-all duration-1000 relative"
                        style={{ width: `${Math.min(100, Math.round(((user?.xp ?? 0) / (user?.xp_to_next_level ?? 1000)) * 100))}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30" />
                    </div>
                </div>
                <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 font-medium">
                    <span>{user?.xp.toLocaleString()} XP</span>
                    <span>{user?.xp_to_next_level.toLocaleString()} XP</span>
                </div>
            </div>
        </div>
    );
}
