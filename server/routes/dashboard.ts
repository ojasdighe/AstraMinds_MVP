import { Router } from 'express';
import {
    store,
    todayIso,
    addDaysIso,
    checkSeasonRollover,
    levelUp,
    serializeUser,
    type QuizQuestionRecord,
    type UserRecord,
} from '../store.js';
import { requireAuth, type AuthenticatedRequest } from '../authMiddleware.js';
import {
    generateAiQuizQuestions,
    generateChatReply,
    evaluateBudgetChallengeWithAI,
    generateAiBudgetScenario,
} from '../gemini.js';
import { BUDGET_SCENARIOS, type BudgetScenario } from '../data/budgetScenarios.js';

const router = Router();

router.use((_req, _res, next) => {
    try {
        checkSeasonRollover();
    } catch {
        // Ignore season rollover errors
    }
    next();
});

function getMondayIso(): string {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setUTCDate(d.getUTCDate() - diff);
    return d.toISOString().slice(0, 10);
}

function serializeQuizQuestion(q: QuizQuestionRecord) {
    return {
        id: q.id,
        topic: q.topic,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
    };
}

function sampleArray<T>(arr: T[], count: number): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
}

function rankCoins(rank: number): number {
    if (rank === 1) return 5000;
    if (rank === 2) return 2500;
    if (rank === 3) return 1000;
    if (rank <= 10) return 750;
    if (rank <= 50) return 500;
    if (rank <= 100) return 250;
    return 25;
}

router.get('/user-profile', requireAuth, (req: AuthenticatedRequest, res) => {
    res.status(200).json(serializeUser(req.currentUser!));
});

router.post('/complete-onboarding', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const { nickname, age, grade } = req.body || {};

    const cleanNickname = String(nickname || '').trim();
    const cleanAge = Number(age);
    const cleanGrade = String(grade || '').trim();

    if (!cleanNickname) {
        res.status(400).json({ error: 'Please enter what you would like Astra to call you.' });
        return;
    }

    if (isNaN(cleanAge) || cleanAge < 8 || cleanAge > 14) {
        res.status(400).json({ error: 'Please select a valid age between 8 and 14.' });
        return;
    }

    if (!cleanGrade) {
        res.status(400).json({ error: 'Please choose what grade you are studying in.' });
        return;
    }

    user.nickname = cleanNickname;
    user.age = cleanAge;
    user.grade = cleanGrade;
    user.onboarding_completed = true;
    store.save();

    // Send a welcome notification
    store.notifications.push({
        id: store.nextId('notifications'),
        user_id: user.id,
        title: `Welcome, ${cleanNickname}! 🌟`,
        message: `Your learning journey is now tailored for ${cleanGrade} (Age ${cleanAge}). Check out this week's Quizzes and Daily Challenge!`,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString(),
    });

    res.status(200).json({
        message: 'Onboarding completed successfully!',
        user: serializeUser(user),
    });
});

router.get('/streak', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const activeStreak = serializeUser(user).current_streak;
    const nextCheckpoint = [7, 14, 21, 30, 50].find(c => c > activeStreak) ?? null;
    res.status(200).json({
        current_streak: activeStreak,
        last_save_date: user.last_save_date,
        xp_per_day: 50,
        next_checkpoint: nextCheckpoint,
    });
});

function normalizeQuizType(raw: unknown): 'money' | 'safety' {
    return String(raw || '').toLowerCase() === 'safety' ? 'safety' : 'money';
}

async function handleGetQuiz(req: AuthenticatedRequest, res: any, quizType: 'money' | 'safety') {
    const user = req.currentUser!;
    const weekStart = getMondayIso();

    const attempt = store.quizAttempts.find(
        a => a.user_id === user.id && a.quiz_type === quizType && a.attempt_date >= weekStart
    );

    const bank = store.quizQuestions.filter(q => q.quiz_type === quizType);

    if (attempt) {
        const sample = sampleArray(bank, 5);
        res.status(200).json({
            quiz_type: quizType,
            questions: sample.map(serializeQuizQuestion),
            already_attempted: true,
            coins_earned_this_week: attempt.coins_earned,
        });
        return;
    }

    const aiQuestions = await generateAiQuizQuestions(quizType, {
        age: user.age,
        grade: user.grade,
        nickname: user.nickname || user.full_name,
    });
    let sample: QuizQuestionRecord[];

    if (aiQuestions.length === 5) {
        store.quizQuestions.push(...aiQuestions);
        sample = aiQuestions;
    } else {
        if (bank.length === 0) {
            res.status(200).json({ quiz_type: quizType, error: 'No quiz questions available yet', questions: [] });
            return;
        }
        sample = sampleArray(bank, 5);
    }

    res.status(200).json({
        quiz_type: quizType,
        questions: sample.map(serializeQuizQuestion),
        already_attempted: false,
        coins_earned_this_week: 0,
    });
}

