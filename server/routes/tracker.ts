import crypto from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import {
    store,
    todayIso,
    addDaysIso,
    daysBetweenIso,
    type TrackerTransactionRecord,
    type TrackerCategoryRecord,
    type TrackerSubscriptionRecord,
    type CategoryBudgetRecord,
    type BillUploadRecord,
} from '../store.js';
import {
    requireAuth,
    type AuthenticatedRequest,
    extractBearerToken,
    decodeAccessToken,
} from '../authMiddleware.js';
import { extractBillWithGemini, generateTrackerInsights } from '../gemini.js';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp']);

const CATEGORY_COLORS: Record<string, string> = {
    'Snacks & Treats': '#f97316',
    'Books & Comics': '#6366f1',
    'Games & Apps': '#a855f7',
    'Toys & Hobbies': '#ec4899',
    'Sports & Clubs': '#22c55e',
    'School Supplies': '#06b6d4',
    'Gifts & Sharing': '#f43f5e',
    Savings: '#34d399',
    'Pocket Money': '#10b981',
    'Chore Rewards': '#14b8a6',
    'Gift Money': '#eab308',
    Other: '#94a3b8',
};

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function isIsoDate(str: unknown): str is string {
    return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function serializeTransaction(tx: TrackerTransactionRecord) {
    return {
        id: tx.id,
        user_id: tx.user_id,
        type: tx.type,
        amount: round2(Number(tx.amount)),
        currency: tx.currency,
        category_name: tx.category_name,
        merchant: tx.merchant || '',
        transaction_date: tx.transaction_date,
        payment_method: tx.payment_method || '',
        description: tx.description || '',
        tags: tx.tags
            ? tx.tags
                  .split(',')
                  .map(t => t.trim())
                  .filter(Boolean)
            : [],
        receipt_filename: tx.receipt_filename,
        bill_upload_id: tx.bill_upload_id,
        is_subscription: tx.is_subscription,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
    };
}

function serializeCategory(c: TrackerCategoryRecord) {
    return {
        id: c.id,
        user_id: c.user_id,
        name: c.name,
        icon: c.icon || 'Tag',
        color: c.color || '#888888',
        type: c.type,
        is_system: c.is_system,
        created_at: c.created_at,
    };
}

function serializeSubscription(s: TrackerSubscriptionRecord) {
    return {
        id: s.id,
        user_id: s.user_id,
        name: s.name,
        category_name: s.category_name || 'Subscriptions',
        amount: round2(Number(s.amount)),
        currency: s.currency,
        billing_cycle: s.billing_cycle,
        next_renewal_date: s.next_renewal_date,
        status: s.status,
        notes: s.notes || '',
        created_at: s.created_at,
    };
}

function serializeBudget(b: CategoryBudgetRecord) {
    return {
        id: b.id,
        user_id: b.user_id,
        category_name: b.category_name,
        month: b.month,
        budget_amount: round2(Number(b.budget_amount)),
        created_at: b.created_at,
    };
}

function getMondayOfWeek(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setUTCDate(d.getUTCDate() - diff);
    return d.toISOString().slice(0, 10);
}

function getMonthEndIso(dateStr: string): string {
    const [yearStr, monthStr] = dateStr.split('-');
    const y = Number(yearStr);
    const m = Number(monthStr);
    const lastDay = new Date(Date.UTC(y, m, 0));
    return lastDay.toISOString().slice(0, 10);
}

// =============================================================================
// Categories
// =============================================================================

router.get('/categories', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const categories = store.trackerCategories
        .filter(c => c.is_system || c.user_id === userId)
        .sort((a, b) => {
            if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

    res.status(200).json({ categories: categories.map(serializeCategory) });
});

router.post('/categories', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const data = req.body || {};
    const name = String(data.name || '').trim();
    if (!name) {
        res.status(400).json({ error: 'Category name is required' });
        return;
    }

    let catType = String(data.type || 'EXPENSE').toUpperCase();
    if (catType !== 'EXPENSE' && catType !== 'INCOME' && catType !== 'BOTH') {
        catType = 'EXPENSE';
    }

    const existing = store.trackerCategories.find(
        c =>
            (c.is_system || c.user_id === userId) &&
            c.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
        res.status(400).json({ error: `Category '${name}' already exists` });
        return;
    }

    const category: TrackerCategoryRecord = {
        id: store.nextId('trackerCategories'),
        user_id: userId,
        name,
        icon: String(data.icon || 'Tag'),
        color: String(data.color || '#888888'),
        type: catType as TrackerCategoryRecord['type'],
        is_system: false,
        created_at: new Date().toISOString(),
    };
    store.trackerCategories.push(category);

    res.status(201).json({ category: serializeCategory(category) });
});

router.delete('/categories/:catId', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const catId = Number(req.params.catId);
    const idx = store.trackerCategories.findIndex(c => c.id === catId);
    if (idx === -1) {
        res.status(404).json({ error: 'Category not found' });
        return;
    }

    const category = store.trackerCategories[idx];
    if (category.is_system || category.user_id !== userId) {
        res.status(403).json({ error: 'Cannot delete system categories or categories owned by other users' });
        return;
    }

    store.trackerCategories.splice(idx, 1);
    res.status(200).json({ success: true, message: 'Category deleted' });
});

