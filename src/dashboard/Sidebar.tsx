import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Brain, ShieldCheck, Trophy, LogOut, Settings, PanelLeftOpen, PanelLeftClose, ShoppingBag, Target, Gift, ReceiptText, Layers, Wallet } from 'lucide-react';
import PwaInstallButton from '../components/pwa/PwaInstallButton';

const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/dashboard/goals', icon: Target, label: 'Savings Goals' },
    { to: '/dashboard/tracker', icon: ReceiptText, label: 'Pocket Money' },
    { to: '/dashboard/flashcards', icon: Layers, label: 'Money Flashcards' },
    { to: '/dashboard/budget-challenge', icon: Wallet, label: 'Daily Challenge' },
    { to: '/dashboard/quiz', icon: Brain, label: 'Money Quiz' },
    { to: '/dashboard/safety-quiz', icon: ShieldCheck, label: 'Digital Safety Quiz' },
    { to: '/dashboard/spin', icon: Gift, label: 'Daily Spin' },
    { to: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/dashboard/shop', icon: ShoppingBag, label: 'Shop' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
    const navigate = useNavigate();
    const [collapsedState, setCollapsed] = useState(false);
    // The mobile drawer is always shown expanded
    const collapsed = collapsedState && !mobileOpen;

    const logout = () => {
        localStorage.removeItem('astraminds_token');
        localStorage.removeItem('astraminds_user');
        navigate('/login');
    };

    return (
        <>
        {/* Mobile backdrop */}
        <div
            onClick={onMobileClose}
            aria-hidden="true"
            className={`md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
        <aside className={`
            flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
            fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] h-full bg-[#0D1B2A] shadow-2xl
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:inset-auto md:z-20 md:translate-x-0 md:bg-transparent md:shadow-none md:max-w-none
            ${collapsed ? 'md:w-20' : 'md:w-64'}
        `}>
            {/* Logo / Header */}
            <div className={`flex items-center h-24 border-b-0 border-transparent flex-shrink-0 transition-all duration-300 relative ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
                {collapsed ? (
                    /* Compact mode: Hovering over AstraMinds logo swaps it with PanelLeftOpen icon + "Open sidebar" pill */
                    <button
                        type="button"
                        onClick={() => setCollapsed(false)}
                        className="relative group p-2 rounded-2xl flex items-center justify-center focus:outline-none cursor-pointer"
                        aria-label="Open sidebar"
                    >
                        {/* Normal AstraMinds Logo: visible by default */}
                        <div className="w-10 h-10 rounded-xl shadow-glow flex-shrink-0 bg-transparent transition-all duration-200 group-hover:opacity-0 group-hover:scale-90">
                            <img src="/AstraMinds.ico" alt="AstraMinds Logo" className="w-full h-full rounded-xl object-cover" />
                        </div>

                        {/* Hover Logo Icon: PanelLeftOpen in circular container */}
                        <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#122236] border border-gray-300 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-sm">
                                <PanelLeftOpen className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Hover Tooltip Pill: "Open sidebar" */}
                        <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none transition-all duration-200 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0">
                            <div className="bg-[#ececec] text-[#0d0d0d] text-sm font-medium px-4 py-2 rounded-full shadow-2xl whitespace-nowrap flex items-center tracking-normal border border-black/5 select-none">
                                Open sidebar
                            </div>
                        </div>
                    </button>
                ) : (
                    /* Expanded mode: Logo + "AstraMinds" title + Collapse button */
                    <>
                        <NavLink to="/dashboard" className="flex items-center overflow-hidden cursor-pointer group py-1">
                            <img src="/AstraMinds.svg" alt="AstraMinds" className="h-20 md:h-22 w-auto max-w-[190px] object-contain transition-transform group-hover:scale-105 drop-shadow-[0_4px_16px_rgba(253,105,13,0.3)]" />
                        </NavLink>

                        {/* Collapse sidebar button */}
                        <div className="relative group">
                            <button
                                type="button"
                                onClick={() => setCollapsed(true)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
                                aria-label="Close sidebar"
                            >
                                <PanelLeftClose className="w-5 h-5" />
                            </button>
                            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex items-center pointer-events-none z-50">
                                <div className="bg-[#ececec] text-[#0d0d0d] text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap border border-black/5">
                                    Close sidebar
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Nav Links */}
            <nav className={`flex-1 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden bg-transparent border-0 border-transparent [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ${collapsed ? 'px-3' : 'px-4'}`}>
                {links.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={onMobileClose}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group
                            ${collapsed ? 'justify-center px-0' : 'px-4'}
                            ${isActive
                                ? 'bg-white dark:bg-[#122236] text-[#0BBFBF] border-l-4 border-l-[#0BBFBF] border-y-0 border-r-0 shadow-sm font-bold'
                                : 'text-gray-500 dark:text-gray-400 border border-transparent hover:bg-[#0BBFBF]/[0.08] dark:hover:bg-[#0BBFBF]/[0.08] hover:text-[#0BBFBF] dark:hover:text-[#0BBFBF]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 text-[#0BBFBF]' : 'group-hover:scale-110'}`} />
                                {!collapsed && <span className={`whitespace-nowrap tracking-wide ${isActive ? 'text-[#0BBFBF]' : ''}`}>{label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* PWA Install */}
            <div className={`pt-2 bg-transparent border-0 border-transparent ${collapsed ? 'px-3' : 'px-4'}`}>
                <PwaInstallButton
                    variant={collapsed ? 'icon' : 'sidebar'}
                    label="Install App"
                    className="w-full justify-center"
                />
            </div>

            {/* Logout */}
            <div className={`py-4 bg-transparent border-0 border-transparent ${collapsed ? 'px-3' : 'px-4'}`}>
                <button
                    onClick={logout}
                    title={collapsed ? 'Logout' : undefined}
                    className={`flex items-center gap-3 w-full py-3 rounded-xl text-sm font-medium text-red-400/90 hover:text-red-300 dark:hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'px-4'}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="tracking-wide">Logout</span>}
                </button>
            </div>
        </aside>
        </>
    );
}