function handleSubmitQuiz(req: AuthenticatedRequest, res: any, quizType: 'money' | 'safety') {
    const user = req.currentUser!;
    const weekStart = getMondayIso();

    const existing = store.quizAttempts.find(
        a => a.user_id === user.id && a.quiz_type === quizType && a.attempt_date >= weekStart
    );
    if (existing) {
        res.status(409).json({
            error:
                quizType === 'safety'
                    ? "You already completed this week's Digital Money Safety quiz"
                    : "You already completed this week's Money Smarts quiz",
        });
        return;
    }

    const answers = (req.body?.answers || {}) as Record<string, string>;
    const questionIds = new Set(Object.keys(answers).map(k => Number(k)));
    const questions = store.quizQuestions.filter(
        q => q.quiz_type === quizType && questionIds.has(q.id)
    );

    let score = 0;
    for (const q of questions) {
        const userAns = String(answers[String(q.id)] || '').toLowerCase();
        if (userAns === q.correct_answer) {
            score += 1;
        }
    }

    const total = questions.length;
    let coins = 0;
    if (score === total && total >= 5) coins = 200;
    else if (score >= 4) coins = 120;
    else if (score >= 3) coins = 60;
    else if (score >= 1) coins = 20;

    const xpEarned = score * 20;
    user.xp += xpEarned;
    user.lifetime_xp += xpEarned;
    levelUp(user);
    user.coins += coins;

    store.quizAttempts.push({
        id: store.nextId('quizAttempts'),
        user_id: user.id,
        quiz_type: quizType,
        score,
        coins_earned: coins,
        attempt_date: todayIso(),
        created_at: new Date().toISOString(),
    });

    res.status(200).json({
        quiz_type: quizType,
        score,
        total,
        coins_earned: coins,
        xp_earned: xpEarned,
        user: serializeUser(user),
        results: questions.map(q => ({
            id: q.id,
            question: q.question,
            user_answer: String(answers[String(q.id)] || '').toLowerCase(),
            correct_answer: q.correct_answer,
            explanation: q.explanation,
        })),
    });
}

router.get('/weekly-quiz', requireAuth, async (req: AuthenticatedRequest, res) => {
    const quizType = normalizeQuizType(req.query.type);
    await handleGetQuiz(req, res, quizType);
});

router.post('/submit-quiz', requireAuth, (req: AuthenticatedRequest, res) => {
    const quizType = normalizeQuizType(req.body?.quiz_type ?? req.query.type);
    handleSubmitQuiz(req, res, quizType);
});

router.get('/safety-quiz', requireAuth, async (req: AuthenticatedRequest, res) => {
    await handleGetQuiz(req, res, 'safety');
});

router.post('/submit-safety-quiz', requireAuth, (req: AuthenticatedRequest, res) => {
    handleSubmitQuiz(req, res, 'safety');
});

router.get('/leaderboard', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const timeframe = String(req.query.timeframe || 'season').toLowerCase();

    const eligibleUsers = store.users
        .filter(u => {
            if (!u.is_verified) return false;
            const em = u.email.toLowerCase();
            if (em.includes('test@example.com') || em.includes('@AstraMinds.local')) return false;
            if (u.full_name.toLowerCase().includes('test user')) return false;
            return true;
        })
        .sort((a, b) => (timeframe === 'all_time' ? b.lifetime_xp - a.lifetime_xp : b.xp - a.xp));

    const topUsers = eligibleUsers.slice(0, 100);
    const board = topUsers.map((u, i) => ({
        rank: i + 1,
        name: u.full_name,
        xp: timeframe === 'all_time' ? u.lifetime_xp : u.xp,
        season_xp: u.xp,
        lifetime_xp: u.lifetime_xp,
        level: u.level,
        coins: u.coins,
        rank_coins: rankCoins(i + 1),
        is_current_user: u.id === user.id,
    }));

    let userRank = board.find(e => e.is_current_user)?.rank ?? null;
    if (userRank === null) {
        const userVal = timeframe === 'all_time' ? user.lifetime_xp : user.xp;
        const higherCount = eligibleUsers.filter(u =>
            (timeframe === 'all_time' ? u.lifetime_xp : u.xp) > userVal
        ).length;
        userRank = higherCount + 1;
    }

    const season = Number(store.globalState.get('current_season_number') || '1');
    res.status(200).json({
        leaderboard: board,
        your_rank: userRank,
        season,
        timeframe,
    });
});