// =============================================================================
// Transactions CRUD
// =============================================================================

router.get('/transactions', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const txType = typeof req.query.type === 'string' ? req.query.type.toUpperCase() : '';
    const categoryName = typeof req.query.category === 'string' ? req.query.category : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const startDate = isIsoDate(req.query.start_date) ? req.query.start_date : null;
    const endDate = isIsoDate(req.query.end_date) ? req.query.end_date : null;
    const sortBy = typeof req.query.sort_by === 'string' ? req.query.sort_by : 'date_desc';
    const page = Math.max(1, Number(req.query.page || 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 15) || 15));

    let txs = store.trackerTransactions.filter(t => t.user_id === userId);

    if (txType === 'EXPENSE' || txType === 'INCOME') {
        txs = txs.filter(t => t.type === txType);
    }
    if (categoryName && categoryName !== 'All') {
        txs = txs.filter(t => t.category_name === categoryName);
    }
    if (startDate) {
        txs = txs.filter(t => t.transaction_date >= startDate);
    }
    if (endDate) {
        txs = txs.filter(t => t.transaction_date <= endDate);
    }
    if (search) {
        txs = txs.filter(
            t =>
                t.merchant.toLowerCase().includes(search) ||
                t.description.toLowerCase().includes(search) ||
                t.category_name.toLowerCase().includes(search) ||
                t.tags.toLowerCase().includes(search)
        );
    }

    txs.sort((a, b) => {
        if (sortBy === 'date_asc') {
            return a.transaction_date.localeCompare(b.transaction_date) || a.id - b.id;
        }
        if (sortBy === 'amount_desc') {
            return b.amount - a.amount || b.transaction_date.localeCompare(a.transaction_date);
        }
        if (sortBy === 'amount_asc') {
            return a.amount - b.amount || b.transaction_date.localeCompare(a.transaction_date);
        }
        return b.transaction_date.localeCompare(a.transaction_date) || b.id - a.id;
    });

    const totalCount = txs.length;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 1;
    const paginated = txs.slice((page - 1) * limit, page * limit);

    res.status(200).json({
        transactions: paginated.map(serializeTransaction),
        total_count: totalCount,
        page,
        limit,
        total_pages: totalPages,
    });
});

router.post('/transactions', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const data = req.body || {};

    const txType = String(data.type || 'EXPENSE').toUpperCase();
    if (txType !== 'EXPENSE' && txType !== 'INCOME') {
        res.status(400).json({ error: 'Transaction type must be EXPENSE or INCOME' });
        return;
    }

    const amount = round2(Number(data.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than zero' });
        return;
    }

    const categoryName = String(data.category_name || '').trim();
    if (!categoryName) {
        res.status(400).json({ error: 'Category is required' });
        return;
    }

    const txDate = isIsoDate(data.transaction_date) ? data.transaction_date : todayIso();
    const merchant = String(data.merchant || '').trim();
    const paymentMethod = String(data.payment_method || 'UPI').trim();
    const description = String(data.description || '').trim();
    const currency = String(data.currency || 'INR').trim().toUpperCase();
    const billUploadId = data.bill_upload_id ? Number(data.bill_upload_id) : null;
    const isSubscription = Boolean(data.is_subscription);

    let tagsStr = '';
    if (Array.isArray(data.tags)) {
        tagsStr = data.tags
            .map((t: unknown) => String(t).trim())
            .filter(Boolean)
            .join(',');
    } else if (data.tags !== undefined && data.tags !== null) {
        tagsStr = String(data.tags).trim();
    }

    let receiptFilename: string | null = null;
    if (billUploadId) {
        const uploadRec = store.billUploads.find(b => b.id === billUploadId && b.user_id === userId);
        if (uploadRec) {
            receiptFilename = uploadRec.original_filename;
        }
    }

    const nowIso = new Date().toISOString();
    const tx: TrackerTransactionRecord = {
        id: store.nextId('trackerTransactions'),
        user_id: userId,
        type: txType as 'EXPENSE' | 'INCOME',
        amount,
        currency,
        category_name: categoryName,
        merchant,
        transaction_date: txDate,
        payment_method: paymentMethod,
        description,
        tags: tagsStr,
        receipt_filename: receiptFilename,
        bill_upload_id: billUploadId,
        is_subscription: isSubscription,
        created_at: nowIso,
        updated_at: nowIso,
    };
    store.trackerTransactions.push(tx);

    res.status(201).json({ transaction: serializeTransaction(tx) });
});

router.get('/transactions/:txId', requireAuth, (req: AuthenticatedRequest, res) => {
    const txId = Number(req.params.txId);
    const tx = store.trackerTransactions.find(t => t.id === txId && t.user_id === req.userId!);
    if (!tx) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
    }
    res.status(200).json({ transaction: serializeTransaction(tx) });
});

