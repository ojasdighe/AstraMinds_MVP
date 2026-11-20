import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { loadStateFromFirestore, saveStateToFirestore, isFirestoreConfigured } from './firestore.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'astraminds_store.json');

export interface UserRecord {
    id: number;
    full_name: string;
    email: string;
    password_hash: string;
    google_id: string | null;
    is_verified: boolean;
    avatar: string;
    xp: number;
    lifetime_xp: number;
    level: number;
    coins: number;
    current_streak: number;
    last_save_date: string | null;
    total_saved: number;
    age: number | null;
    nickname: string | null;
    grade: string | null;
    onboarding_completed: boolean;
    phone: string | null;
    city: string | null;
    streak_shields: number;
    unlocked_avatars: string;
    created_at: string;
}

export interface OtpTokenRecord {
    id: number;
    email: string;
    otp_code: string;
    purpose: 'register' | 'reset';
    expires_at: string;
    used: boolean;
    created_at: string;
}

export interface DailySpinRecord {
    id: number;
    user_id: number;
    date: string;
    time: string;
    reward: string;
    reward_type: string;
    created_at: string;
}

export type QuizType = 'money' | 'safety';

export interface QuizQuestionRecord {
    id: number;
    quiz_type: QuizType;
    topic: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: 'a' | 'b' | 'c' | 'd';
    coin_reward: number;
    explanation: string | null;
}

export interface QuizAttemptRecord {
    id: number;
    user_id: number;
    quiz_type: QuizType;
    score: number;
    coins_earned: number;
    attempt_date: string;
    created_at: string;
}

