import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
    store,
    serializeUser,
    type UserRecord,
} from '../store.js';
import {
    requireAuth,
    type AuthenticatedRequest,
    signAccessToken,
} from '../authMiddleware.js';

const router = Router();
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function storeOtp(email: string, purpose: 'register' | 'reset'): string {
    for (const token of store.otpTokens) {
        if (token.email === email && token.purpose === purpose && !token.used) {
            token.used = true;
        }
    }
    const otp = generateOtp();
    const now = new Date();
    const expires = new Date(now.getTime() + 5 * 60 * 1000);
    store.otpTokens.push({
        id: store.nextId('otpTokens'),
        email,
        otp_code: otp,
        purpose,
        expires_at: expires.toISOString(),
        used: false,
        created_at: now.toISOString(),
    });
    return otp;
}

router.post('/send-otp', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Invalid email address.' });
        return;
    }

    const user = store.users.find(u => u.email === email);
    if (user && user.is_verified) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
    }

    const otp = storeOtp(email, 'register');
    res.status(200).json({
        message: 'OTP sent.',
        dev_otp: otp,
    });
});

router.post('/verify-otp', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otpCode = String(req.body?.otp || '').trim();
    const mode = String(req.body?.mode || 'register');
    const purpose: 'register' | 'reset' = mode === 'register' ? 'register' : 'reset';

    const record = store.otpTokens.find(
        t => t.email === email && t.otp_code === otpCode && t.purpose === purpose && !t.used
    );

    if (!record) {
        res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        return;
    }

    if (Date.now() > new Date(record.expires_at).getTime()) {
        record.used = true;
        res.status(400).json({ error: 'OTP has expired.' });
        return;
    }

    record.used = true;
    res.status(200).json({ message: 'OTP verified.' });
});

router.post('/register', (req, res) => {
    const fullName = String(req.body?.full_name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const otp = String(req.body?.otp || '').trim();

    if (!fullName || !EMAIL_REGEX.test(email) || password.length < 6) {
        res.status(400).json({ error: 'Invalid input data.' });
        return;
    }

    const matchingOtps = store.otpTokens
        .filter(t => t.email === email && t.otp_code === otp && t.purpose === 'register' && t.used)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (matchingOtps.length === 0) {
        res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
        return;
    }

    let user = store.users.find(u => u.email === email);
    const pwHash = bcrypt.hashSync(password, 10);

    if (user) {
        if (user.is_verified) {
            res.status(409).json({ error: 'An account with this email already exists.' });
            return;
        }
        user.full_name = fullName;
        user.password_hash = pwHash;
        user.is_verified = true;
    } else {
        const newUser: UserRecord = {
            id: store.nextId('users'),
            full_name: fullName,
            email,
            password_hash: pwHash,
            google_id: null,
            is_verified: true,
            avatar: '/game_avatar.png',
            xp: 0,
            lifetime_xp: 0,
            level: 1,
            coins: 0,
            current_streak: 0,
            last_save_date: null,
            total_saved: 0,
            age: null,
            nickname: null,
            grade: null,
            onboarding_completed: false,
            phone: null,
            city: null,
            streak_shields: 0,
            unlocked_avatars: '',
            created_at: new Date().toISOString(),
        };
        store.users.push(newUser);
        user = newUser;
    }

    const token = signAccessToken(user.id);
    res.status(201).json({ token, user: serializeUser(user) });
});

const DEFAULT_GOOGLE_CLIENT_ID = '959185646078-7s4m1qp4159bief441dkiom9ksci6jb3.apps.googleusercontent.com';

router.get('/config', (_req, res) => {
    const googleClientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim();
    res.status(200).json({ google_client_id: googleClientId });
});

router.post('/google', async (req, res) => {
    const credential = req.body?.credential;
    if (!credential || typeof credential !== 'string') {
        res.status(400).json({ error: 'Missing credential' });
        return;
    }

    const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

    try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (!verifyRes.ok) {
            res.status(401).json({ error: 'Invalid Google token' });
            return;
        }
        const idinfo = (await verifyRes.json()) as { email?: string; name?: string; sub?: string; aud?: string };
        if (configuredClientId && idinfo.aud && idinfo.aud !== configuredClientId) {
            res.status(401).json({ error: 'Invalid Google token audience' });
            return;
        }

        const email = idinfo.email?.toLowerCase();
        const name = idinfo.name;
        const sub = idinfo.sub;

        if (!email || !sub) {
            res.status(400).json({ error: 'Invalid token payload' });
            return;
        }

        const existingByGoogle = store.users.find(u => u.google_id === sub);
        if (existingByGoogle) {
            const accessToken = signAccessToken(existingByGoogle.id);
            res.status(200).json({ token: accessToken, user: serializeUser(existingByGoogle) });
            return;
        }

        const existingByEmail = store.users.find(u => u.email === email);
        if (existingByEmail) {
            res.status(409).json({
                error: 'An account with this email already exists. Please log in with your password.',
            });
            return;
        }

        const newUser: UserRecord = {
            id: store.nextId('users'),
            full_name: name || 'Google User',
            email,
            password_hash: '!GOOGLE_AUTH_NO_PASSWORD!',
            google_id: sub,
            is_verified: true,
            avatar: '/game_avatar.png',
            xp: 0,
            lifetime_xp: 0,
            level: 1,
            coins: 0,
            current_streak: 0,
            last_save_date: null,
            total_saved: 0,
            age: null,
            nickname: null,
            grade: null,
            onboarding_completed: false,
            phone: null,
            city: null,
            streak_shields: 0,
            unlocked_avatars: '',
            created_at: new Date().toISOString(),
        };
        store.users.push(newUser);

        const accessToken = signAccessToken(newUser.id);
        res.status(201).json({ token: accessToken, user: serializeUser(newUser) });
    } catch (err: any) {
        res.status(500).json({ error: `Authentication failed: ${err?.message || 'Unknown error'}` });
    }
});