router.put('/transactions/:txId', requireAuth, (req: AuthenticatedRequest, res) => {
    const txId = Number(req.params.txId);
    const tx = store.trackerTransactions.find(t => t.id === txId && t.user_id === req.userId!);
    if (!tx) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
    }

    const data = req.body || {};
    if (typeof data.type === 'string') {
        const t = data.type.toUpperCase();
        if (t === 'EXPENSE' || t === 'INCOME') tx.type = t;
    }
    if ('amount' in data) {
        const amt = round2(Number(data.amount));
        if (!Number.isFinite(amt) || amt <= 0) {
            res.status(400).json({ error: 'Amount must be greater than zero' });
            return;
        }
        tx.amount = amt;
    }
    if (typeof data.category_name === 'string' && data.category_name.trim()) {
        tx.category_name = data.category_name.trim();
    }
    if (isIsoDate(data.transaction_date)) {
        tx.transaction_date = data.transaction_date;
    }
    if ('merchant' in data) tx.merchant = String(data.merchant || '').trim();
    if ('payment_method' in data) tx.payment_method = String(data.payment_method || '').trim();
    if ('description' in data) tx.description = String(data.description || '').trim();
    if ('tags' in data) {
        if (Array.isArray(data.tags)) {
            tx.tags = data.tags
                .map((t: unknown) => String(t).trim())
                .filter(Boolean)
                .join(',');
        } else {
            tx.tags = String(data.tags || '').trim();
        }
    }
    if ('is_subscription' in data) tx.is_subscription = Boolean(data.is_subscription);
    tx.updated_at = new Date().toISOString();

    res.status(200).json({ transaction: serializeTransaction(tx) });
});

router.delete('/transactions/:txId', requireAuth, (req: AuthenticatedRequest, res) => {
    const txId = Number(req.params.txId);
    const idx = store.trackerTransactions.findIndex(t => t.id === txId && t.user_id === req.userId!);
    if (idx === -1) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
    }
    store.trackerTransactions.splice(idx, 1);
    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
});

// =============================================================================
// Summary, Balance & Analytics
// =============================================================================

router.get('/summary', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const today = todayIso();
    const firstOfMonth = `${today.slice(0, 7)}-01`;

    let startDate = isIsoDate(req.query.start_date) ? req.query.start_date : firstOfMonth;
    let endDate = isIsoDate(req.query.end_date) ? req.query.end_date : today;
    if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
    }

    const periodDays = Math.max(1, daysBetweenIso(endDate, startDate) + 1);
    const currentTxs = store.trackerTransactions.filter(
        t => t.user_id === userId && t.transaction_date >= startDate && t.transaction_date <= endDate
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryExpenses: Record<string, number> = {};

    for (const tx of currentTxs) {
        const amt = Number(tx.amount);
        if (tx.type === 'INCOME') {
            totalIncome += amt;
        } else {
            totalExpenses += amt;
            const cat = tx.category_name || 'Other';
            categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
        }
    }

    const netCashFlow = round2(totalIncome - totalExpenses);
    const avgDailySpending = round2(totalExpenses / periodDays);

    let largestCatName = 'None';
    let largestCatAmount = 0;
    let largestCatPct = 0;

    const sortedCats = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
        largestCatName = sortedCats[0][0];
        largestCatAmount = round2(sortedCats[0][1]);
        if (totalExpenses > 0) {
            largestCatPct = Math.round((largestCatAmount / totalExpenses) * 1000) / 10;
        }
    }

    const activeSubs = store.trackerSubscriptions.filter(
        s => s.user_id === userId && s.status === 'ACTIVE'
    );
    let monthlySubCost = 0;
    for (const s of activeSubs) {
        const amt = Number(s.amount);
        if (s.billing_cycle === 'YEARLY') monthlySubCost += round2(amt / 12);
        else if (s.billing_cycle === 'QUARTERLY') monthlySubCost += round2(amt / 3);
        else if (s.billing_cycle === 'WEEKLY') monthlySubCost += round2(amt * 4.333);
        else monthlySubCost += amt;
    }

    let prevStartDate: string;
    let prevEndDate: string;
    const dayAfterEnd = addDaysIso(endDate, 1);
    if (
        startDate.endsWith('-01') &&
        ((startDate.slice(0, 7) === endDate.slice(0, 7)) || dayAfterEnd.endsWith('-01'))
    ) {
        prevEndDate = addDaysIso(startDate, -1);
        prevStartDate = `${prevEndDate.slice(0, 7)}-01`;
    } else {
        prevEndDate = addDaysIso(startDate, -1);
        prevStartDate = addDaysIso(prevEndDate, -(periodDays - 1));
    }

    const prevTxs = store.trackerTransactions.filter(
        t => t.user_id === userId && t.transaction_date >= prevStartDate && t.transaction_date <= prevEndDate
    );

    let prevExpenses = 0;
    let prevIncome = 0;
    for (const tx of prevTxs) {
        if (tx.type === 'INCOME') prevIncome += Number(tx.amount);
        else prevExpenses += Number(tx.amount);
    }

    const calcChange = (curr: number, prev: number) => {
        const diff = round2(curr - prev);
        let pct = 0;
        if (prev > 0) pct = Math.round((diff / prev) * 1000) / 10;
        else if (curr > 0) pct = 100;
        return { diff, pct };
    };

    const expChange = calcChange(totalExpenses, prevExpenses);
    const incChange = calcChange(totalIncome, prevIncome);

    res.status(200).json({
        period: {
            start_date: startDate,
            end_date: endDate,
            days_count: periodDays,
        },
        previous_period: {
            start_date: prevStartDate,
            end_date: prevEndDate,
        },
        totals: {
            total_income: round2(totalIncome),
            total_expenses: round2(totalExpenses),
            net_cash_flow: netCashFlow,
            average_daily_spending: avgDailySpending,
            transaction_count: currentTxs.length,
            monthly_subscription_cost: round2(monthlySubCost),
        },
        largest_category: {
            name: largestCatName,
            amount: largestCatAmount,
            percentage: largestCatPct,
        },
        comparison: {
            previous_expenses: round2(prevExpenses),
            previous_income: round2(prevIncome),
            expense_change_amount: expChange.diff,
            expense_change_percentage: expChange.pct,
            income_change_amount: incChange.diff,
            income_change_percentage: incChange.pct,
        },
    });
});