export interface NotificationRecord {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export interface GoalRecord {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    target_amount: number;
    saved_amount: number;
    target_date: string;
    icon: string | null;
    status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
    reward_awarded: boolean;
    original_completion_date: string;
    current_completion_date: string;
    created_at: string;
}

export interface GoalAutoSavingRecord {
    id: number;
    goal_id: number;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    custom_days: number | null;
    amount: number;
    next_run_date: string | null;
    created_at: string;
}

export interface GoalTransactionRecord {
    id: number;
    goal_id: number;
    type: string;
    amount: number;
    description: string | null;
    status: string;
    source: string;
    destination: string;
    reason: string | null;
    remaining_balance: number | null;
    current_balance: number | null;
    created_at: string;
}

export interface GoalDelayHistoryRecord {
    id: number;
    goal_id: number;
    purchase_name: string;
    purchase_amount: number;
    delay_days: number;
    previous_completion_date: string;
    new_completion_date: string;
    created_at: string;
}

export interface TrackerCategoryRecord {
    id: number;
    user_id: number | null;
    name: string;
    icon: string;
    color: string;
    type: 'EXPENSE' | 'INCOME' | 'BOTH';
    is_system: boolean;
    created_at: string;
}

export interface BillUploadRecord {
    id: number;
    user_id: number;
    original_filename: string;
    stored_filename: string;
    file_size: number;
    mime_type: string;
    file_hash: string;
    file_buffer: Buffer;
    status: string;
    extracted_data: string | null;
    created_at: string;
}

export interface TrackerTransactionRecord {
    id: number;
    user_id: number;
    type: 'EXPENSE' | 'INCOME';
    amount: number;
    currency: string;
    category_name: string;
    merchant: string;
    transaction_date: string;
    payment_method: string;
    description: string;
    tags: string;
    receipt_filename: string | null;
    bill_upload_id: number | null;
    is_subscription: boolean;
    created_at: string;
    updated_at: string;
}

export interface TrackerSubscriptionRecord {
    id: number;
    user_id: number;
    name: string;
    category_name: string;
    amount: number;
    currency: string;
    billing_cycle: 'MONTHLY' | 'YEARLY' | 'QUARTERLY' | 'WEEKLY';
    next_renewal_date: string | null;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
    notes: string;
    created_at: string;
}

export interface CategoryBudgetRecord {
    id: number;
    user_id: number;
    category_name: string;
    month: string;
    budget_amount: number;
    created_at: string;
}

export interface SplitRoomRecord {
    id: number;
    code: string;
    name: string;
    description: string | null;
    currency: string;
    icon: string;
    start_date: string | null;
    end_date: string | null;
    created_by: number | null;
    is_settled: boolean;
    created_at: string;
    updated_at: string;
}

export interface SplitMemberRecord {
    id: number;
    room_id: number;
    user_id: number;
    role: 'owner' | 'member';
    joined_at: string;
}

export interface SplitExpensePayerRecord {
    id: number;
    expense_id: number;
    user_id: number;
    amount_paid: number;
}

export interface SplitExpenseShareRecord {
    id: number;
    expense_id: number;
    user_id: number;
    share_amount: number;
    raw_value: number | null;
}

export interface SplitExpenseRecord {
    id: number;
    room_id: number;
    created_by: number | null;
    title: string;
    amount: number;
    category: string;
    expense_date: string;
    notes: string | null;
    split_method: string;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    payers: SplitExpensePayerRecord[];
    shares: SplitExpenseShareRecord[];
}

export interface SplitSettlementPaymentRecord {
    id: number;
    room_id: number;
    payer_id: number;
    recipient_id: number;
    created_by: number;
    amount: number;
    status: 'REPORTED' | 'CONFIRMED' | 'DISPUTED';
    notes: string | null;
    created_at: string;
    confirmed_at: string | null;
}

export interface SplitActivityRecord {
    id: number;
    room_id: number;
    user_id: number | null;
    activity_type: string;
    description: string;
    metadata_json: string | null;
    created_at: string;
}

export interface BudgetEvaluationFeedback {
    verdict: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
    made_right_choice: boolean;
    needs_vs_wants_score: number;
    headline: string;
    what_went_well: string;
    how_to_manage_better: string;
}

export interface DynamicBudgetItemRecord {
    id: string;
    name: string;
    cost: number;
    type: 'NEED' | 'WANT';
    hint: string;
}

export interface DynamicBudgetScenarioRecord {
    id: number;
    title: string;
    category: string;
    emoji: string;
    starting_budget: number;
    purpose: string;
    sudden_expense: {
        title: string;
        cost: number;
        description: string;
        is_essential: boolean;
    };
    items: DynamicBudgetItemRecord[];
    ideal_tip: string;
    is_ai_generated: boolean;
    date_key: string;
}

export interface DailyBudgetAssignmentRecord {
    user_id: number;
    date: string;
    scenario_id: number;
}

export interface BudgetChallengeAttemptRecord {
    id: number;
    user_id: number;
    scenario_id: number;
    date: string;
    is_daily: boolean;
    selected_item_ids: string[];
    included_sudden_expense: boolean;
    total_spent: number;
    money_saved: number;
    coins_earned: number;
    xp_earned: number;
    reasoning: string;
    feedback: BudgetEvaluationFeedback;
    created_at: string;
}

export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

export function daysBetweenIso(laterIso: string, earlierIso: string): number {
    const d1 = new Date(`${laterIso}T00:00:00.000Z`).getTime();
    const d2 = new Date(`${earlierIso}T00:00:00.000Z`).getTime();
    return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
}

export function getIsoWeekKey(d: Date = new Date()): string {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function xpForLevel(level: number): number {
    return 1000 + (level - 1) * 500;
}

export function totalXpForLevel(level: number): number {
    const n = level - 1;
    if (n <= 0) return 0;
    return Math.floor((n * (2000 + (n - 1) * 500)) / 2);
}

export function coinsForLevelUp(level: number): number {
    const tier = Math.max(0, Math.floor((level - 1) / 10));
    return 25 + tier * 25;
}

export function calculateGoalCompletionCoins(targetAmount: number): number {
    const target = Number(targetAmount || 0);
    if (target < 1000) return 25;
    if (target < 2500) return 50;
    if (target < 5000) return 100;
    if (target < 10000) return 200;
    if (target < 25000) return 500;
    if (target < 50000) return 1000;
    if (target < 100000) return 2000;
    if (target < 250000) return 5000;
    if (target < 500000) return 10000;
    return 20000;
}

class MemoryStore {
    private seq: Record<string, number> = {};
    private saveTimer: NodeJS.Timeout | null = null;

    nextId(key: string): number {
        if (this.seq[key] === undefined) {
            let maxId = 0;
            if (key === 'users' && this.users.length) maxId = Math.max(...this.users.map(u => u.id));
            else if (key === 'goals' && this.goals.length) maxId = Math.max(...this.goals.map(g => g.id));
            else if (key === 'trackerTransactions' && this.trackerTransactions.length) maxId = Math.max(...this.trackerTransactions.map(t => t.id));
            else if (key === 'trackerCategories' && this.trackerCategories.length) maxId = Math.max(...this.trackerCategories.map(c => c.id));
            else if (key === 'notifications' && this.notifications.length) maxId = Math.max(...this.notifications.map(n => n.id));
            else if (key === 'goalTransactions' && this.goalTransactions.length) maxId = Math.max(...this.goalTransactions.map(t => t.id));
            else if (key === 'quizAttempts' && this.quizAttempts.length) maxId = Math.max(...this.quizAttempts.map(q => q.id));
            this.seq[key] = maxId;
        }
        this.seq[key] = (this.seq[key] || 0) + 1;
        this.scheduleSave(300);
        return this.seq[key];
    }

    users: UserRecord[] = [];
    otpTokens: OtpTokenRecord[] = [];
    dailySpins: DailySpinRecord[] = [];
    quizQuestions: QuizQuestionRecord[] = [];
    quizAttempts: QuizAttemptRecord[] = [];
    globalState: Map<string, string> = new Map();
    notifications: NotificationRecord[] = [];
    goals: GoalRecord[] = [];
    goalAutoSavings: GoalAutoSavingRecord[] = [];
    goalTransactions: GoalTransactionRecord[] = [];
    goalDelayHistory: GoalDelayHistoryRecord[] = [];
    trackerCategories: TrackerCategoryRecord[] = [];
    billUploads: BillUploadRecord[] = [];
    trackerTransactions: TrackerTransactionRecord[] = [];
    trackerSubscriptions: TrackerSubscriptionRecord[] = [];
    categoryBudgets: CategoryBudgetRecord[] = [];
    splitRooms: SplitRoomRecord[] = [];
    splitMembers: SplitMemberRecord[] = [];
    splitExpenses: SplitExpenseRecord[] = [];
    splitSettlementPayments: SplitSettlementPaymentRecord[] = [];
    splitActivities: SplitActivityRecord[] = [];
    dailyBudgetAssignments: DailyBudgetAssignmentRecord[] = [];
    budgetChallengeAttempts: BudgetChallengeAttemptRecord[] = [];
    dynamicBudgetScenarios: DynamicBudgetScenarioRecord[] = [];
    dailyBudgetScenarioByDate: Map<string, number> = new Map();

    constructor() {
        const loaded = this.loadFromFile();
        if (!loaded) {
            this.seedInitialData();
            this.saveToFileSync(false);
        }
        this.setupAutoSave();
    }

    async initPersistence() {
        if (isFirestoreConfigured()) {
            console.log('[Store] Initializing Cloud Firestore persistence...');
            const cloudData = await loadStateFromFirestore();
            if (cloudData && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
                this.applySerializedPayload(cloudData);
                this.saveToFileSync(false);
                console.log(`[Store] Synced from Cloud Firestore: ${this.users.length} users, ${this.trackerTransactions.length} transactions, ${this.goals.length} goals.`);
            } else {
                console.log('[Store] Seeding initial state to Cloud Firestore...');
                await this.syncToFirestore();
            }
        }
    }

    getSerializedPayload() {
        return {
            version: 1,
            savedAt: new Date().toISOString(),
            seq: this.seq,
            users: this.users,
            otpTokens: this.otpTokens,
            dailySpins: this.dailySpins,
            quizQuestions: this.quizQuestions,
            quizAttempts: this.quizAttempts,
            globalState: Array.from(this.globalState.entries()),
            notifications: this.notifications,
            goals: this.goals,
            goalAutoSavings: this.goalAutoSavings,
            goalTransactions: this.goalTransactions,
            goalDelayHistory: this.goalDelayHistory,
            trackerCategories: this.trackerCategories,
            billUploads: this.billUploads.map(b => ({
                ...b,
                file_buffer: undefined,
            })),
            trackerTransactions: this.trackerTransactions,
            trackerSubscriptions: this.trackerSubscriptions,
            categoryBudgets: this.categoryBudgets,
            splitRooms: this.splitRooms,
            splitMembers: this.splitMembers,
            splitExpenses: this.splitExpenses,
            splitSettlementPayments: this.splitSettlementPayments,
            splitActivities: this.splitActivities,
            dailyBudgetAssignments: this.dailyBudgetAssignments,
            budgetChallengeAttempts: this.budgetChallengeAttempts,
            dynamicBudgetScenarios: this.dynamicBudgetScenarios,
            dailyBudgetScenarioByDate: Array.from(this.dailyBudgetScenarioByDate.entries()),
        };
    }

    applySerializedPayload(data: any): boolean {
        if (!data || !Array.isArray(data.users)) {
            return false;
        }
        this.seq = data.seq || {};
        this.users = data.users || [];
        this.otpTokens = data.otpTokens || [];
        this.dailySpins = data.dailySpins || [];
        this.quizQuestions = data.quizQuestions || [];
        this.quizAttempts = data.quizAttempts || [];
        this.globalState = new Map(data.globalState || []);
        this.notifications = data.notifications || [];
        this.goals = data.goals || [];
        this.goalAutoSavings = data.goalAutoSavings || [];
        this.goalTransactions = data.goalTransactions || [];
        this.goalDelayHistory = data.goalDelayHistory || [];
        this.trackerCategories = data.trackerCategories || [];
        this.billUploads = data.billUploads || [];
        this.trackerTransactions = data.trackerTransactions || [];
        this.trackerSubscriptions = data.trackerSubscriptions || [];
        this.categoryBudgets = data.categoryBudgets || [];
        this.splitRooms = data.splitRooms || [];
        this.splitMembers = data.splitMembers || [];
        this.splitExpenses = data.splitExpenses || [];
        this.splitSettlementPayments = data.splitSettlementPayments || [];
        this.splitActivities = data.splitActivities || [];
        this.dailyBudgetAssignments = data.dailyBudgetAssignments || [];
        this.budgetChallengeAttempts = data.budgetChallengeAttempts || [];
        this.dynamicBudgetScenarios = data.dynamicBudgetScenarios || [];
        this.dailyBudgetScenarioByDate = new Map(data.dailyBudgetScenarioByDate || []);
        return true;
    }

    save() {
        this.scheduleSave(50);
    }

    scheduleSave(delayMs = 300) {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            this.saveToFileSync(true);
        }, delayMs);
    }

