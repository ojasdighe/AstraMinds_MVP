import { Router } from 'express';
import {
    store,
    todayIso,
    addDaysIso,
    calculateGoalCompletionCoins,
    getActiveStreak,
    getUserAccountBalance,
    levelUp,
    processGoalAutopay,
    serializeUser,
    type GoalRecord,
    type GoalAutoSavingRecord,
} from '../store.js';
import { requireAuth, type AuthenticatedRequest } from '../authMiddleware.js';

const router = Router();

function serializeGoal(g: GoalRecord) {
    return {
        id: g.id,
        name: g.name,
        description: g.description,
        target_amount: g.target_amount,
        saved_amount: g.saved_amount,
        target_date: g.target_date,
        icon: g.icon,
        status: g.status,
        reward_awarded: Boolean(g.reward_awarded),
        completion_reward_coins: calculateGoalCompletionCoins(g.target_amount),
        original_completion_date: g.original_completion_date,
        current_completion_date: g.current_completion_date,
        created_at: g.created_at,
    };
}

function serializeAutoSaving(a: GoalAutoSavingRecord) {
    return {
        id: a.id,
        goal_id: a.goal_id,
        frequency: a.frequency,
        custom_days: a.custom_days,
        amount: a.amount,
        next_run_date: a.next_run_date,
    };
}

function computeDailyRate(autoSaving: GoalAutoSavingRecord): number {
    if (autoSaving.frequency === 'DAILY') return autoSaving.amount;
    if (autoSaving.frequency === 'WEEKLY') return autoSaving.amount / 7;
    if (autoSaving.frequency === 'MONTHLY') return autoSaving.amount / 30;
    if (autoSaving.frequency === 'CUSTOM' && autoSaving.custom_days && autoSaving.custom_days > 0) {
        return autoSaving.amount / autoSaving.custom_days;
    }
    return 0;
}

router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const goals = store.goals.filter(g => g.user_id === user.id);

    const activeGoals = goals.filter(g => g.status === 'ACTIVE');
    const completedGoals = goals.filter(g => g.status === 'COMPLETED');

    const totalSaved = goals.reduce((sum, g) => sum + Number(g.saved_amount || 0), 0);
    const totalRemaining = activeGoals.reduce(
        (sum, g) => sum + Math.max(0, Number(g.target_amount) - Number(g.saved_amount)),
        0
    );

    let progressSum = 0;
    for (const g of activeGoals) {
        const progress = g.target_amount > 0 ? (g.saved_amount / g.target_amount) * 100 : 0;
        progressSum += Math.min(progress, 100);
    }
    const avgProgress = activeGoals.length > 0 ? progressSum / activeGoals.length : 0;

    const today = todayIso();
    const firstOfMonth = `${today.slice(0, 7)}-01`;
    const goalIds = new Set(goals.map(g => g.id));

    let monthlySaving = 0;
    for (const tx of store.goalTransactions) {
        if (!goalIds.has(tx.goal_id)) continue;
        if (tx.created_at.slice(0, 10) < firstOfMonth) continue;
        if ((tx.type === 'GOAL_AUTOPAY' && tx.status === 'SUCCESS') || tx.type === 'CREDIT') {
            monthlySaving += Number(tx.amount || 0);
        }
    }
    if (monthlySaving === 0 && goals.length > 0 && goals.every(g => g.created_at.slice(0, 10) >= firstOfMonth)) {
        monthlySaving = totalSaved;
    }
    monthlySaving = Math.min(monthlySaving, totalSaved);

    const activeGoalIds = new Set(activeGoals.map(g => g.id));
    let monthlyCommitment = 0;
    for (const a of store.goalAutoSavings) {
        if (!activeGoalIds.has(a.goal_id)) continue;
        if (a.frequency === 'DAILY') monthlyCommitment += a.amount * 30;
        else if (a.frequency === 'WEEKLY') monthlyCommitment += a.amount * 4;
        else if (a.frequency === 'MONTHLY') monthlyCommitment += a.amount;
        else if (a.frequency === 'CUSTOM' && a.custom_days && a.custom_days > 0) {
            monthlyCommitment += a.amount * (30 / a.custom_days);
        }
    }

    const goalsData = goals.map(g => {
        const autoSaving = store.goalAutoSavings.find(a => a.goal_id === g.id) || null;
        return {
            ...serializeGoal(g),
            auto_saving: autoSaving ? serializeAutoSaving(autoSaving) : null,
        };
    });

    const accountBalance = getUserAccountBalance(user.id);

    res.status(200).json({
        goals: goalsData,
        summary: {
            total_active: activeGoals.length,
            total_completed: completedGoals.length,
            total_saved: totalSaved,
            total_remaining: totalRemaining,
            avg_progress: avgProgress,
            monthly_saving_rate: monthlySaving,
            monthly_commitment: monthlyCommitment,
            account_balance: accountBalance,
            net_cash_flow: accountBalance,
            current_streak: getActiveStreak(user),
        },
    });
});