router.get('/balance', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of store.trackerTransactions) {
        if (tx.user_id !== userId) continue;
        if (tx.type === 'INCOME') totalIncome += Number(tx.amount);
        else totalExpenses += Number(tx.amount);
    }

    const currentBalance = round2(totalIncome - totalExpenses);
    res.status(200).json({
        current_balance: currentBalance,
        total_balance: currentBalance,
        total_income: round2(totalIncome),
        total_expenses: round2(totalExpenses),
        initial_balance: 0,
        currency: 'INR',
        currency_symbol: '₹',
    });
});

router.get('/analytics', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const today = todayIso();
    const firstOfMonth = `${today.slice(0, 7)}-01`;

    let startDate = isIsoDate(req.query.start_date) ? req.query.start_date : firstOfMonth;
    let endDate = isIsoDate(req.query.end_date) ? req.query.end_date : today;
    if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
    }

    const trendInterval = String(req.query.trend_interval || 'daily');
    const txs = store.trackerTransactions
        .filter(t => t.user_id === userId && t.transaction_date >= startDate && t.transaction_date <= endDate)
        .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

    // 1. Trend
    const trendMap = new Map<string, { key: string; label: string; expense: number; income: number }>();
    let curr = startDate;
    while (curr <= endDate) {
        let key: string;
        let label: string;
        const dt = new Date(`${curr}T00:00:00.000Z`);

        if (trendInterval === 'monthly') {
            key = curr.slice(0, 7);
            label = dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        } else if (trendInterval === 'weekly') {
            const wk = getMondayOfWeek(curr);
            const wkDt = new Date(`${wk}T00:00:00.000Z`);
            key = wk;
            label = `Wk of ${wkDt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' })}`;
        } else {
            key = curr;
            label = dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
        }

        if (!trendMap.has(key)) {
            trendMap.set(key, { key, label, expense: 0, income: 0 });
        }
        curr = addDaysIso(curr, 1);
    }

    for (const tx of txs) {
        let key: string;
        if (trendInterval === 'monthly') key = tx.transaction_date.slice(0, 7);
        else if (trendInterval === 'weekly') key = getMondayOfWeek(tx.transaction_date);
        else key = tx.transaction_date;

        const bucket = trendMap.get(key);
        if (bucket) {
            if (tx.type === 'EXPENSE') bucket.expense += Number(tx.amount);
            else bucket.income += Number(tx.amount);
        }
    }

    const trendList = Array.from(trendMap.keys())
        .sort()
        .map(k => {
            const item = trendMap.get(k)!;
            const exp = round2(item.expense);
            const inc = round2(item.income);
            return {
                date: item.key,
                label: item.label,
                expense: exp,
                income: inc,
                net: round2(inc - exp),
            };
        });

    // 2. Category Breakdown
    const colors: Record<string, string> = { ...CATEGORY_COLORS };
    for (const uc of store.trackerCategories) {
        if ((uc.is_system || uc.user_id === userId) && uc.color) {
            colors[uc.name] = uc.color;
        }
    }

    const catMap: Record<string, { amount: number; count: number }> = {};
    let totalExpense = 0;
    for (const tx of txs) {
        if (tx.type !== 'EXPENSE') continue;
        const amt = Number(tx.amount);
        totalExpense += amt;
        const cname = tx.category_name || 'Other';
        if (!catMap[cname]) catMap[cname] = { amount: 0, count: 0 };
        catMap[cname].amount += amt;
        catMap[cname].count += 1;
    }

    const categoryBreakdown = Object.entries(catMap)
        .map(([name, info]) => ({
            name,
            amount: round2(info.amount),
            percentage: totalExpense > 0 ? Math.round((info.amount / totalExpense) * 1000) / 10 : 0,
            count: info.count,
            color: colors[name] || '#94a3b8',
        }))
        .sort((a, b) => b.amount - a.amount);

    // 3. Top Merchants
    const merchantMap: Record<string, { amount: number; count: number }> = {};
    for (const tx of txs) {
        if (tx.type !== 'EXPENSE') continue;
        const m = (tx.merchant || '').trim() || 'Unspecified Merchant';
        if (!merchantMap[m]) merchantMap[m] = { amount: 0, count: 0 };
        merchantMap[m].amount += Number(tx.amount);
        merchantMap[m].count += 1;
    }

    const topMerchants = Object.entries(merchantMap)
        .map(([merchant, info]) => ({
            merchant,
            amount: round2(info.amount),
            percentage: totalExpense > 0 ? Math.round((info.amount / totalExpense) * 1000) / 10 : 0,
            count: info.count,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

    // 4. Budgets vs Actual
    const currentMonthStr = endDate.slice(0, 7);
    const mStart = `${currentMonthStr}-01`;
    const mEnd = getMonthEndIso(endDate);

    const monthCatSpend: Record<string, number> = {};
    for (const tx of store.trackerTransactions) {
        if (
            tx.user_id === userId &&
            tx.type === 'EXPENSE' &&
            tx.transaction_date >= mStart &&
            tx.transaction_date <= mEnd
        ) {
            const c = tx.category_name || 'Other';
            monthCatSpend[c] = (monthCatSpend[c] || 0) + Number(tx.amount);
        }
    }

    const budgets = store.categoryBudgets.filter(
        b => b.user_id === userId && b.month === currentMonthStr
    );
    const budgetAnalytics = budgets
        .map(b => {
            const bAmt = Number(b.budget_amount);
            const actual = monthCatSpend[b.category_name] || 0;
            const remaining = Math.max(0, bAmt - actual);
            const overspent = Math.max(0, actual - bAmt);
            const pct = bAmt > 0 ? Math.round((actual / bAmt) * 1000) / 10 : 0;
            return {
                id: b.id,
                category_name: b.category_name,
                month: b.month,
                budget_amount: round2(bAmt),
                actual_spent: round2(actual),
                remaining_amount: round2(remaining),
                overspent_amount: round2(overspent),
                percentage: pct,
                is_overspent: overspent > 0,
            };
        })
        .sort((a, b) => b.percentage - a.percentage);

    res.status(200).json({
        trend: trendList,
        category_breakdown: categoryBreakdown,
        merchants: topMerchants,
        budgets: budgetAnalytics,
    });
});

// =============================================================================
// Subscriptions CRUD
// =============================================================================

router.get('/subscriptions', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const subs = store.trackerSubscriptions
        .filter(s => s.user_id === userId)
        .sort((a, b) => a.status.localeCompare(b.status) || b.amount - a.amount);

    let totalMonthly = 0;
    for (const s of subs) {
        if (s.status !== 'ACTIVE') continue;
        const amt = Number(s.amount);
        if (s.billing_cycle === 'YEARLY') totalMonthly += round2(amt / 12);
        else if (s.billing_cycle === 'QUARTERLY') totalMonthly += round2(amt / 3);
        else if (s.billing_cycle === 'WEEKLY') totalMonthly += round2(amt * 4.333);
        else totalMonthly += amt;
    }

    res.status(200).json({
        subscriptions: subs.map(serializeSubscription),
        total_monthly_cost: round2(totalMonthly),
    });
});

