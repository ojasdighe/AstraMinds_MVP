import { Router } from 'express';
import { store, todayIso, levelUp } from '../store.js';
import { requireAuth, type AuthenticatedRequest } from '../authMiddleware.js';

const router = Router();

interface SpinReward {
    id: number;
    type: 'LOSS' | 'COINS' | 'XP' | 'SHIELD' | 'AVATAR';
    name: string;
    prob: number;
    value: number | string;
}

const SPIN_REWARDS: SpinReward[] = [
    { id: 1, type: 'LOSS', name: 'Better Luck Next Time', prob: 30, value: 0 },
    { id: 2, type: 'COINS', name: '1 Coin', prob: 25, value: 1 },
    { id: 3, type: 'COINS', name: '10 Coins', prob: 20, value: 10 },
    { id: 4, type: 'COINS', name: '100 Coins', prob: 10, value: 100 },
    { id: 5, type: 'COINS', name: '1,000 Coins', prob: 1, value: 1000 },
    { id: 6, type: 'XP', name: '+100 XP', prob: 8, value: 100 },
    { id: 7, type: 'SHIELD', name: 'Streak Shield', prob: 5, value: 1 },
    { id: 8, type: 'AVATAR', name: 'Legendary Avatar', prob: 1, value: 'ASTRAMINDS_PHANTOM' },
];

function pickWeightedReward(): SpinReward {
    const totalWeight = SPIN_REWARDS.reduce((sum, r) => sum + r.prob, 0);
    let roll = Math.random() * totalWeight;
    for (const r of SPIN_REWARDS) {
        roll -= r.prob;
        if (roll <= 0) return r;
    }
    return SPIN_REWARDS[0];
}

router.get('/spin/status', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const today = todayIso();
    const spin = store.dailySpins.find(s => s.user_id === userId && s.date === today);
    res.status(200).json({ can_spin: !spin });
});

router.post('/spin', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const today = todayIso();

    const existingSpin = store.dailySpins.find(s => s.user_id === user.id && s.date === today);
    if (existingSpin) {
        res.status(400).json({ error: 'You have already used your daily spin today.' });
        return;
    }

    const selected = pickWeightedReward();

    if (selected.type === 'COINS' && typeof selected.value === 'number') {
        user.coins += selected.value;
    } else if (selected.type === 'XP' && typeof selected.value === 'number') {
        user.xp += selected.value;
        user.lifetime_xp += selected.value;
        levelUp(user);
    } else if (selected.type === 'SHIELD' && typeof selected.value === 'number') {
        user.streak_shields += selected.value;
    } else if (selected.type === 'AVATAR' && typeof selected.value === 'string') {
        const avatars = user.unlocked_avatars
            ? user.unlocked_avatars.split(',').filter(Boolean)
            : [];
        if (!avatars.includes(selected.value)) {
            avatars.push(selected.value);
            user.unlocked_avatars = avatars.join(',');
        }
    }

    const nowIso = new Date().toISOString();
    store.dailySpins.push({
        id: store.nextId('dailySpins'),
        user_id: user.id,
        date: today,
        time: nowIso,
        reward: selected.name,
        reward_type: selected.type,
        created_at: nowIso,
    });

    res.status(200).json({
        success: true,
        reward: selected,
    });
});

export default router;