    async syncToFirestore() {
        try {
            const payload = this.getSerializedPayload();
            await saveStateToFirestore(payload);
        } catch (err) {
            console.error('[Store] Error syncing to Firestore:', err);
        }
    }

    saveToFileSync(triggerCloud = true) {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            const tmpFile = `${STORE_FILE}.tmp`;
            const payload = this.getSerializedPayload();
            fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf-8');
            fs.renameSync(tmpFile, STORE_FILE);

            if (triggerCloud && isFirestoreConfigured()) {
                this.syncToFirestore();
            }
        } catch (err) {
            console.error('[Store] Failed to save store to file:', err);
        }
    }

    loadFromFile(): boolean {
        try {
            if (!fs.existsSync(STORE_FILE)) {
                return false;
            }
            const raw = fs.readFileSync(STORE_FILE, 'utf-8');
            const data = JSON.parse(raw);
            const applied = this.applySerializedPayload(data);
            if (applied) {
                console.log(`[Store] Loaded persistent data from ${STORE_FILE} (${this.users.length} users, ${this.trackerTransactions.length} transactions, ${this.goals.length} goals)`);
            }
            return applied;
        } catch (err) {
            console.error('[Store] Failed to load store from file:', err);
            return false;
        }
    }

    private setupAutoSave() {
        const timer = setInterval(() => {
            this.saveToFileSync();
        }, 3000);
        if (timer.unref) {
            timer.unref();
        }

        const handleExit = () => {
            try {
                this.saveToFileSync();
            } catch (_) {}
        };
        process.once('beforeExit', handleExit);
        process.once('SIGINT', () => {
            handleExit();
            process.exit(0);
        });
        process.once('SIGTERM', () => {
            handleExit();
            process.exit(0);
        });
    }

    private seedInitialData() {
        this.globalState.set('current_season_week', getIsoWeekKey());
        this.globalState.set('current_season_number', '1');

        const systemCats: Array<{ name: string; icon: string; color: string; type: 'EXPENSE' | 'INCOME' | 'BOTH' }> = [
            { name: 'Snacks & Treats', icon: 'Utensils', color: '#f97316', type: 'EXPENSE' },
            { name: 'Books & Comics', icon: 'BookOpen', color: '#6366f1', type: 'EXPENSE' },
            { name: 'Games & Apps', icon: 'Gamepad2', color: '#a855f7', type: 'EXPENSE' },
            { name: 'Toys & Hobbies', icon: 'Sparkles', color: '#ec4899', type: 'EXPENSE' },
            { name: 'Sports & Clubs', icon: 'Trophy', color: '#22c55e', type: 'EXPENSE' },
            { name: 'School Supplies', icon: 'Pencil', color: '#06b6d4', type: 'EXPENSE' },
            { name: 'Gifts & Sharing', icon: 'Gift', color: '#f43f5e', type: 'EXPENSE' },
            { name: 'Savings', icon: 'PiggyBank', color: '#34d399', type: 'EXPENSE' },
            { name: 'Pocket Money', icon: 'Wallet', color: '#10b981', type: 'INCOME' },
            { name: 'Chore Rewards', icon: 'CheckCircle', color: '#14b8a6', type: 'INCOME' },
            { name: 'Gift Money', icon: 'Gift', color: '#eab308', type: 'INCOME' },
            { name: 'Other', icon: 'Tag', color: '#94a3b8', type: 'BOTH' },
        ];

        const nowIso = new Date().toISOString();
        for (const c of systemCats) {
            this.trackerCategories.push({
                id: this.nextId('trackerCategories'),
                user_id: null,
                name: c.name,
                icon: c.icon,
                color: c.color,
                type: c.type,
                is_system: true,
                created_at: nowIso,
            });
        }

        this.seedQuizQuestions();
        this.seedDemoCommunity();
    }

    seedQuizQuestions() {
        const moneyQuestions: Array<Omit<QuizQuestionRecord, 'id' | 'coin_reward' | 'quiz_type'>> = [
            {
                topic: 'Saving',
                question: 'You get ₹200 pocket money every week and want a ₹1,000 skateboard. If you save ₹100 each week, how many weeks will it take?',
                option_a: '5 weeks',
                option_b: '8 weeks',
                option_c: '10 weeks',
                option_d: '20 weeks',
                correct_answer: 'c',
                explanation: '₹1,000 divided by ₹100 per week equals 10 weeks of steady saving!',
            },
            {
                topic: 'Saving',
                question: 'What is the "Save First" rule when you get birthday money or allowance?',
                option_a: 'Spend everything first and save leftovers',
                option_b: 'Put a piece into your savings jar before buying treats',
                option_c: 'Hide your money under your pillow forever',
                option_d: 'Spend it all in one day',
                correct_answer: 'b',
                explanation: 'Setting aside your savings first makes sure you always move closer to your big goals!',
            },
            {
                topic: 'Saving',
                question: 'Why is a "Rainy Day Jar" helpful for kids and teens?',
                option_a: 'It only holds money when it rains outside',
                option_b: 'It helps cover surprises like a broken school bag or flat bike tire',
                option_c: 'It turns coins into candy',
                option_d: 'It stops you from ever buying snacks',
                correct_answer: 'b',
                explanation: 'A rainy day jar keeps extra money ready for unexpected surprises without ruining your main goal.',
            },
            {
                topic: 'Needs vs Wants',
                question: 'Which one is a NEED rather than a WANT?',
                option_a: 'A limited-edition video game skin',
                option_b: 'School notebooks and a warm winter jacket',
                option_c: 'A giant tub of cotton candy',
                option_d: 'Sticker packs for your skateboard',
                correct_answer: 'b',
                explanation: 'Needs are essentials like school supplies, healthy food, and clothes. Wants are fun extras!',
            },
            {
                topic: 'Needs vs Wants',
                question: 'You spot a cool ₹400 toy on sale, but you are saving for a ₹2,000 bicycle. What is the smartest move?',
                option_a: 'Buy the toy immediately before thinking',
                option_b: 'Use the 24-hour wait rule to decide if you really want it',
                option_c: 'Borrow money from five friends',
                option_d: 'Empty your whole bicycle jar',
                correct_answer: 'b',
                explanation: 'Waiting 24 hours stops impulse buying so you only spend on things you truly care about.',
            },
            {
                topic: 'Needs vs Wants',
                question: 'What does "opportunity cost" mean when you spend ₹300 on arcade tokens?',
                option_a: 'The arcade gives you free tokens later',
                option_b: 'You give up using that same ₹300 toward another goal, like a new book or game',
                option_c: 'The tokens double in value overnight',
                option_d: 'You get a discount at school',
                correct_answer: 'b',
                explanation: 'Every rupee you spend on one thing is a rupee you cannot spend on something else!',
            },
            {
                topic: 'Pocket Money',
                question: 'Why is tracking your pocket money in a notebook or app helpful?',
                option_a: 'It makes money disappear faster',
                option_b: 'It shows where small daily snacks or games add up over a month',
                option_c: 'It is only useful for grown-ups at work',
                option_d: 'It stops you from earning chores money',
                correct_answer: 'b',
                explanation: 'Seeing where your money goes helps you catch tiny spending leaks and reach your goals sooner.',
            },
            {
                topic: 'Pocket Money',
                question: 'If you spend ₹25 on extra snacks every school day for 20 days, how much did that cost in total?',
                option_a: '₹100',
                option_b: '₹250',
                option_c: '₹500',
                option_d: '₹1,000',
                correct_answer: 'c',
                explanation: '₹25 × 20 days = ₹500! Small daily purchases add up faster than most people think.',
            },
            {
                topic: 'Pocket Money',
                question: 'Which habit makes reaching a ₹3,000 goal feel easiest?',
                option_a: 'Breaking it into smaller weekly milestones like ₹250 a week',
                option_b: 'Hoping you find ₹3,000 on the sidewalk',
                option_c: 'Checking the price once and never saving',
                option_d: 'Buying small toys every afternoon',
                correct_answer: 'a',
                explanation: 'Small, steady milestones turn a big goal into easy, bite-sized steps!',
            },
            {
                topic: 'Smart Shopping',
                question: 'Store A sells a 4-pack of gel pens for ₹80. Store B sells the same pen for ₹25 each. Which is the better deal for 4 pens?',
                option_a: 'Store B (₹25 each = ₹100)',
                option_b: 'Store A (₹80 for 4 = ₹20 each)',
                option_c: 'Both cost the exact same',
                option_d: 'Neither is a deal',
                correct_answer: 'b',
                explanation: 'Checking the price per item helps you save ₹20 at Store A for the exact same pens!',
            },
            {
                topic: 'Smart Shopping',
                question: 'When you see "50% OFF!" on something you did not plan to buy, did you save money by buying it?',
                option_a: 'Yes, you always make money on sales',
                option_b: 'No, you still spent money you had not planned to spend',
                option_c: 'Yes, if it is bright neon',
                option_d: 'Only if you buy two of them',
                correct_answer: 'b',
                explanation: 'A discount only saves you money on something you already needed and planned to buy!',
            },
            {
                topic: 'Smart Shopping',
                question: 'Before buying a board game or headphones, what is a smart check to do with a parent?',
                option_a: 'Buy the very first ad you see online',
                option_b: 'Compare prices, read honest reviews, and check if you really need it',
                option_c: 'Pay extra for mystery shipping',
                option_d: 'Click pop-up coupons from strangers',
                correct_answer: 'b',
                explanation: 'Comparing quality and prices helps you get something that lasts and avoids wasted pocket money.',
            },
            {
                topic: 'Earning',
                question: 'Which is a great, kid-safe way to earn extra money for a big goal?',
                option_a: 'Helping with extra family chores, washing the car, or selling old books with parent permission',
                option_b: 'Clicking "win free cash" links on random websites',
                option_c: 'Giving your parent’s card number to a game chat',
                option_d: 'Skipping lunch at school',
                correct_answer: 'a',
                explanation: 'Earning through helpful tasks or selling outgrown items (with parent permission) builds pride and savings!',
            },
            {
                topic: 'Earning',
                question: 'What is "interest" in a kid-friendly bank savings account?',
                option_a: 'A fee the bank charges you for saving',
                option_b: 'Small bonus money the bank adds to reward you for keeping money saved',
                option_c: 'A fine for breaking a piggy bank',
                option_d: 'A tax on birthday gifts',
                correct_answer: 'b',
                explanation: 'Banks pay you a little extra percentage called interest as a thank-you for keeping your money in savings!',
            },
            {
                topic: 'Earning',
                question: 'If a bank pays 5% simple interest per year on ₹1,000 in your savings account, how much bonus interest do you earn in 1 year?',
                option_a: '₹5',
                option_b: '₹50',
                option_c: '₹500',
                option_d: '₹100',
                correct_answer: 'b',
                explanation: '5% of ₹1,000 is ₹50 — your saved money earned ₹50 on its own while sitting safely!',
            },
        ];

        const safetyQuestions: Array<Omit<QuizQuestionRecord, 'id' | 'coin_reward' | 'quiz_type'>> = [
            {
                topic: 'OTP & PIN Safety',
                question: 'An online stranger messages you: "Send me the 6-digit OTP on your parent\'s phone to claim your free prize!" What should you do?',
                option_a: 'Read them the OTP quickly before it expires',
                option_b: 'Never share the OTP and tell a parent or guardian right away',
                option_c: 'Send half of the digits first',
                option_d: 'Reply with your home address instead',
                correct_answer: 'b',
                explanation: 'OTPs (One-Time Passwords) are secret keys to bank accounts. No real prize ever needs your OTP!',
            },
            {
                topic: 'OTP & PIN Safety',
                question: 'Who is allowed to know a bank card PIN or digital wallet password?',
                option_a: 'Your online gaming teammate',
                option_b: 'Customer support callers asking for it',
                option_c: 'Only the account owner (your parents/trusted guardian)',
                option_d: 'Everyone in your class group chat',
                correct_answer: 'c',
                explanation: 'Even real bank employees will NEVER ask for your PIN, password, or OTP.',
            },
            {
                topic: 'OTP & PIN Safety',
                question: 'Your friend wants to buy game coins and asks for a photo of the front and back of your parent\'s debit card. What should you do?',
                option_a: 'Say NO and never take or share photos of bank cards',
                option_b: 'Cover just the expiry date and send it',
                option_c: 'Take the photo and delete it after 5 minutes',
                option_d: 'Send only the 3-digit CVV number on the back',
                correct_answer: 'a',
                explanation: 'Card numbers and the 3-digit CVV let anyone spend money online. Never photograph or share payment cards!',
            },
            {
                topic: 'Scam Spotting',
                question: 'A pop-up in a game says: "FREE 10,000 GEMS! Click this link and log in now!" What is this most likely?',
                option_a: 'A gift from the game creators inside the official app store',
                option_b: 'A phishing scam trying to steal your account or trick you into spending money',
                option_c: 'A homework reward',
                option_d: 'A safe shortcut to level 100',
                correct_answer: 'b',
                explanation: '"Too-good-to-be-true" free gems or Robux links are classic phishing traps used to steal accounts!',
            },
            {
                topic: 'Scam Spotting',
                question: 'Someone says: "Pay me ₹100 first so I can unlock and send you ₹5,000 prize money." This is an example of:',
                option_a: 'An advance-fee scam — real prizes never make you pay first',
                option_b: 'Smart investing',
                option_c: 'A normal bank rule',
                option_d: 'Fair pocket money trading',
                correct_answer: 'a',
                explanation: 'If you have to pay money to win a "free" prize, it is 100% a scam!',
            },
            {
                topic: 'Scam Spotting',
                question: 'How can you tell if a website link is trying to trick you (a fake lookalike site)?',
                option_a: 'It has bright rainbow colors',
                option_b: 'The web address has weird misspellings like "g00gle-prize.xyz" instead of the real site',
                option_c: 'It loads on a Tuesday',
                option_d: 'It uses small fonts',
                correct_answer: 'b',
                explanation: 'Scammers often swap letters or add strange endings to web addresses. Always check the real URL with an adult!',
            },
            {
                topic: 'In-Game Purchases',
                question: 'Why can "1-Tap Buy" buttons inside mobile games be risky?',
                option_a: 'They make your phone battery explode',
                option_b: 'You can accidentally spend real parent money without realizing it',
                option_c: 'They delete your high score',
                option_d: 'They only work on school Wi-Fi',
                correct_answer: 'b',
                explanation: 'In-game coins and skins often cost real money. Always ask a parent and turn on purchase password locks!',
            },
            {
                topic: 'In-Game Purchases',
                question: 'What does a "free trial" subscription in an app usually do after 7 days if you don\'t cancel it?',
                option_a: 'It stays free forever',
                option_b: 'It automatically starts charging real money every month',
                option_c: 'It sends you bonus coins',
                option_d: 'It uninstalls the app automatically',
                correct_answer: 'b',
                explanation: 'Free trials often turn into paid monthly bills automatically. Never start one without parent permission!',
            },
            {
                topic: 'In-Game Purchases',
                question: 'A stranger in a game chat offers to "double your game items" if you trade your best item first. What should you do?',
                option_a: 'Trade right away because they promised',
                option_b: 'Refuse — "item doubling" in games is a well-known scam',
                option_c: 'Give them your login password so they can add items',
                option_d: 'Send them gift card codes',
                correct_answer: 'b',
                explanation: 'Trust-trade scams steal items and disappear. Only trade using official, safe in-game systems—never trust strangers!',
            },
            {
                topic: 'Parent Approval',
                question: 'Before downloading a new money or shopping app or clicking "Buy", what is the Golden Rule for ages 8–14?',
                option_a: 'Check with a parent or trusted guardian first',
                option_b: 'Ask a random player in chat',
                option_c: 'Close your eyes and tap Accept',
                option_d: 'Guess your parent\'s password',
                correct_answer: 'a',
                explanation: 'Asking a parent or trusted adult keeps your money, device, and personal info safe!',
            },
            {
                topic: 'Parent Approval',
                question: 'If you accidentally clicked a suspicious link or bought something in a game by mistake, what should you do?',
                option_a: 'Hide the phone and stay quiet',
                option_b: 'Tell a parent or guardian immediately so they can protect the account',
                option_c: 'Click the link five more times to undo it',
                option_d: 'Share your password with the website to cancel',
                correct_answer: 'b',
                explanation: 'Telling a parent quickly lets them change passwords, block cards, or request a refund right away!',
            },
            {
                topic: 'Parent Approval',
                question: 'Why should you avoid scanning random QR codes stuck on walls or sent by strangers in DMs?',
                option_a: 'QR codes are only for restaurants',
                option_b: 'Fake QR codes can open phishing pages or trigger unauthorized payment requests',
                option_c: 'QR codes erase your contacts',
                option_d: 'QR codes slow down Wi-Fi',
                correct_answer: 'b',
                explanation: 'Only scan QR codes from trusted places with a parent present, and always check the website or payment screen carefully!',
            },
            {
                topic: 'Password Safety',
                question: 'Which of these is the strongest, safest password for your AstraMinds or school account?',
                option_a: '123456',
                option_b: 'password',
                option_c: 'Blue!Tiger#Reads42',
                option_d: 'yourfirstnames2014',
                correct_answer: 'c',
                explanation: 'Long passphrases mixing uppercase, lowercase, numbers, and symbols are hardest for hackers to guess!',
            },
            {
                topic: 'Password Safety',
                question: 'Why should you NEVER use the same password for games, email, and money apps?',
                option_a: 'It takes up extra phone storage',
                option_b: 'If hackers leak one game password, they could break into your important accounts too',
                option_c: 'Apps refuse to open on weekends',
                option_d: 'Passwords expire every hour',
                correct_answer: 'b',
                explanation: 'Unique passwords for every account ensure one leak cannot unlock everything else!',
            },
            {
                topic: 'Password Safety',
                question: 'What is Two-Factor Authentication (2FA)?',
                option_a: 'Typing your password twice in the same box',
                option_b: 'An extra security lock—like a secret code or parent approval—in addition to your password',
                option_c: 'Sharing your account with two friends',
                option_d: 'Logging in on public mall Wi-Fi without a password',
                correct_answer: 'b',
                explanation: '2FA adds a second lock so even if someone guesses your password, they still cannot get inside!',
            },
        ];

        for (const q of moneyQuestions) {
            this.quizQuestions.push({
                id: this.nextId('quizQuestions'),
                quiz_type: 'money',
                ...q,
                coin_reward: 20,
            });
        }
        for (const q of safetyQuestions) {
            this.quizQuestions.push({
                id: this.nextId('quizQuestions'),
                quiz_type: 'safety',
                ...q,
                coin_reward: 20,
            });
        }
    }

    private seedDemoCommunity() {
        const now = new Date().toISOString();
        const today = todayIso();
        const demoPwHash = bcrypt.hashSync('AstraMinds@123', 8);

        const demoUsers: Array<Omit<UserRecord, 'id' | 'created_at'>> = [
            {
                full_name: 'Aarav Mehta',
                email: 'demo@AstraMinds.app',
                password_hash: demoPwHash,
                google_id: null,
                is_verified: true,
                avatar: '/game_avatar.png',
                xp: 820,
                lifetime_xp: 2820,
                level: 3,
                coins: 650,
                current_streak: 6,
                last_save_date: today,
                total_saved: 1850,
                age: 12,
                nickname: 'Aarav',
                grade: 'Grade 7',
                onboarding_completed: true,
                phone: null,
                city: 'Mumbai',
                streak_shields: 2,
                unlocked_avatars: 'ninja',
            },
            {
                full_name: 'Diya Sharma',
                email: 'diya.sharma@AstraMinds.demo',
                password_hash: demoPwHash,
                google_id: null,
                is_verified: true,
                avatar: '/ninja.jpg',
                xp: 1640,
                lifetime_xp: 5640,
                level: 5,
                coins: 1420,
                current_streak: 14,
                last_save_date: today,
                total_saved: 3200,
                age: 13,
                nickname: 'Diya',
                grade: 'Grade 8',
                onboarding_completed: true,
                phone: null,
                city: 'Bengaluru',
                streak_shields: 3,
                unlocked_avatars: 'ninja,alien',
            },
            {
                full_name: 'Rohan Kapoor',
                email: 'rohan.kapoor@AstraMinds.demo',
                password_hash: demoPwHash,
                google_id: null,
                is_verified: true,
                avatar: '/spartan.jpg',
                xp: 1320,
                lifetime_xp: 4320,
                level: 4,
                coins: 980,
                current_streak: 9,
                last_save_date: today,
                total_saved: 2400,
                age: 11,
                nickname: 'Rohan',
                grade: 'Grade 6',
                onboarding_completed: true,
                phone: null,
                city: 'Delhi',
                streak_shields: 1,
                unlocked_avatars: 'spartan',
            },
            {
                full_name: 'Ananya Iyer',
                email: 'ananya.iyer@AstraMinds.demo',
                password_hash: demoPwHash,
                google_id: null,
                is_verified: true,
                avatar: '/alien.jpg',
                xp: 1100,
                lifetime_xp: 3100,
                level: 3,
                coins: 740,
                current_streak: 5,
                last_save_date: today,
                total_saved: 1650,
                age: 12,
                nickname: 'Ananya',
                grade: 'Grade 7',
                onboarding_completed: true,
                phone: null,
                city: 'Pune',
                streak_shields: 1,
                unlocked_avatars: '',
            },
        ];

        for (const u of demoUsers) {
            this.users.push({
                id: this.nextId('users'),
                ...u,
                created_at: now,
            });
        }

        const demoUser = this.users[0];

        // Sample kid-friendly pocket money transactions for demo user
        const sampleTxs: Array<Omit<TrackerTransactionRecord, 'id' | 'created_at' | 'updated_at'>> = [
            {
                user_id: demoUser.id,
                type: 'INCOME',
                amount: 1000,
                currency: 'INR',
                category_name: 'Gift Money',
                merchant: 'Birthday Gift from Grandma',
                transaction_date: addDaysIso(today, -14),
                payment_method: 'Piggy Bank Cash',
                description: 'Birthday envelope gift',
                tags: 'gift,birthday',
                receipt_filename: null,
                bill_upload_id: null,
                is_subscription: false,
            },
            {
                user_id: demoUser.id,
                type: 'INCOME',
                amount: 500,
                currency: 'INR',
                category_name: 'Pocket Money',
                merchant: 'Weekly Allowance',
                transaction_date: addDaysIso(today, -7),
                payment_method: 'Pocket Money Jar',
                description: 'Weekly pocket money from parents',
                tags: 'allowance,pocket-money',
                receipt_filename: null,
                bill_upload_id: null,
                is_subscription: false,
            },
            {
                user_id: demoUser.id,
                type: 'INCOME',
                amount: 300,
                currency: 'INR',
                category_name: 'Chore Rewards',
                merchant: 'Weekend Garden Helper',
                transaction_date: addDaysIso(today, -3),
                payment_method: 'Piggy Bank Cash',
                description: 'Helped water plants & organize bookshelf',
                tags: 'chores,earned',
                receipt_filename: null,
                bill_upload_id: null,
                is_subscription: false,
            },
            {
                user_id: demoUser.id,
                type: 'EXPENSE',
                amount: 180,
                currency: 'INR',
                category_name: 'Books & Comics',
                merchant: 'Comic Book Corner',
                transaction_date: addDaysIso(today, -6),
                payment_method: 'Piggy Bank Cash',
                description: 'Bought adventure comic book',
                tags: 'reading,comics',
                receipt_filename: null,
                bill_upload_id: null,
                is_subscription: false,
            },
            {
                user_id: demoUser.id,
                type: 'EXPENSE',
                amount: 90,
                currency: 'INR',
                category_name: 'Snacks & Treats',
                merchant: 'School Canteen',
                transaction_date: addDaysIso(today, -4),
                payment_method: 'Piggy Bank Cash',
                description: 'Fruit juice & sandwich after sports practice',
                tags: 'snacks,school',
                receipt_filename: null,
                bill_upload_id: null,
                is_subscription: false,
            },
            {
                user_id: demoUser.id,
                type: 'EXPENSE',
                amount: 250,
                currency: 'INR',
                category_name: 'Toys & Hobbies',
                merchant: 'Art & Sketch Studio',
                transaction_date: addDaysIso(today, -2),
                payment_method: 'Parent App',
                description: 'Sketchpad and watercolor markers',
                tags: 'art,hobby',
                receipt_filename: null,
                bill_upload_id: null,
                is_subscription: false,
            },
        ];

        for (const tx of sampleTxs) {
            this.trackerTransactions.push({
                id: this.nextId('trackerTransactions'),
                ...tx,
                created_at: now,
                updated_at: now,
            });
        }

        this.categoryBudgets.push({
            id: this.nextId('categoryBudgets'),
            user_id: demoUser.id,
            category_name: 'Snacks & Treats',
            month: today.slice(0, 7),
            budget_amount: 400,
            created_at: now,
        });

        // Sample kid-friendly savings goal for demo user
        const goal1: GoalRecord = {
            id: this.nextId('goals'),
            user_id: demoUser.id,
            name: 'Mountain Bicycle',
            description: 'Saving pocket money for a cool 21-speed bicycle!',
            target_amount: 4500,
            saved_amount: 1850,
            target_date: addDaysIso(today, 60),
            icon: '🚲',
            status: 'ACTIVE',
            reward_awarded: false,
            original_completion_date: addDaysIso(today, 60),
            current_completion_date: addDaysIso(today, 60),
            created_at: now,
        };
        this.goals.push(goal1);

        this.goalAutoSavings.push({
            id: this.nextId('goalAutoSavings'),
            goal_id: goal1.id,
            frequency: 'DAILY',
            custom_days: null,
            amount: 100,
            next_run_date: addDaysIso(today, 1),
            created_at: now,
        });

        const goalTxDates = [-14, -10, -6, -3, -1];
        const goalTxAmounts = [500, 450, 350, 300, 250];
        let running = 0;
        goalTxDates.forEach((offset, i) => {
            const amt = goalTxAmounts[i];
            running += amt;
            this.goalTransactions.push({
                id: this.nextId('goalTransactions'),
                goal_id: goal1.id,
                type: 'GOAL_AUTOPAY',
                amount: amt,
                description: `Auto-Save: Put ₹${amt} into Mountain Bicycle jar`,
                status: 'SUCCESS',
                source: 'Pocket Money Balance',
                destination: 'Goal Jar',
                reason: null,
                remaining_balance: Math.max(0, goal1.target_amount - running),
                current_balance: running,
                created_at: `${addDaysIso(today, offset)}T08:00:00.000Z`,
            });
        });

        this.notifications.push({
            id: this.nextId('notifications'),
            user_id: demoUser.id,
            title: 'Welcome to Nickle!',
            message: 'Try this week\'s Money Smarts Quiz and Digital Money Safety Quiz to earn bonus Gold Coins!',
            type: 'info',
            is_read: false,
            created_at: now,
        });
    }
}