router.post('/subscriptions', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const data = req.body || {};
    const name = String(data.name || '').trim();
    if (!name) {
        res.status(400).json({ error: 'Subscription name is required' });
        return;
    }

    const amount = round2(Number(data.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than zero' });
        return;
    }

    const cycleRaw = String(data.billing_cycle || 'MONTHLY').toUpperCase();
    const billingCycle = (['MONTHLY', 'YEARLY', 'QUARTERLY', 'WEEKLY'].includes(cycleRaw)
        ? cycleRaw
        : 'MONTHLY') as TrackerSubscriptionRecord['billing_cycle'];

    const statusRaw = String(data.status || 'ACTIVE').toUpperCase();
    const status = (['ACTIVE', 'PAUSED', 'CANCELLED'].includes(statusRaw)
        ? statusRaw
        : 'ACTIVE') as TrackerSubscriptionRecord['status'];

    const sub: TrackerSubscriptionRecord = {
        id: store.nextId('trackerSubscriptions'),
        user_id: userId,
        name,
        category_name: String(data.category_name || 'Subscriptions'),
        amount,
        currency: 'INR',
        billing_cycle: billingCycle,
        next_renewal_date: isIsoDate(data.next_renewal_date) ? data.next_renewal_date : null,
        status,
        notes: String(data.notes || '').trim(),
        created_at: new Date().toISOString(),
    };
    store.trackerSubscriptions.push(sub);

    res.status(201).json({ subscription: serializeSubscription(sub) });
});