router.post('/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
    }

    const user = store.users.find(u => u.email === email);
    if (!user) {
        res.status(401).json({ error: 'Incorrect email or password.' });
        return;
    }

    if (user.password_hash === '!GOOGLE_AUTH_NO_PASSWORD!') {
        res.status(401).json({ error: 'Please log in with Google.' });
        return;
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
        res.status(401).json({ error: 'Incorrect email or password.' });
        return;
    }

    if (!user.is_verified) {
        res.status(403).json({ error: 'Please verify your email before logging in.' });
        return;
    }

    const token = signAccessToken(user.id);
    res.status(200).json({ token, user: serializeUser(user) });
});

router.post('/forgot-password', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const user = store.users.find(u => u.email === email);
    if (!user) {
        res.status(200).json({ message: 'If that email is registered, a code has been sent.' });
        return;
    }

    const otp = storeOtp(email, 'reset');
    res.status(200).json({
        message: 'Reset OTP sent to your email.',
        dev_otp: otp,
    });
});

router.post('/reset-password', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otpCode = String(req.body?.otp || '').trim();
    const newPassword = String(req.body?.new_password || '');

    if (newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
    }

    const records = store.otpTokens
        .filter(t => t.email === email && t.otp_code === otpCode && t.purpose === 'reset')
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

    const record = records[0];
    if (!record) {
        res.status(400).json({ error: 'Invalid or expired reset code.' });
        return;
    }

    if (Date.now() > new Date(record.expires_at).getTime()) {
        res.status(400).json({ error: 'Reset code has expired.' });
        return;
    }

    const user = store.users.find(u => u.email === email);
    if (!user) {
        res.status(404).json({ error: 'Account not found.' });
        return;
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    res.status(200).json({ message: 'Password updated successfully.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.status(200).json(serializeUser(req.currentUser!));
});

router.put('/update-profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const data = req.body || {};

    if (typeof data.full_name === 'string' && data.full_name.trim()) {
        user.full_name = data.full_name.trim();
    }
    if ('age' in data) {
        const parsedAge = Number(data.age);
        user.age = data.age && Number.isFinite(parsedAge) ? Math.trunc(parsedAge) : null;
    }
    if ('phone' in data) {
        const p = String(data.phone || '').trim();
        user.phone = p || null;
    }
    if ('city' in data) {
        const c = String(data.city || '').trim();
        user.city = c || null;
    }
    if ('avatar' in data && typeof data.avatar === 'string') {
        user.avatar = data.avatar.trim();
    }

    res.status(200).json({ message: 'Profile updated.', user: serializeUser(user) });
});

router.put('/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const currentPassword = String(req.body?.current_password || '');
    const newPassword = String(req.body?.new_password || '');

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
    }

    if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters.' });
        return;
    }

    user.password_hash = bcrypt.hashSync(newPassword, 10);
    res.status(200).json({ message: 'Password changed successfully.' });
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

router.delete('/delete-account', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const password = String(req.body?.password || '');

    if (user.password_hash !== '!GOOGLE_AUTH_NO_PASSWORD!') {
        if (!bcrypt.compareSync(password, user.password_hash)) {
            res.status(401).json({ error: 'Incorrect password.' });
            return;
        }
    }

    const userId = user.id;
    const userEmail = user.email;
    const goalIds = new Set(store.goals.filter(g => g.user_id === userId).map(g => g.id));

    store.goalAutoSavings = store.goalAutoSavings.filter(a => !goalIds.has(a.goal_id));
    store.goalTransactions = store.goalTransactions.filter(t => !goalIds.has(t.goal_id));
    store.goalDelayHistory = store.goalDelayHistory.filter(d => !goalIds.has(d.goal_id));
    store.goals = store.goals.filter(g => g.user_id !== userId);
    store.dailySpins = store.dailySpins.filter(s => s.user_id !== userId);
    store.quizAttempts = store.quizAttempts.filter(q => q.user_id !== userId);
    store.notifications = store.notifications.filter(n => n.user_id !== userId);

    store.trackerTransactions = store.trackerTransactions.filter(t => t.user_id !== userId);
    store.billUploads = store.billUploads.filter(b => b.user_id !== userId);
    store.trackerCategories = store.trackerCategories.filter(c => c.user_id !== userId);
    store.trackerSubscriptions = store.trackerSubscriptions.filter(s => s.user_id !== userId);
    store.categoryBudgets = store.categoryBudgets.filter(b => b.user_id !== userId);

    for (const exp of store.splitExpenses) {
        exp.payers = exp.payers.filter(p => p.user_id !== userId);
        exp.shares = exp.shares.filter(s => s.user_id !== userId);
    }
    store.splitSettlementPayments = store.splitSettlementPayments.filter(
        p => p.payer_id !== userId && p.recipient_id !== userId
    );
    store.splitMembers = store.splitMembers.filter(m => m.user_id !== userId);
    store.splitActivities = store.splitActivities.filter(a => a.user_id !== userId);
    store.otpTokens = store.otpTokens.filter(t => t.email !== userEmail);
    store.users = store.users.filter(u => u.id !== userId);

    res.status(200).json({ message: 'Account and all associated data permanently deleted.' });
});

export default router;