export const store = new MemoryStore();

export function getActiveStreak(user: UserRecord): number {
    const today = todayIso();
    if (user.last_save_date && (user.current_streak || 0) > 0) {
        const daysDiff = daysBetweenIso(today, user.last_save_date);
        if (daysDiff > 1) {
            const missedDays = daysDiff - 1;
            if ((user.streak_shields || 0) >= missedDays) {
                user.streak_shields -= missedDays;
                user.last_save_date = addDaysIso(today, -1);
                const shieldWord = missedDays === 1 ? '1 Streak Shield' : `${missedDays} Streak Shields`;
                store.notifications.push({
                    id: store.nextId('notifications'),
                    user_id: user.id,
                    title: 'Streak Shield Activated 🛡️',
                    message: `Your ${user.current_streak}-day saving streak was protected! Used ${shieldWord} (${user.streak_shields} remaining).`,
                    type: 'reward',
                    is_read: false,
                    created_at: new Date().toISOString(),
                });
            } else {
                user.current_streak = 0;
            }
        }
    }
    return user.current_streak || 0;
}

export function levelUp(user: UserRecord): void {
    while (true) {
        const xpNeededForNext = totalXpForLevel(user.level + 1);
        if (user.lifetime_xp >= xpNeededForNext) {
            user.level += 1;
            const coinsReward = coinsForLevelUp(user.level);
            user.coins += coinsReward;
            store.notifications.push({
                id: store.nextId('notifications'),
                user_id: user.id,
                title: `Level Up! Level ${user.level} 🎖️`,
                message: `Congratulations! You reached Level ${user.level} and earned ${coinsReward} Gold Coins!`,
                type: 'reward',
                is_read: false,
                created_at: new Date().toISOString(),
            });
        } else {
            break;
        }
    }
}