router.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const data = req.body || {};

    const name = String(data.name || '').trim();
    const targetAmount = Number(data.target_amount || 0);
    const targetDateStr = String(data.target_date || '').trim();
    const icon = String(data.icon || '🎯');
    const description = String(data.description || '');

    if (!name || !targetAmount || !targetDateStr) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const nowIso = new Date().toISOString();
    const goal: GoalRecord = {
        id: store.nextId('goals'),
        user_id: user.id,
        name,
        description,
        target_amount: targetAmount,
        saved_amount: 0,
        target_date: targetDateStr,
        icon,
        status: 'ACTIVE',
        reward_awarded: false,
        original_completion_date: targetDateStr,
        current_completion_date: targetDateStr,
        created_at: nowIso,
    };
    store.goals.push(goal);

    const autoSavingData = data.auto_saving;
    if (autoSavingData && typeof autoSavingData === 'object') {
        const freqRaw = String(autoSavingData.frequency || 'MONTHLY').toUpperCase();
        const freq = (['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'].includes(freqRaw)
            ? freqRaw
            : 'MONTHLY') as GoalAutoSavingRecord['frequency'];
        const amount = Number(autoSavingData.amount || 0);
        const customDays = autoSavingData.custom_days ? Number(autoSavingData.custom_days) : null;

        const today = todayIso();
        let nextRun = addDaysIso(today, 1);
        if (freq === 'WEEKLY') nextRun = addDaysIso(today, 7);
        else if (freq === 'MONTHLY') nextRun = addDaysIso(today, 30);
        else if (freq === 'CUSTOM' && customDays && Number.isFinite(customDays)) {
            nextRun = addDaysIso(today, Math.max(1, Math.trunc(customDays)));
        }

        store.goalAutoSavings.push({
            id: store.nextId('goalAutoSavings'),
            goal_id: goal.id,
            frequency: freq,
            custom_days: customDays,
            amount,
            next_run_date: nextRun,
            created_at: nowIso,
        });
    }

    res.status(201).json({
        message: 'Goal created successfully',
        goal: serializeGoal(goal),
    });
});

router.get('/account-balance', requireAuth, (req: AuthenticatedRequest, res) => {
    const accountBalance = getUserAccountBalance(req.userId!);
    res.status(200).json({
        account_balance: accountBalance,
        net_cash_flow: accountBalance,
    });
});

router.get('/net-cash-flow', requireAuth, (req: AuthenticatedRequest, res) => {
    const accountBalance = getUserAccountBalance(req.userId!);
    res.status(200).json({
        account_balance: accountBalance,
        net_cash_flow: accountBalance,
    });
});

router.get('/:goalId', requireAuth, (req: AuthenticatedRequest, res) => {
    const goalId = Number(req.params.goalId);
    const goal = store.goals.find(g => g.id === goalId && g.user_id === req.userId!);
    if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
    }

    const autoSaving = store.goalAutoSavings.find(a => a.goal_id === goal.id) || null;
    const transactions = store.goalTransactions
        .filter(t => t.goal_id === goal.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
    const delayHistory = store.goalDelayHistory
        .filter(d => d.goal_id === goal.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);

    res.status(200).json({
        ...serializeGoal(goal),
        auto_saving: autoSaving ? serializeAutoSaving(autoSaving) : null,
        transactions,
        delay_history: delayHistory,
    });
});

router.delete('/:goalId', requireAuth, (req: AuthenticatedRequest, res) => {
    const goalId = Number(req.params.goalId);
    const idx = store.goals.findIndex(g => g.id === goalId && g.user_id === req.userId!);
    if (idx === -1) {
        res.status(404).json({ error: 'Goal not found' });
        return;
    }

    store.goals.splice(idx, 1);
    store.goalAutoSavings = store.goalAutoSavings.filter(a => a.goal_id !== goalId);
    store.goalTransactions = store.goalTransactions.filter(t => t.goal_id !== goalId);
    store.goalDelayHistory = store.goalDelayHistory.filter(d => d.goal_id !== goalId);

    res.status(200).json({ message: 'Goal deleted' });
});