router.put('/subscriptions/:subId', requireAuth, (req: AuthenticatedRequest, res) => {
    const subId = Number(req.params.subId);
    const sub = store.trackerSubscriptions.find(s => s.id === subId && s.user_id === req.userId!);
    if (!sub) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
    }

    const data = req.body || {};
    if (typeof data.name === 'string' && data.name.trim()) sub.name = data.name.trim();
    if ('amount' in data) {
        const amt = round2(Number(data.amount));
        if (!Number.isFinite(amt) || amt <= 0) {
            res.status(400).json({ error: 'Invalid amount' });
            return;
        }
        sub.amount = amt;
    }
    if (typeof data.category_name === 'string') sub.category_name = data.category_name.trim();
    if (typeof data.billing_cycle === 'string') {
        sub.billing_cycle = data.billing_cycle.toUpperCase() as TrackerSubscriptionRecord['billing_cycle'];
    }
    if ('next_renewal_date' in data) {
        sub.next_renewal_date = isIsoDate(data.next_renewal_date) ? data.next_renewal_date : null;
    }
    if (typeof data.status === 'string') {
        sub.status = data.status.toUpperCase() as TrackerSubscriptionRecord['status'];
    }
    if ('notes' in data) sub.notes = String(data.notes || '').trim();

    res.status(200).json({ subscription: serializeSubscription(sub) });
});

router.delete('/subscriptions/:subId', requireAuth, (req: AuthenticatedRequest, res) => {
    const subId = Number(req.params.subId);
    const idx = store.trackerSubscriptions.findIndex(s => s.id === subId && s.user_id === req.userId!);
    if (idx === -1) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
    }
    store.trackerSubscriptions.splice(idx, 1);
    res.status(200).json({ success: true, message: 'Subscription deleted' });
});

// =============================================================================
// Budgets CRUD
// =============================================================================

router.get('/budgets', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const month = typeof req.query.month === 'string' && req.query.month
        ? req.query.month
        : todayIso().slice(0, 7);

    const budgets = store.categoryBudgets.filter(b => b.user_id === userId && b.month === month);
    res.status(200).json({ budgets: budgets.map(serializeBudget) });
});

router.post('/budgets', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const data = req.body || {};
    const categoryName = String(data.category_name || '').trim();
    const month = String(data.month || todayIso().slice(0, 7)).trim();

    if (!categoryName) {
        res.status(400).json({ error: 'Category name is required' });
        return;
    }

    const amount = round2(Number(data.budget_amount));
    if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: 'Budget amount must be greater than zero' });
        return;
    }

    const existing = store.categoryBudgets.find(
        b => b.user_id === userId && b.category_name === categoryName && b.month === month
    );
    if (existing) {
        existing.budget_amount = amount;
        res.status(200).json({ budget: serializeBudget(existing) });
        return;
    }

    const newBudget: CategoryBudgetRecord = {
        id: store.nextId('categoryBudgets'),
        user_id: userId,
        category_name: categoryName,
        month,
        budget_amount: amount,
        created_at: new Date().toISOString(),
    };
    store.categoryBudgets.push(newBudget);
    res.status(201).json({ budget: serializeBudget(newBudget) });
});

router.delete('/budgets/:bId', requireAuth, (req: AuthenticatedRequest, res) => {
    const bId = Number(req.params.bId);
    const idx = store.categoryBudgets.findIndex(b => b.id === bId && b.user_id === req.userId!);
    if (idx === -1) {
        res.status(404).json({ error: 'Budget not found' });
        return;
    }
    store.categoryBudgets.splice(idx, 1);
    res.status(200).json({ success: true, message: 'Budget removed' });
});

// =============================================================================
// Bill Upload & Confirmation Pipeline
// =============================================================================