router.get('/coins', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    res.status(200).json({ coins: user.coins, user: serializeUser(user) });
});

router.post('/seed-quiz', (req, res) => {
    const force = Boolean(req.body?.force);
    if (store.quizQuestions.length > 0 && !force) {
        res.status(200).json({ message: 'Already seeded. Use {"force": true} to re-seed.' });
        return;
    }
    if (force) {
        store.quizQuestions = [];
    }
    store.seedQuizQuestions();
    res.status(201).json({ message: `Seeded ${store.quizQuestions.length} questions` });
});

router.post('/reset-quiz', (_req, res) => {
    store.quizAttempts = [];
    store.quizQuestions = [];
    res.status(200).json({ message: 'Quiz data reset successfully!' });
});

router.post('/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const userMessage = String(req.body?.message || '').trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!userMessage) {
        res.status(400).json({ error: 'No message provided' });
        return;
    }

    const result = await generateChatReply(user.id, userMessage, history);
    res.status(200).json(result);
});

router.post('/spend-coins', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const amount = req.body?.amount;

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
        res.status(400).json({ error: 'Invalid amount' });
        return;
    }

    if (user.coins < amount) {
        res.status(400).json({ error: `Insufficient coins. You have ${user.coins} but need ${amount}.` });
        return;
    }

    user.coins -= amount;
    res.status(200).json({
        message: `Successfully redeemed! ${amount} coins spent.`,
        coins: user.coins,
    });
});

router.post('/buy-avatar', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const avatarId = String(req.body?.avatar_id || '').trim();
    const price = req.body?.price;

    if (!avatarId || typeof price !== 'number' || !Number.isInteger(price) || price <= 0) {
        res.status(400).json({ error: 'Invalid request parameters' });
        return;
    }

    if (user.coins < price) {
        res.status(400).json({ error: `Insufficient coins. You need ${price} coins.` });
        return;
    }

    const avatars = user.unlocked_avatars
        ? user.unlocked_avatars.split(',').filter(Boolean)
        : [];

    if (avatars.includes(avatarId)) {
        res.status(400).json({ error: 'You already own this avatar.' });
        return;
    }

    user.coins -= price;
    avatars.push(avatarId);
    user.unlocked_avatars = avatars.join(',');

    res.status(200).json({
        success: true,
        coins: user.coins,
        unlocked_avatars: user.unlocked_avatars,
    });
});

router.get('/savings-history', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const today = todayIso();
    const thirtyDaysAgo = addDaysIso(today, -30);

    const userGoals = store.goals.filter(g => g.user_id === user.id);
    const goalIds = new Set(userGoals.map(g => g.id));
    const totalGoalSaved = userGoals.reduce((sum, g) => sum + Number(g.saved_amount || 0), 0);

    const dailyTotals: Record<string, number> = {};
    let totalMonthSaved = 0;

    const goalTxs = store.goalTransactions
        .filter(tx => goalIds.has(tx.goal_id) && tx.created_at.slice(0, 10) >= thirtyDaysAgo)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

    for (const tx of goalTxs) {
        const isSaving =
            (tx.type === 'GOAL_AUTOPAY' && tx.status === 'SUCCESS') || tx.type === 'CREDIT';
        if (isSaving && tx.amount > 0) {
            const dateStr = tx.created_at.slice(0, 10);
            const amt = Number(tx.amount);
            dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + amt;
            totalMonthSaved += amt;
        }
    }

    const startingBalance = Math.max(0, totalGoalSaved - totalMonthSaved);
    let running = startingBalance;
    const history = [];

    for (let i = 30; i >= 0; i--) {
        const dayStr = addDaysIso(today, -i);
        const dateObj = new Date(`${dayStr}T00:00:00.000Z`);
        const label = dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            timeZone: 'UTC',
        });
        const amt = Math.round((dailyTotals[dayStr] || 0) * 100) / 100;
        running += amt;
        history.push({
            date: dayStr,
            label,
            amount: amt,
            cumulative: Math.round(running * 100) / 100,
        });
    }

    res.status(200).json({
        history,
        total_month_saved: Math.round(totalMonthSaved * 100) / 100,
        total_goal_saved: Math.round(totalGoalSaved * 100) / 100,
    });
});