router.put('/:goalId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const goalId = Number(req.params.goalId);
    const goal = store.goals.find(g => g.id === goalId && g.user_id === user.id);
    if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
    }

    const data = req.body || {};
    if (typeof data.name === 'string' && data.name.trim()) {
        goal.name = data.name.trim();
    }
    if ('target_amount' in data) {
        const parsed = Number(data.target_amount);
        if (Number.isFinite(parsed) && parsed > 0) {
            goal.target_amount = parsed;
            if (goal.saved_amount >= goal.target_amount && goal.status !== 'COMPLETED' && !goal.reward_awarded) {
                goal.status = 'COMPLETED';
                goal.current_completion_date = todayIso();
                const completionCoins = calculateGoalCompletionCoins(goal.target_amount);
                user.coins += completionCoins;
                goal.reward_awarded = true;
                store.notifications.push({
                    id: store.nextId('notifications'),
                    user_id: user.id,
                    title: 'Goal Completed! 🏆',
                    message: `Congratulations! You completed your goal '${goal.name}' (Target: ₹${goal.target_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) and earned ${completionCoins.toLocaleString('en-IN')} Gold Coins!`,
                    type: 'reward',
                    is_read: false,
                    created_at: new Date().toISOString(),
                });
            }
        }
    }
    if ('description' in data) {
        goal.description = data.description !== null ? String(data.description) : null;
    }

    res.status(200).json({ message: 'Goal updated', goal: serializeGoal(goal) });
});

router.put('/:goalId/status', requireAuth, (req: AuthenticatedRequest, res) => {
    const goalId = Number(req.params.goalId);
    const goal = store.goals.find(g => g.id === goalId && g.user_id === req.userId!);
    if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
    }

    if (goal.status === 'ACTIVE') goal.status = 'PAUSED';
    else if (goal.status === 'PAUSED') goal.status = 'ACTIVE';

    res.status(200).json({ message: 'Goal status updated', status: goal.status });
});

router.post('/:goalId/simulate-purchase', requireAuth, (req: AuthenticatedRequest, res) => {
    const goalId = Number(req.params.goalId);
    const goal = store.goals.find(g => g.id === goalId && g.user_id === req.userId!);
    if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
    }

    const purchaseAmount = Number(req.body?.purchase_amount || 0);
    if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
        res.status(400).json({ error: 'Invalid amount' });
        return;
    }

    const autoSaving = store.goalAutoSavings.find(a => a.goal_id === goal.id);
    if (!autoSaving || autoSaving.amount <= 0) {
        res.status(400).json({ error: 'No auto-saving configured to calculate delay' });
        return;
    }

    const dailyRate = computeDailyRate(autoSaving);
    if (dailyRate <= 0) {
        res.status(400).json({ error: 'Invalid daily saving rate' });
        return;
    }

    const delayDays = Math.ceil(purchaseAmount / dailyRate);
    const newCompletionDate = addDaysIso(goal.current_completion_date, delayDays);

    res.status(200).json({
        delay_days: delayDays,
        new_completion_date: newCompletionDate,
        current_completion_date: goal.current_completion_date,
        goal_name: goal.name,
    });
});