export function serializeUser(user: UserRecord) {
    const xpStartOfLevel = totalXpForLevel(user.level);
    const currentLevelProgress = Math.max(0, user.lifetime_xp - xpStartOfLevel);
    const goalsSaved = store.goals
        .filter(g => g.user_id === user.id)
        .reduce((sum, g) => sum + Number(g.saved_amount || 0), 0);

    return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        is_verified: user.is_verified,
        avatar: user.avatar || '/game_avatar.png',
        xp: currentLevelProgress,
        season_xp: user.xp,
        lifetime_xp: user.lifetime_xp,
        level: user.level,
        xp_to_next_level: xpForLevel(user.level),
        coins: user.coins,
        current_streak: getActiveStreak(user),
        total_saved: Number(goalsSaved),
        age: user.age,
        nickname: user.nickname || null,
        grade: user.grade || null,
        onboarding_completed: Boolean(user.onboarding_completed),
        phone: user.phone,
        city: user.city,
        streak_shields: user.streak_shields,
        unlocked_avatars: user.unlocked_avatars,
        has_password: user.password_hash !== '!GOOGLE_AUTH_NO_PASSWORD!',
    };
}

export function getUserAccountBalance(userId: number): number {
    let inc = 0;
    let exp = 0;
    for (const tx of store.trackerTransactions) {
        if (tx.user_id === userId) {
            if (tx.type === 'INCOME') inc += Number(tx.amount || 0);
            else exp += Number(tx.amount || 0);
        }
    }
    return Math.round((inc - exp) * 100) / 100;
}