router.post('/bills/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'No file uploaded in form data' });
        return;
    }

    const originalName = file.originalname || 'bill';
    const parts = originalName.split('.');
    if (parts.length < 2) {
        res.status(400).json({ error: 'File lacks an extension' });
        return;
    }
    const ext = parts[parts.length - 1].toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        res.status(400).json({
            error: `Unsupported file format '.${ext}'. Allowed formats: PDF, PNG, JPG, JPEG, WEBP`,
        });
        return;
    }

    const mime =
        file.mimetype ||
        (ext === 'pdf' ? 'application/pdf' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);

    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Attempt Gemini multimodal OCR extraction
    const geminiResult = await extractBillWithGemini(file.buffer, mime);
    const method =
        geminiResult && (geminiResult.amount != null || geminiResult.merchant != null)
            ? 'GEMINI_MULTIMODAL'
            : 'MANUAL_FALLBACK';

    const raw = geminiResult || {};
    const merchant = typeof raw.merchant === 'string' ? raw.merchant : '';
    const dateVal = isIsoDate(raw.date) ? raw.date : todayIso();
    const amountVal = Number.isFinite(Number(raw.amount)) && Number(raw.amount) > 0 ? round2(Number(raw.amount)) : 0;
    const taxVal = Number.isFinite(Number(raw.tax)) && Number(raw.tax) >= 0 ? round2(Number(raw.tax)) : 0;
    const currency = typeof raw.currency === 'string' && raw.currency ? raw.currency : 'INR';
    const invoiceNumber = typeof raw.invoice_number === 'string' ? raw.invoice_number : '';
    const suggestedCategory =
        typeof raw.suggested_category === 'string' && raw.suggested_category
            ? raw.suggested_category
            : 'Bills & Utilities';
    const lineItems = Array.isArray(raw.line_items) ? raw.line_items : [];
    const conf = (raw.confidence && typeof raw.confidence === 'object' ? raw.confidence : {}) as Record<string, number>;

    const uncertainFields: string[] = [];
    if (!merchant) uncertainFields.push('merchant');
    if (amountVal <= 0) uncertainFields.push('amount');
    if (!raw.date) uncertainFields.push('date');

    const extracted = {
        merchant,
        date: dateVal,
        amount: amountVal,
        tax: taxVal,
        currency,
        invoice_number: invoiceNumber,
        suggested_category: suggestedCategory,
        line_items: lineItems,
        confidence: {
            merchant: conf.merchant ?? (merchant ? 0.7 : 0.2),
            amount: conf.amount ?? (amountVal > 0 ? 0.9 : 0.2),
            date: conf.date ?? (raw.date ? 0.8 : 0.3),
            overall: conf.overall ?? (merchant && amountVal > 0 ? 0.8 : 0.4),
        },
        uncertain_fields: uncertainFields,
        extraction_method: method,
    };

    // Duplicate detection
    let isDuplicate = false;
    let duplicateReason = '';
    let matchInfo: Record<string, unknown> = {};

    const existingUpload = store.billUploads.find(b => b.user_id === userId && b.file_hash === fileHash);
    if (existingUpload) {
        isDuplicate = true;
        duplicateReason = `This document has already been uploaded previously (${existingUpload.original_filename}).`;
        matchInfo = {
            type: 'file_hash',
            upload_id: existingUpload.id,
            filename: existingUpload.original_filename,
            date: existingUpload.created_at.slice(0, 10),
        };
    } else if (amountVal > 0 && dateVal) {
        const matchingTx = store.trackerTransactions.find(
            t =>
                t.user_id === userId &&
                t.transaction_date === dateVal &&
                Math.abs(t.amount - amountVal) < 0.01 &&
                (!merchant || t.merchant.toLowerCase().includes(merchant.toLowerCase()))
        );
        if (matchingTx) {
            isDuplicate = true;
            duplicateReason = `A matching transaction of ₹${amountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} on ${dateVal} for '${matchingTx.merchant}' already exists.`;
            matchInfo = {
                type: 'transaction_match',
                transaction_id: matchingTx.id,
                merchant: matchingTx.merchant,
                amount: matchingTx.amount,
                date: matchingTx.transaction_date,
            };
        }
    }

    const uploadRec: BillUploadRecord = {
        id: store.nextId('billUploads'),
        user_id: userId,
        original_filename: originalName,
        stored_filename: `${crypto.randomUUID()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        file_size: file.size,
        mime_type: mime,
        file_hash: fileHash,
        file_buffer: file.buffer,
        status: 'EXTRACTED',
        extracted_data: JSON.stringify(extracted),
        created_at: new Date().toISOString(),
    };
    store.billUploads.push(uploadRec);

    res.status(200).json({
        upload_id: uploadRec.id,
        original_filename: originalName,
        extracted_data: extracted,
        duplicate_warning: {
            is_duplicate: isDuplicate,
            reason: duplicateReason,
            match_info: matchInfo,
        },
    });
});

router.get('/bills/:uploadId/file', (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
        res.status(401).json({ error: 'Missing authentication token' });
        return;
    }

    const userId = decodeAccessToken(token);
    if (!userId) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    const uploadId = Number(req.params.uploadId);
    const uploadRec = store.billUploads.find(b => b.id === uploadId && b.user_id === userId);
    if (!uploadRec) {
        res.status(404).json({ error: 'Bill upload not found or access denied' });
        return;
    }

    res.setHeader('Content-Type', uploadRec.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${uploadRec.original_filename}"`);
    res.status(200).send(uploadRec.file_buffer);
});

router.post('/bills/:uploadId/confirm', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const uploadId = Number(req.params.uploadId);
    const uploadRec = store.billUploads.find(b => b.id === uploadId && b.user_id === userId);
    if (!uploadRec) {
        res.status(404).json({ error: 'Bill upload not found or access denied' });
        return;
    }

    const data = req.body || {};
    const amount = round2(Number(data.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than zero' });
        return;
    }

    const categoryName = String(data.category_name || 'Bills & Utilities').trim();
    const merchant = String(data.merchant || '').trim();
    const txDate = isIsoDate(data.transaction_date) ? data.transaction_date : todayIso();
    const paymentMethod = String(data.payment_method || 'UPI').trim();
    const description = String(data.description || `Bill payment: ${uploadRec.original_filename}`).trim();

    let tagsStr = 'bill,receipt';
    if (Array.isArray(data.tags)) {
        tagsStr = data.tags
            .map((t: unknown) => String(t).trim())
            .filter(Boolean)
            .join(',');
    } else if (typeof data.tags === 'string') {
        tagsStr = data.tags;
    }

    const nowIso = new Date().toISOString();
    const tx: TrackerTransactionRecord = {
        id: store.nextId('trackerTransactions'),
        user_id: userId,
        type: 'EXPENSE',
        amount,
        currency: 'INR',
        category_name: categoryName,
        merchant,
        transaction_date: txDate,
        payment_method: paymentMethod,
        description,
        tags: tagsStr,
        receipt_filename: uploadRec.original_filename,
        bill_upload_id: uploadRec.id,
        is_subscription: Boolean(data.is_subscription),
        created_at: nowIso,
        updated_at: nowIso,
    };

    uploadRec.status = 'CONFIRMED';
    store.trackerTransactions.push(tx);

    res.status(201).json({
        message: 'Transaction confirmed and saved successfully',
        transaction: serializeTransaction(tx),
    });
});