router.post('/:goalId/decision', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const goalId = Number(req.params.goalId);
    const goal = store.goals.find(g => g.id === goalId && g.user_id === user.id);
    if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
    }

    const decision = String(req.body?.decision || '');
    const purchaseAmount = Number(req.body?.purchase_amount || 0);
    const purchaseName = String(req.body?.purchase_name || 'Unknown Item');

    if ((decision !== 'SKIP' && decision !== 'BUY') || !Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    const nowIso = new Date().toISOString();
    const today = todayIso();

    if (decision === 'SKIP') {
        goal.saved_amount += purchaseAmount;

        if (goal.saved_amount >= goal.target_amount && goal.status !== 'COMPLETED') {
            goal.status = 'COMPLETED';
            goal.current_completion_date = today;
            if (!goal.reward_awarded) {
                const completionCoins = calculateGoalCompletionCoins(goal.target_amount);
                user.coins += completionCoins;
                goal.reward_awarded = true;
                store.notifications.push({
                    id: store.nextId('notifications'),
                    user_id: user.id,
                    title: 'Goal Completed! 🏆',
                    message: `Congratulations! You completed your goal '${goal.name}' (Target: ₹${goal.target_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) and earned ${completionCoins.toLocaleString('en-IN')} Gold Coins!`,
                    type: 'reward',
                    is_read: false,
                    created_at: nowIso,
                });
            }
        } else {
            const autoSaving = store.goalAutoSavings.find(a => a.goal_id === goal.id);
            if (autoSaving) {
                const dailyRate = computeDailyRate(autoSaving);
                if (dailyRate > 0) {
                    const advanceDays = Math.ceil(purchaseAmount / dailyRate);
                    const candidate = addDaysIso(goal.current_completion_date, -advanceDays);
                    goal.current_completion_date = candidate < today ? today : candidate;
                }
            }
        }

        store.goalTransactions.push({
            id: store.nextId('goalTransactions'),
            goal_id: goal.id,
            type: 'CREDIT',
            amount: purchaseAmount,
            description: `Skipped purchase: ${purchaseName}`,
            status: 'SUCCESS',
            source: 'Main Account Balance',
            destination: 'Goal Wallet',
            reason: null,
            remaining_balance: Math.max(0, goal.target_amount - goal.saved_amount),
            current_balance: goal.saved_amount,
            created_at: nowIso,
        });

        user.xp += 50;
        user.lifetime_xp += 50;
        levelUp(user);
    } else {
        const autoSaving = store.goalAutoSavings.find(a => a.goal_id === goal.id);
        if (autoSaving) {
            const dailyRate = computeDailyRate(autoSaving);
            if (dailyRate > 0) {
                const delayDays = Math.ceil(purchaseAmount / dailyRate);
                const prevDate = goal.current_completion_date;
                goal.current_completion_date = addDaysIso(prevDate, delayDays);

                store.goalDelayHistory.push({
                    id: store.nextId('goalDelayHistory'),
                    goal_id: goal.id,
                    purchase_name: purchaseName,
                    purchase_amount: purchaseAmount,
                    delay_days: delayDays,
                    previous_completion_date: prevDate,
                    new_completion_date: goal.current_completion_date,
                    created_at: nowIso,
                });
            }
        }

        store.goalTransactions.push({
            id: store.nextId('goalTransactions'),
            goal_id: goal.id,
            type: 'SPLURGE',
            amount: purchaseAmount,
            description: `Bought: ${purchaseName}`,
            status: 'SUCCESS',
            source: 'Main Account Balance',
            destination: 'External Purchase',
            reason: null,
            remaining_balance: Math.max(0, goal.target_amount - goal.saved_amount),
            current_balance: goal.saved_amount,
            created_at: nowIso,
        });
    }

    res.status(200).json({
        message: 'Decision recorded',
        goal: serializeGoal(goal),
    });
});

router.post('/:goalId/autopay/run', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const goalId = Number(req.params.goalId);
    const goal = store.goals.find(g => g.id === goalId && g.user_id === user.id);
    if (!goal) {
        res.status(404).json({ error: 'Goal not found' });
        return;
    }

    const autoSaving = store.goalAutoSavings.find(a => a.goal_id === goal.id);
    if (!autoSaving) {
        res.status(400).json({ error: 'No auto-saving configured for this goal' });
        return;
    }

    if (goal.status === 'COMPLETED') {
        res.status(400).json({ error: 'Goal is already completed!' });
        return;
    }

    if (goal.status === 'PAUSED') {
        goal.status = 'ACTIVE';
    }

    const { success, message, tx, currentCashFlow } = processGoalAutopay(autoSaving, todayIso());

    if (!success) {
        res.status(400).json({
            error: message,
            message,
            status: 'FAILED',
            available_net_cash_flow: currentCashFlow,
            required_amount: autoSaving.amount,
            goal: serializeGoal(goal),
            transaction: tx,
        });
        return;
    }

    res.status(200).json({
        message,
        status: 'SUCCESS',
        available_net_cash_flow: currentCashFlow,
        goal: serializeGoal(goal),
        transaction: tx,
        current_streak: getActiveStreak(user),
        user: serializeUser(user),
    });
});

export default router;