export function getUserNetCashFlow(userId: number, startDate?: string, endDate?: string): number {
    if (!startDate && !endDate) {
        return getUserAccountBalance(userId);
    }
    let inc = 0;
    let exp = 0;
    for (const tx of store.trackerTransactions) {
        if (tx.user_id !== userId) continue;
        if (startDate && tx.transaction_date < startDate) continue;
        if (endDate && tx.transaction_date > endDate) continue;
        if (tx.type === 'INCOME') inc += Number(tx.amount || 0);
        else exp += Number(tx.amount || 0);
    }
    return Math.round((inc - exp) * 100) / 100;
}

export function checkSeasonRollover(): void {
    const currentWeekStr = getIsoWeekKey();
    const stateWeek = store.globalState.get('current_season_week');
    const seasonNum = Number(store.globalState.get('current_season_number') || '1');

    if (!stateWeek) {
        store.globalState.set('current_season_week', currentWeekStr);
        return;
    }

    if (stateWeek < currentWeekStr) {
        const topUsers = store.users
            .filter(u => u.xp > 0 && u.is_verified)
            .sort((a, b) => b.xp - a.xp);

        topUsers.forEach((u, idx) => {
            const rank = idx + 1;
            let coins = 25;
            if (rank === 1) coins = 5000;
            else if (rank === 2) coins = 2500;
            else if (rank === 3) coins = 1000;
            else if (rank <= 10) coins = 750;
            else if (rank <= 50) coins = 500;
            else if (rank <= 100) coins = 250;

            u.coins += coins;
            store.notifications.push({
                id: store.nextId('notifications'),
                user_id: u.id,
                title: 'Season Rewards 🏆',
                message: `Season ended! You placed Rank #${rank} and won ${coins} Coins!`,
                type: 'reward',
                is_read: false,
                created_at: new Date().toISOString(),
            });
        });

        for (const u of store.users) {
            u.xp = 0;
        }
        store.globalState.set('current_season_week', currentWeekStr);
        store.globalState.set('current_season_number', String(seasonNum + 1));
    }
}