router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const notifs = store.notifications
        .filter(n => n.user_id === user.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 20)
        .map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            is_read: n.is_read,
            created_at: n.created_at,
        }));

    res.status(200).json({ notifications: notifs });
});

router.post('/notifications/read', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    for (const n of store.notifications) {
        if (n.user_id === user.id && !n.is_read) {
            n.is_read = true;
        }
    }
    res.status(200).json({ message: 'Notifications marked as read' });
});

type PlayableScenario = BudgetScenario & { is_ai_generated?: boolean };

const inFlightDailyScenarioByDate = new Map<string, Promise<PlayableScenario>>();

function findBudgetScenarioById(id: number): PlayableScenario | undefined {
    const dyn = store.dynamicBudgetScenarios.find(s => s.id === id);
    if (dyn) return dyn;
    return BUDGET_SCENARIOS.find(s => s.id === id);
}

function serializeBudgetScenarioForPlay(s: PlayableScenario) {
    return {
        id: s.id,
        title: s.title,
        category: s.category,
        emoji: s.emoji,
        starting_budget: s.starting_budget,
        purpose: s.purpose,
        is_ai_generated: Boolean(s.is_ai_generated),
        sudden_expense: {
            title: s.sudden_expense.title,
            cost: s.sudden_expense.cost,
            description: s.sudden_expense.description,
        },
        items: s.items.map(i => ({
            id: i.id,
            name: i.name,
            cost: i.cost,
            hint: i.hint,
        })),
    };
}

function buildScenarioReveal(
    scenario: PlayableScenario,
    selectedIds: string[],
    includedSudden: boolean
) {
    const selectedSet = new Set(selectedIds);
    return {
        ideal_tip: scenario.ideal_tip,
        sudden_expense: {
            ...scenario.sudden_expense,
            included: includedSudden,
        },
        items: scenario.items.map(i => ({
            ...i,
            selected: selectedSet.has(i.id),
        })),
    };
}

async function getOrGenerateDailyScenario(user: UserRecord, today: string): Promise<PlayableScenario> {
    const userTier = (user.age && user.age <= 10) ? 'junior' : (user.age && user.age >= 15) ? 'senior' : 'middle';
    const tierDailyKey = `${today}_${userTier}`;
    const existingDailyId = store.dailyBudgetScenarioByDate.get(tierDailyKey) || store.dailyBudgetScenarioByDate.get(today);
    if (existingDailyId) {
        const found = findBudgetScenarioById(existingDailyId);
        if (found) return found;
    }

    const inFlight = inFlightDailyScenarioByDate.get(tierDailyKey) || inFlightDailyScenarioByDate.get(today);
    if (inFlight) {
        return inFlight;
    }

    const promise = (async (): Promise<PlayableScenario> => {
        const avoidTitles = [
            ...store.dynamicBudgetScenarios.map(s => s.title),
            ...BUDGET_SCENARIOS.slice(0, 6).map(s => s.title),
        ];
        let aiScenario = await generateAiBudgetScenario({
            dateKey: today,
            avoidTitles,
            learnerProfile: {
                age: user.age,
                grade: user.grade,
                nickname: user.nickname || user.full_name,
            },
        });
        if (!aiScenario) {
            aiScenario = await generateAiBudgetScenario({
                dateKey: today,
                avoidTitles,
                learnerProfile: {
                    age: user.age,
                    grade: user.grade,
                    nickname: user.nickname || user.full_name,
                },
            });
        }
        if (aiScenario) {
            store.dynamicBudgetScenarios.push(aiScenario);
            store.dailyBudgetScenarioByDate.set(tierDailyKey, aiScenario.id);
            return aiScenario;
        }

        const playedIds = new Set(
            store.budgetChallengeAttempts
                .filter(a => a.user_id === user.id)
                .map(a => a.scenario_id)
        );
        const unseen = BUDGET_SCENARIOS.filter(s => !playedIds.has(s.id));
        const pool = unseen.length > 0 ? unseen : BUDGET_SCENARIOS;
        const picked = pool[Math.floor(Math.random() * pool.length)] || BUDGET_SCENARIOS[0];
        store.dailyBudgetScenarioByDate.set(tierDailyKey, picked.id);
        return { ...picked, is_ai_generated: false };
    })();

    inFlightDailyScenarioByDate.set(tierDailyKey, promise);
    try {
        return await promise;
    } finally {
        inFlightDailyScenarioByDate.delete(tierDailyKey);
    }
}

