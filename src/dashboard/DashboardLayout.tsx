import { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import ChatBot from './ChatBot';
import OnboardingModal from './components/OnboardingModal';
import { api } from './api';
import MatrixLoader from '../components/ui/MatrixLoader';
import AppFooter from '../components/AppFooter';

export interface UserProfile {
    id: number;
    full_name: string;
    nickname?: string | null;
    email: string;
    xp: number;
    level: number;
    xp_to_next_level: number;
    coins: number;
    current_streak: number;
    total_saved: number;
    avatar?: string;
    age?: number | null;
    grade?: string | null;
    onboarding_completed?: boolean;
    streak_shields: number;
    unlocked_avatars: string;
}

export interface AppNotification {
    id: number;
    title: string;
    desc: string;
    time: string;
    type: 'success' | 'info' | 'reward';
}

interface DashboardContextType {
    user: UserProfile | null;
    refreshUser: () => void;
    loading: boolean;
    notifications: AppNotification[];
    addNotification: (title: string, desc: string, type: AppNotification['type']) => void;
    clearNotifications: () => void;
}

const DashboardContext = createContext<DashboardContextType>({
    user: null,
    refreshUser: () => { },
    loading: true,
    notifications: [],
    addNotification: () => { },
    clearNotifications: () => { },
});

export const useDashboard = () => useContext(DashboardContext);

export default function DashboardLayout() {
    const location = useLocation();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([
        { id: Date.now(), title: 'Welcome to AstraMinds!', desc: 'Start saving to earn XP.', time: 'Just now', type: 'info' }
    ]);

    const addNotification = (title: string, desc: string, type: AppNotification['type']) => {
        setNotifications(prev => [{ id: Date.now(), title, desc, time: 'Just now', type }, ...prev]);
    };

    const clearNotifications = async () => {
        setNotifications([]);
        try {
            await api.post('/api/notifications/read', {});
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const isDark = localStorage.getItem('theme') !== 'light';
        setIsDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        fetchUser();
    }, []);

    // Re-sync user profile on navigation to keep streak, coins, and XP 100% updated
    useEffect(() => {
        fetchUser();
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const fetchUser = async () => {
        try {
            const data = await api.get('/api/user-profile');
            setUser(data);
            localStorage.setItem('astraminds_user', JSON.stringify(data));

            const notifs = await api.get('/api/notifications');
            if (notifs.notifications) {
                const mappedNotifs = notifs.notifications.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    desc: n.message,
                    time: new Date(n.created_at).toLocaleDateString(),
                    type: n.type || 'info',
                    is_read: n.is_read
                }));
                setNotifications(mappedNotifs.filter((n: any) => !n.is_read));
            }
        } catch {
            // token expired or invalid — let ProtectedRoute handle redirect
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = () => {
        const newDark = !isDarkMode;
        setIsDarkMode(newDark);
        if (newDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
        else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4FF] dark:bg-[#0D1B2A] text-white gap-4">
                <MatrixLoader size="lg" variant="orbit" rounded />
                <span className="text-xs text-[#0BBFBF] tracking-wider uppercase font-medium">Loading AstraMinds...</span>
            </div>
        );
    }

    return (
        <DashboardContext.Provider value={{ user, refreshUser: fetchUser, loading, notifications, addNotification, clearNotifications }}>
            <div className="dashboard-layout flex h-[100dvh] w-full overflow-hidden text-gray-900 dark:text-gray-100 font-body">
                <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

                <div className="dashboard-content-wrapper flex-1 min-w-0 flex flex-col overflow-hidden">
                    <TopNavbar
                        onMenuClick={() => setMobileMenuOpen(true)}
                        isDarkMode={isDarkMode}
                        onToggleTheme={toggleTheme}
                        userName={user?.nickname || user?.full_name}
                    />
                    <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col justify-between">
                        <div className="p-3 sm:p-4 md:p-6 flex-1 min-w-0">
                            <Outlet />
                        </div>
                        <AppFooter />
                    </main>
                </div>
                <ChatBot />
                <OnboardingModal
                    isOpen={Boolean(user && !user.onboarding_completed)}
                    user={user}
                    onCompleted={(updated) => {
                        setUser(updated);
                        localStorage.setItem('astraminds_user', JSON.stringify(updated));
                    }}
                />
            </div>
        </DashboardContext.Provider>
    );
}