export function processGoalAutopay(
    autoSaving: GoalAutoSavingRecord,
    today: string
): { success: boolean; message: string; tx: GoalTransactionRecord | null; currentCashFlow: number } {
    const goal = store.goals.find(g => g.id === autoSaving.goal_id);
    if (!goal) {
        return { success: false, message: 'Goal not found', tx: null, currentCashFlow: 0 };
    }
    if (goal.status !== 'ACTIVE') {
        return { success: false, message: `Goal is currently ${goal.status}`, tx: null, currentCashFlow: 0 };
    }
    const user = store.users.find(u => u.id === goal.user_id);
    if (!user) {
        return { success: false, message: 'User not found', tx: null, currentCashFlow: 0 };
    }
    const amount = Number(autoSaving.amount);
    if (amount <= 0) {
        return { success: false, message: 'AutoPay amount must be greater than 0', tx: null, currentCashFlow: 0 };
    }

    const accountBalance = getUserAccountBalance(user.id);
    const nowIso = new Date().toISOString();

    if (accountBalance >= amount) {
        store.trackerTransactions.push({
            id: store.nextId('trackerTransactions'),
            user_id: user.id,
            type: 'EXPENSE',
            amount,
            currency: 'INR',
            category_name: 'Savings',
            merchant: `${goal.name} autopay debit`,
            transaction_date: today,
            payment_method: 'AutoPay',
            description: `AutoPay debit for goal: ${goal.name}`,
            tags: 'autopay,goal-savings',
            receipt_filename: null,
            bill_upload_id: null,
            is_subscription: false,
            created_at: nowIso,
            updated_at: nowIso,
        });

        goal.saved_amount += amount;
        let completionCoins = 0;

        if (goal.saved_amount >= goal.target_amount) {
            goal.status = 'COMPLETED';
            goal.current_completion_date = today;
            if (!goal.reward_awarded) {
                completionCoins = calculateGoalCompletionCoins(goal.target_amount);
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
        }

        const tx: GoalTransactionRecord = {
            id: store.nextId('goalTransactions'),
            goal_id: goal.id,
            type: 'GOAL_AUTOPAY',
            amount,
            status: 'SUCCESS',
            source: 'Main Account Balance',
            destination: 'Goal Wallet',
            reason: null,
            description: `AutoPay: Saved ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${goal.name} from Main Account Balance`,
            remaining_balance: Math.max(0, goal.target_amount - goal.saved_amount),
            current_balance: goal.saved_amount,
            created_at: nowIso,
        };
        store.goalTransactions.push(tx);

        let dailyStreakXp = 0;
        if (autoSaving.frequency === 'DAILY') {
            getActiveStreak(user);
            if (user.last_save_date === today) {
                // Already saved today
            } else if (user.last_save_date === addDaysIso(today, -1)) {
                user.current_streak = (user.current_streak || 0) + 1;
                user.last_save_date = today;
                dailyStreakXp = 50;
                user.xp += dailyStreakXp;
                user.lifetime_xp += dailyStreakXp;
                levelUp(user);
            } else {
                user.current_streak = 1;
                user.last_save_date = today;
                dailyStreakXp = 50;
                user.xp += dailyStreakXp;
                user.lifetime_xp += dailyStreakXp;
                levelUp(user);
            }
        }

        if (autoSaving.frequency === 'DAILY') {
            autoSaving.next_run_date = addDaysIso(today, 1);
        } else if (autoSaving.frequency === 'WEEKLY') {
            autoSaving.next_run_date = addDaysIso(today, 7);
        } else if (autoSaving.frequency === 'MONTHLY') {
            autoSaving.next_run_date = addDaysIso(today, 30);
        } else if (autoSaving.frequency === 'CUSTOM' && autoSaving.custom_days) {
            autoSaving.next_run_date = addDaysIso(today, Math.max(1, Number(autoSaving.custom_days)));
        } else {
            autoSaving.next_run_date = addDaysIso(today, 1);
        }

        const streakNote = autoSaving.frequency === 'DAILY' && dailyStreakXp > 0 ? ' 🔥 Daily Streak maintained! (+50 XP)' : '';
        store.notifications.push({
            id: store.nextId('notifications'),
            user_id: user.id,
            title: 'AutoPay Debited',
            message: `Debited ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from Main Account Balance for '${goal.name}'.${streakNote}`,
            type: 'success',
            is_read: false,
            created_at: nowIso,
        });

        const remainingBalance = Math.round((accountBalance - amount) * 100) / 100;
        const completionNote = completionCoins > 0 ? ` 🏆 Goal Completed! You earned ${completionCoins.toLocaleString('en-IN')} Gold Coins!` : '';
        let successMsg = `AutoPay executed successfully! Debited ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from Main Account Balance.${completionNote}`;
        if (autoSaving.frequency === 'DAILY') {
            if (dailyStreakXp > 0) {
                successMsg = `AutoPay executed successfully! Debited ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from Main Account Balance. 🔥 Daily Streak: ${user.current_streak} days (+${dailyStreakXp} XP earned!)${completionNote}`;
            } else {
                successMsg = `AutoPay executed successfully! Debited ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from Main Account Balance. 🔥 Daily Streak maintained for today (${user.current_streak} days).${completionNote}`;
            }
        }

        return { success: true, message: successMsg, tx, currentCashFlow: remainingBalance };
    } else {
        goal.status = 'PAUSED';
        if (autoSaving.frequency === 'DAILY') {
            getActiveStreak(user);
        }
        const reason = `Insufficient funds in Main Account Balance (₹${accountBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} available, ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} required)`;
        store.notifications.push({
            id: store.nextId('notifications'),
            user_id: user.id,
            title: 'AutoPay Paused',
            message: `AutoPay for '${goal.name}' was paused due to insufficient Main Account Balance (₹${accountBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} available, ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} required).`,
            type: 'warning',
            is_read: false,
            created_at: nowIso,
        });
        const tx: GoalTransactionRecord = {
            id: store.nextId('goalTransactions'),
            goal_id: goal.id,
            type: 'GOAL_AUTOPAY',
            amount,
            status: 'FAILED',
            source: 'Main Account Balance',
            destination: 'Goal Wallet',
            reason,
            description: `AutoPay Failed: Insufficient balance in Main Account Balance for ${goal.name}`,
            remaining_balance: Math.max(0, goal.target_amount - goal.saved_amount),
            current_balance: goal.saved_amount,
            created_at: nowIso,
        };
        store.goalTransactions.push(tx);
        return { success: false, message: reason, tx, currentCashFlow: accountBalance };
    }
}