router.get('/budget-challenge/daily', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const today = todayIso();
    const scenario = await getOrGenerateDailyScenario(user, today);

    const existingAssign = store.dailyBudgetAssignments.find(
        a => a.user_id === user.id && a.date === today
    );
    if (!existingAssign) {
        store.dailyBudgetAssignments.push({
            user_id: user.id,
            date: today,
            scenario_id: scenario.id,
        });
    }

    const dailyAttempt = store.budgetChallengeAttempts.find(
        a => a.user_id === user.id && a.date === today && a.is_daily
    );
    const uniqueCompleted = new Set(
        store.budgetChallengeAttempts
            .filter(a => a.user_id === user.id)
            .map(a => a.scenario_id)
    );
    const dailyStreakCount = new Set(
        store.budgetChallengeAttempts
            .filter(a => a.user_id === user.id && a.is_daily)
            .map(a => a.date)
    ).size;

    res.status(200).json({
        date: today,
        completed_scenarios_count: uniqueCompleted.size,
        daily_days_completed: dailyStreakCount,
        already_completed_today: Boolean(dailyAttempt),
        is_daily: true,
        scenario: serializeBudgetScenarioForPlay(scenario),
        previous_attempt: dailyAttempt
            ? {
                selected_item_ids: dailyAttempt.selected_item_ids,
                included_sudden_expense: dailyAttempt.included_sudden_expense,
                total_spent: dailyAttempt.total_spent,
                money_saved: dailyAttempt.money_saved,
                coins_earned: dailyAttempt.coins_earned,
                xp_earned: dailyAttempt.xp_earned,
                reasoning: dailyAttempt.reasoning,
                feedback: dailyAttempt.feedback,
                reveal: buildScenarioReveal(
                    scenario,
                    dailyAttempt.selected_item_ids,
                    dailyAttempt.included_sudden_expense
                ),
            }
            : null,
    });
});

router.get('/budget-challenge/practice', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const excludeId = Number(req.query.excludeId || 0);
    const today = todayIso();
    const dailyScenarioId = store.dailyBudgetScenarioByDate.get(today);

    const avoidTitles = [
        ...store.dynamicBudgetScenarios.map(s => s.title),
        ...BUDGET_SCENARIOS.filter(s => s.id === excludeId || s.id === dailyScenarioId).map(s => s.title),
    ];

    let picked: PlayableScenario | null = await generateAiBudgetScenario({
        dateKey: `${today}-practice-${Date.now()}`,
        avoidTitles,
    });

    if (picked) {
        store.dynamicBudgetScenarios.push({ ...picked, date_key: today, is_ai_generated: picked.is_ai_generated ?? true });
    } else {
        const playedIds = new Set(
            store.budgetChallengeAttempts
                .filter(a => a.user_id === user.id)
                .map(a => a.scenario_id)
        );
        let pool = BUDGET_SCENARIOS.filter(
            s => !playedIds.has(s.id) && s.id !== excludeId && s.id !== dailyScenarioId
        );
        if (pool.length === 0) {
            pool = BUDGET_SCENARIOS.filter(s => s.id !== excludeId);
        }
        const fallback = pool[Math.floor(Math.random() * pool.length)] || BUDGET_SCENARIOS[0];
        picked = { ...fallback, is_ai_generated: false };
    }

    const uniqueCompleted = new Set(
        store.budgetChallengeAttempts
            .filter(a => a.user_id === user.id)
            .map(a => a.scenario_id)
    );
    const dailyStreakCount = new Set(
        store.budgetChallengeAttempts
            .filter(a => a.user_id === user.id && a.is_daily)
            .map(a => a.date)
    ).size;

    res.status(200).json({
        date: today,
        completed_scenarios_count: uniqueCompleted.size,
        daily_days_completed: dailyStreakCount,
        already_completed_today: false,
        is_daily: false,
        scenario: serializeBudgetScenarioForPlay(picked),
    });
});

