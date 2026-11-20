import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SolutionSection from './components/SolutionSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import ImpactSection from './components/ImpactSection';
import FaqSection from './components/FaqSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import ProtectedRoute from './components/ProtectedRoute';
import { useEffect } from 'react';
import NotFoundGlitchPreview from './components/NotFound';

// Dashboard
import DashboardLayout from './dashboard/DashboardLayout';
import DashboardHome from './dashboard/pages/DashboardHome';
import QuizPage from './dashboard/pages/QuizPage';
import LeaderboardPage from './dashboard/pages/LeaderboardPage';
import CoinsPage from './dashboard/pages/CoinsPage';
import SettingsPage from './dashboard/pages/SettingsPage';
import ShopPage from './dashboard/pages/ShopPage';
import GoalsPage from './dashboard/pages/GoalsPage';
import GoalDetailsPage from './dashboard/pages/GoalDetailsPage';
import SpinPage from './dashboard/pages/SpinPage';
import MoneyTrackerPage from './dashboard/pages/MoneyTrackerPage';
import FlashcardsPage from './dashboard/pages/FlashcardsPage';
import BudgetChallengePage from './dashboard/pages/BudgetChallengePage';

function LandingPage() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.observe-animate').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="dark video-theme flex flex-col min-h-screen overflow-hidden text-white transition-colors duration-300 font-body relative">
            <Navbar />
            <main className="relative z-10">
                <Hero />
                <SolutionSection />
                <FeaturesSection />
                <HowItWorksSection />
                <ImpactSection />
                <FaqSection />
                <CtaSection />
            </main>
            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />



                {/* Protected Dashboard — nested layout */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardHome />} />
                    <Route path="quiz" element={<QuizPage initialTrack="money" />} />
                    <Route path="safety-quiz" element={<QuizPage initialTrack="safety" />} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                    <Route path="coins" element={<CoinsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="shop" element={<ShopPage />} />
                    <Route path="spin" element={<SpinPage />} />
                    <Route path="goals" element={<GoalsPage />} />
                    <Route path="goals/:id" element={<GoalDetailsPage />} />
                    <Route path="tracker" element={<MoneyTrackerPage />} />
                    <Route path="flashcards" element={<FlashcardsPage />} />
                    <Route path="budget-challenge" element={<BudgetChallengePage />} />
                </Route>
                
                {/* 404 Catch-All Route */}
                <Route path="*" element={<NotFoundGlitchPreview />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