// =============================================================================
// AstraMinds AI Tracker Spending Insights
// =============================================================================

router.post('/ai/insights', requireAuth, async (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const data = req.body || {};
    const today = todayIso();
    const firstOfMonth = `${today.slice(0, 7)}-01`;

    const startDate = isIsoDate(data.start_date) ? data.start_date : firstOfMonth;
    const endDate = isIsoDate(data.end_date) ? data.end_date : today;
    const customQuestion = String(data.question || '').trim();

    const txs = store.trackerTransactions.filter(
        t => t.user_id === userId && t.transaction_date >= startDate && t.transaction_date <= endDate
    );

    const totalExpense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);

    const catSpend: Record<string, number> = {};
    const merchantSpend: Record<string, number> = {};
    for (const t of txs) {
        if (t.type !== 'EXPENSE') continue;
        catSpend[t.category_name] = (catSpend[t.category_name] || 0) + Number(t.amount);
        const m = t.merchant || 'Other';
        merchantSpend[m] = (merchantSpend[m] || 0) + Number(t.amount);
    }

    const topCats = Object.entries(catSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const topMerchants = Object.entries(merchantSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const days = Math.max(1, daysBetweenIso(endDate, startDate) + 1);
    const dailyAvg = totalExpense / days;

    const subs = store.trackerSubscriptions.filter(s => s.user_id === userId && s.status === 'ACTIVE');
    const subCount = subs.length;
    const monthlySubCost = subs.reduce((s, x) => s + Number(x.amount), 0);

    const promptContext = [
        `User Period: ${startDate} to ${endDate} (${days} days)`,
        `- Total Expense: ₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `- Total Income: ₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `- Net Savings/Deficit: ₹${(totalIncome - totalExpense).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `- Daily Average Spending: ₹${dailyAvg.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/day`,
        `- Top Expense Categories: ${topCats.length > 0 ? topCats.map(([c, v]) => `${c}: ₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`).join(', ') : 'None'}`,
        `- Top Merchants: ${topMerchants.length > 0 ? topMerchants.map(([m, v]) => `${m}: ₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`).join(', ') : 'None'}`,
        `- Active Subscriptions: ${subCount} totaling ₹${monthlySubCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/month`,
    ].join('\n');

    const userQuery =
        customQuestion ||
        'Provide an analysis of my spending patterns with 3 specific, actionable recommendations to optimize my money.';

    let aiResponse = await generateTrackerInsights(promptContext, userQuery);

    if (!aiResponse) {
        if (totalExpense === 0) {
            aiResponse =
                "You haven't logged any spending for this period yet! Add your pocket money snacks, books, or games to unlock helpful money tips.";
        } else {
            const highlights: string[] = [];
            if (topCats.length > 0) {
                const [biggestCat, catAmt] = topCats[0];
                const pct = totalExpense > 0 ? (catAmt / totalExpense) * 100 : 0;
                highlights.push(
                    `**${biggestCat}** is your biggest spending category at ₹${catAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${pct.toFixed(1)}% of what you spent).`
                );
            }
            if (topMerchants.length > 0) {
                const [biggestM, mAmt] = topMerchants[0];
                highlights.push(
                    `You spent the most at **${biggestM}** (₹${mAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).`
                );
            }

            const tips = [
                `Set a monthly limit for **${topCats[0]?.[0] || 'Snacks & Treats'}** so your pocket money stretches further.`,
                'Try the 24-hour wait rule before buying treats or toys—move skipped cash straight to your savings goal!',
                'Log every rupee you get from pocket money, gifts, and chores so you always know how much is left.',
            ];

            aiResponse =
                '### Pocket Money Summary\n' +
                highlights.map(h => `- ${h}`).join('\n') +
                '\n\n### Smart Saving Tips\n' +
                tips.map((t, i) => `${i + 1}. ${t}`).join('\n');
        }
    }

    res.status(200).json({
        analysis: aiResponse,
        metrics_analyzed: {
            total_expense: round2(totalExpense),
            total_income: round2(totalIncome),
            daily_average: round2(dailyAvg),
            top_category: topCats[0]?.[0] || null,
            period_days: days,
        },
    });
});

export default router;