router.post('/budget-challenge/submit', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const today = todayIso();
    const scenarioId = Number(req.body?.scenario_id);
    const scenario = findBudgetScenarioById(scenarioId);
    if (!scenario) {
        res.status(404).json({ error: 'Budget scenario not found' });
        return;
    }

    const isDaily = Boolean(req.body?.is_daily);
    if (isDaily) {
        const existingDaily = store.budgetChallengeAttempts.find(
            a => a.user_id === user.id && a.date === today && a.is_daily
        );
        if (existingDaily) {
            res.status(409).json({
                error: "You already completed today's Daily Challenge! Try a Bonus Practice round or come back tomorrow for a fresh challenge.",
            });
            return;
        }
    }

    const validItemIds = new Set(scenario.items.map(i => i.id));
    const selectedItemIds: string[] = Array.isArray(req.body?.selected_item_ids)
        ? Array.from(
            new Set(
                req.body.selected_item_ids
                    .map((id: unknown) => String(id))
                    .filter((id: string) => validItemIds.has(id))
            )
        )
        : [];
    const includedSuddenExpense = Boolean(req.body?.include_sudden_expense);
    const reasoning = String(req.body?.reasoning || '').trim().slice(0, 400);

    const itemsCost = scenario.items
        .filter(i => selectedItemIds.includes(i.id))
        .reduce((sum, i) => sum + i.cost, 0);
    const suddenCost = includedSuddenExpense ? scenario.sudden_expense.cost : 0;
    const totalSpent = itemsCost + suddenCost;
    const moneySaved = scenario.starting_budget - totalSpent;

    const feedback = await evaluateBudgetChallengeWithAI({
        scenario,
        selectedItemIds,
        includedSuddenExpense,
        reasoning,
    });

    let coinsEarned = 0;
    let xpEarned = 0;
    if (isDaily) {
        if (feedback.verdict === 'EXCELLENT') {
            coinsEarned = 100;
            xpEarned = 40;
        } else if (feedback.verdict === 'GOOD') {
            coinsEarned = 60;
            xpEarned = 25;
        } else {
            coinsEarned = 25;
            xpEarned = 15;
        }
        user.coins += coinsEarned;
        user.xp += xpEarned;
        user.lifetime_xp += xpEarned;
        levelUp(user);
    }

    store.budgetChallengeAttempts.push({
        id: store.nextId('budgetChallengeAttempts'),
        user_id: user.id,
        scenario_id: scenario.id,
        date: today,
        is_daily: isDaily,
        selected_item_ids: selectedItemIds,
        included_sudden_expense: includedSuddenExpense,
        total_spent: totalSpent,
        money_saved: moneySaved,
        coins_earned: coinsEarned,
        xp_earned: xpEarned,
        reasoning,
        feedback,
        created_at: new Date().toISOString(),
    });

    const uniqueCompleted = new Set(
        store.budgetChallengeAttempts
            .filter(a => a.user_id === user.id)
            .map(a => a.scenario_id)
    );
    const dailyStreakCount = new Set(
        store.budgetChallengeAttempts
            .filter(a => a.user_id === user.id && a.is_daily)
            .map(a => a.date)
    ).size;

    res.status(200).json({
        is_daily: isDaily,
        total_spent: totalSpent,
        money_saved: moneySaved,
        starting_budget: scenario.starting_budget,
        coins_earned: coinsEarned,
        xp_earned: xpEarned,
        completed_scenarios_count: uniqueCompleted.size,
        daily_days_completed: dailyStreakCount,
        feedback,
        reveal: buildScenarioReveal(scenario, selectedItemIds, includedSuddenExpense),
        user: serializeUser(user),
    });
});

router.get('/budget-challenge/history', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const attempts = store.budgetChallengeAttempts
        .filter(a => a.user_id === userId)
        .sort((a, b) => (b.date > a.date ? 1 : -1));

    const history = attempts.map(a => {
        const scenario = findBudgetScenarioById(a.scenario_id);
        return {
            ...a,
            scenario_title: scenario?.title || 'Daily Budget Mission',
            scenario_emoji: scenario?.emoji || '🎯',
            starting_budget: scenario?.starting_budget || 0,
        };
    });

    res.status(200).json({
        total_attempts: history.length,
        total_savings: history.reduce((sum, h) => sum + (h.money_saved || 0), 0),
        total_coins: history.reduce((sum, h) => sum + (h.coins_earned || 0), 0),
        history,
    });
});

export default router;
