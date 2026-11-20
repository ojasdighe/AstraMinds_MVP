import crypto from 'node:crypto';
import { Router } from 'express';
import {
    store,
    todayIso,
    type SplitRoomRecord,
    type SplitExpenseRecord,
    type SplitSettlementPaymentRecord,
    type SplitActivityRecord,
    type UserRecord,
} from '../store.js';
import { requireAuth, type AuthenticatedRequest } from '../authMiddleware.js';

const router = Router();

const CATEGORY_COLORS: Record<string, string> = {
    Accommodation: '#8B5CF6',
    'Food & Drinks': '#F59E0B',
    Transport: '#3B82F6',
    Fuel: '#EF4444',
    Shopping: '#EC4899',
    'Activities & Tickets': '#10B981',
    Groceries: '#14B8A6',
    Bills: '#6366F1',
    Other: '#6B7280',
};

function toCents(val: unknown): number {
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
}

function fromCents(cents: number): number {
    return Math.round(cents) / 100;
}

function isIsoDate(val: unknown): val is string {
    return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
}

function generateUniqueRoomCode(): string {
    for (let i = 0; i < 20; i++) {
        const code = crypto.randomBytes(3).toString('hex').toUpperCase();
        if (!store.splitRooms.some(r => r.code === code)) {
            return code;
        }
    }
    throw new Error('Failed to generate a unique room code. Please try again.');
}

function getMembership(roomId: number, userId: number) {
    return store.splitMembers.find(m => m.room_id === roomId && m.user_id === userId) || null;
}

function serializeRoom(room: SplitRoomRecord, currentUserId?: number) {
    const members = store.splitMembers.filter(m => m.room_id === room.id);
    const membership = currentUserId ? members.find(m => m.user_id === currentUserId) : undefined;
    const validExpenses = store.splitExpenses.filter(e => e.room_id === room.id && !e.is_deleted);
    const totalSpent = validExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
        id: room.id,
        code: room.code,
        name: room.name,
        description: room.description || '',
        currency: room.currency,
        icon: room.icon || 'Users',
        start_date: room.start_date,
        end_date: room.end_date,
        created_by: room.created_by,
        is_settled: room.is_settled,
        created_at: room.created_at,
        updated_at: room.updated_at,
        member_count: members.length,
        total_spent: fromCents(toCents(totalSpent)),
        user_role: membership ? membership.role : null,
    };
}

function serializeMember(m: (typeof store.splitMembers)[number]) {
    const user = store.users.find(u => u.id === m.user_id);
    return {
        id: m.id,
        room_id: m.room_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        user: {
            id: user ? user.id : m.user_id,
            full_name: user ? user.full_name : `User #${m.user_id}`,
            email: user ? user.email : '',
            avatar: user?.avatar || '/game_avatar.png',
        },
    };
}

function serializeExpense(exp: SplitExpenseRecord) {
    const creator = exp.created_by ? store.users.find(u => u.id === exp.created_by) : null;
    return {
        id: exp.id,
        room_id: exp.room_id,
        title: exp.title,
        amount: fromCents(toCents(exp.amount)),
        category: exp.category,
        expense_date: exp.expense_date,
        notes: exp.notes || '',
        split_method: exp.split_method,
        created_by: exp.created_by,
        creator: {
            id: creator ? creator.id : exp.created_by,
            full_name: creator ? creator.full_name : `User #${exp.created_by}`,
            avatar: creator?.avatar || '/game_avatar.png',
        },
        created_at: exp.created_at,
        updated_at: exp.updated_at,
        payers: exp.payers.map(p => {
            const pu = store.users.find(u => u.id === p.user_id);
            return {
                id: p.id,
                expense_id: p.expense_id,
                user_id: p.user_id,
                amount_paid: fromCents(toCents(p.amount_paid)),
                user_name: pu ? pu.full_name : `User #${p.user_id}`,
                user_avatar: pu?.avatar || '/game_avatar.png',
            };
        }),
        shares: exp.shares.map(s => {
            const su = store.users.find(u => u.id === s.user_id);
            return {
                id: s.id,
                expense_id: s.expense_id,
                user_id: s.user_id,
                share_amount: fromCents(toCents(s.share_amount)),
                raw_value: s.raw_value,
                user_name: su ? su.full_name : `User #${s.user_id}`,
                user_avatar: su?.avatar || '/game_avatar.png',
            };
        }),
    };
}

function serializePayment(p: SplitSettlementPaymentRecord) {
    const payer = store.users.find(u => u.id === p.payer_id);
    const recipient = store.users.find(u => u.id === p.recipient_id);
    const creator = store.users.find(u => u.id === p.created_by);

    return {
        id: p.id,
        room_id: p.room_id,
        payer_id: p.payer_id,
        recipient_id: p.recipient_id,
        created_by: p.created_by,
        amount: fromCents(toCents(p.amount)),
        status: p.status,
        notes: p.notes || '',
        created_at: p.created_at,
        confirmed_at: p.confirmed_at,
        payer: {
            id: p.payer_id,
            full_name: payer ? payer.full_name : `User #${p.payer_id}`,
            avatar: payer?.avatar || '/game_avatar.png',
        },
        recipient: {
            id: p.recipient_id,
            full_name: recipient ? recipient.full_name : `User #${p.recipient_id}`,
            avatar: recipient?.avatar || '/game_avatar.png',
        },
        creator: {
            id: p.created_by,
            full_name: creator ? creator.full_name : `User #${p.created_by}`,
            avatar: creator?.avatar || '/game_avatar.png',
        },
    };
}

function serializeActivity(a: SplitActivityRecord) {
    const user = a.user_id ? store.users.find(u => u.id === a.user_id) : null;
    return {
        id: a.id,
        room_id: a.room_id,
        user_id: a.user_id,
        activity_type: a.activity_type,
        description: a.description,
        metadata_json: a.metadata_json,
        created_at: a.created_at,
        user: a.user_id
            ? {
                  id: user ? user.id : a.user_id,
                  full_name: user ? user.full_name : `User #${a.user_id}`,
                  avatar: user?.avatar || '/game_avatar.png',
              }
            : null,
    };
}

interface ShareInput {
    user_id: number;
    amount?: number;
    percentage?: number;
    shares?: number;
}

function calculateShares(
    totalCents: number,
    splitMethod: string,
    participants: ShareInput[]
): Array<{ user_id: number; share_amount: number; raw_value: number | null }> {
    if (!participants || participants.length === 0) {
        throw new Error('At least one participant must be selected for the expense.');
    }
    if (totalCents <= 0) {
        throw new Error('Expense amount must be greater than zero.');
    }

    const n = participants.length;
    const method = splitMethod.toUpperCase();

    if (method === 'EQUAL') {
        const baseCents = Math.floor(totalCents / n);
        const remainder = totalCents - baseCents * n;
        return participants.map((p, i) => ({
            user_id: p.user_id,
            share_amount: fromCents(baseCents + (i < remainder ? 1 : 0)),
            raw_value: null,
        }));
    }

    if (method === 'EXACT' || method === 'UNEQUAL') {
        let runningCents = 0;
        const list = participants.map(p => {
            const cents = toCents(p.amount ?? 0);
            if (cents < 0) throw new Error('Participant shares cannot be negative.');
            runningCents += cents;
            return { user_id: p.user_id, cents };
        });

        if (Math.abs(runningCents - totalCents) > 1) {
            const diff = fromCents(totalCents - runningCents);
            throw new Error(
                `Custom shares total (₹${fromCents(runningCents).toFixed(2)}) does not match expense total (₹${fromCents(totalCents).toFixed(2)}). Difference: ₹${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`
            );
        }

        if (runningCents !== totalCents && list.length > 0) {
            list[0].cents += totalCents - runningCents;
        }

        return list.map(item => ({
            user_id: item.user_id,
            share_amount: fromCents(item.cents),
            raw_value: null,
        }));
    }

    if (method === 'PERCENTAGE') {
        let totalPct = 0;
        const pctList = participants.map(p => {
            const pct = Number(p.percentage ?? 0);
            if (!Number.isFinite(pct) || pct < 0) {
                throw new Error('Percentages cannot be negative.');
            }
            totalPct += pct;
            return { user_id: p.user_id, pct };
        });

        if (Math.abs(totalPct - 100) > 0.05) {
            throw new Error(`Percentages must total 100%. Current total: ${totalPct.toFixed(2)}%`);
        }

        let allocatedCents = 0;
        const result = pctList.map(item => {
            const cents = Math.floor((totalCents * item.pct) / 100);
            allocatedCents += cents;
            return { user_id: item.user_id, cents, raw_value: item.pct };
        });

        const remainder = totalCents - allocatedCents;
        for (let i = 0; i < Math.min(remainder, result.length); i++) {
            result[i].cents += 1;
        }

        return result.map(item => ({
            user_id: item.user_id,
            share_amount: fromCents(item.cents),
            raw_value: item.raw_value,
        }));
    }

    if (method === 'SHARES' || method === 'RATIO') {
        let totalShares = 0;
        const sharesList = participants.map(p => {
            const s = Number(p.shares ?? 1);
            if (!Number.isFinite(s) || s <= 0) {
                throw new Error('Share counts must be positive numbers.');
            }
            totalShares += s;
            return { user_id: p.user_id, s };
        });

        if (totalShares <= 0) {
            throw new Error('Total shares must be greater than zero.');
        }

        let allocatedCents = 0;
        const result = sharesList.map(item => {
            const cents = Math.floor((totalCents * item.s) / totalShares);
            allocatedCents += cents;
            return { user_id: item.user_id, cents, raw_value: item.s };
        });

        const remainder = totalCents - allocatedCents;
        for (let i = 0; i < Math.min(remainder, result.length); i++) {
            result[i].cents += 1;
        }

        return result.map(item => ({
            user_id: item.user_id,
            share_amount: fromCents(item.cents),
            raw_value: item.raw_value,
        }));
    }

    throw new Error(`Unknown split method: ${splitMethod}`);
}

function simplifySettlements(
    balancesCentsMap: Map<number, number>,
    usersMap: Map<number, UserRecord>
) {
    const debtors: Array<{ user_id: number; cents: number }> = [];
    const creditors: Array<{ user_id: number; cents: number }> = [];

    for (const [uid, balCents] of balancesCentsMap.entries()) {
        if (balCents < 0) debtors.push({ user_id: uid, cents: Math.abs(balCents) });
        else if (balCents > 0) creditors.push({ user_id: uid, cents: balCents });
    }

    debtors.sort((a, b) => b.cents - a.cents);
    creditors.sort((a, b) => b.cents - a.cents);

    const suggestions: Array<{
        from_user_id: number;
        from_user_name: string;
        from_user_avatar: string;
        to_user_id: number;
        to_user_name: string;
        to_user_avatar: string;
        amount: number;
        amount_cents: number;
    }> = [];

    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
        const d = debtors[i];
        const c = creditors[j];
        const transferCents = Math.min(d.cents, c.cents);

        if (transferCents > 0) {
            const dUser = usersMap.get(d.user_id);
            const cUser = usersMap.get(c.user_id);
            suggestions.push({
                from_user_id: d.user_id,
                from_user_name: dUser ? dUser.full_name : `User #${d.user_id}`,
                from_user_avatar: dUser?.avatar || '/game_avatar.png',
                to_user_id: c.user_id,
                to_user_name: cUser ? cUser.full_name : `User #${c.user_id}`,
                to_user_avatar: cUser?.avatar || '/game_avatar.png',
                amount: fromCents(transferCents),
                amount_cents: transferCents,
            });
        }

        d.cents -= transferCents;
        c.cents -= transferCents;
        if (d.cents <= 0) i++;
        if (c.cents <= 0) j++;
    }

    return suggestions;
}

function computeRoomFinancials(roomId: number) {
    const room = store.splitRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    const members = store.splitMembers.filter(m => m.room_id === roomId);
    const userIds = members.map(m => m.user_id);
    const usersMap = new Map<number, UserRecord>();
    for (const m of members) {
        const u = store.users.find(x => x.id === m.user_id);
        if (u) usersMap.set(m.user_id, u);
    }

    const expenses = store.splitExpenses.filter(e => e.room_id === roomId && !e.is_deleted);
    const totalSpentCents = expenses.reduce((sum, e) => sum + toCents(e.amount), 0);

    const totalPaidMap = new Map<number, number>();
    const totalShareMap = new Map<number, number>();
    for (const uid of userIds) {
        totalPaidMap.set(uid, 0);
        totalShareMap.set(uid, 0);
    }

    for (const exp of expenses) {
        for (const p of exp.payers) {
            if (totalPaidMap.has(p.user_id)) {
                totalPaidMap.set(p.user_id, totalPaidMap.get(p.user_id)! + toCents(p.amount_paid));
            }
        }
        for (const s of exp.shares) {
            if (totalShareMap.has(s.user_id)) {
                totalShareMap.set(s.user_id, totalShareMap.get(s.user_id)! + toCents(s.share_amount));
            }
        }
    }

    const netExpenseBalanceMap = new Map<number, number>();
    for (const uid of userIds) {
        netExpenseBalanceMap.set(uid, totalPaidMap.get(uid)! - totalShareMap.get(uid)!);
    }

    const payments = store.splitSettlementPayments
        .filter(p => p.room_id === roomId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);

    const confirmedSentMap = new Map<number, number>();
    const confirmedRecvMap = new Map<number, number>();
    const pendingSentMap = new Map<number, number>();
    const pendingRecvMap = new Map<number, number>();
    const pairwiseConfirmed = new Map<string, number>();
    const pairwiseReported = new Map<string, number>();

    for (const uid of userIds) {
        confirmedSentMap.set(uid, 0);
        confirmedRecvMap.set(uid, 0);
        pendingSentMap.set(uid, 0);
        pendingRecvMap.set(uid, 0);
    }

    for (const p of payments) {
        const cents = toCents(p.amount);
        const key = `${p.payer_id}:${p.recipient_id}`;

        if (p.status === 'CONFIRMED') {
            if (confirmedSentMap.has(p.payer_id)) {
                confirmedSentMap.set(p.payer_id, confirmedSentMap.get(p.payer_id)! + cents);
            }
            if (confirmedRecvMap.has(p.recipient_id)) {
                confirmedRecvMap.set(p.recipient_id, confirmedRecvMap.get(p.recipient_id)! + cents);
            }
            pairwiseConfirmed.set(key, (pairwiseConfirmed.get(key) || 0) + cents);
        } else if (p.status === 'REPORTED') {
            if (pendingSentMap.has(p.payer_id)) {
                pendingSentMap.set(p.payer_id, pendingSentMap.get(p.payer_id)! + cents);
            }
            if (pendingRecvMap.has(p.recipient_id)) {
                pendingRecvMap.set(p.recipient_id, pendingRecvMap.get(p.recipient_id)! + cents);
            }
            pairwiseReported.set(key, (pairwiseReported.get(key) || 0) + cents);
        }
    }

    const outstandingBalanceMap = new Map<number, number>();
    for (const uid of userIds) {
        outstandingBalanceMap.set(
            uid,
            netExpenseBalanceMap.get(uid)! + confirmedSentMap.get(uid)! - confirmedRecvMap.get(uid)!
        );
    }

    const rawSuggestions = simplifySettlements(outstandingBalanceMap, usersMap);
    const settlementPlan = rawSuggestions.map(sug => {
        const key = `${sug.from_user_id}:${sug.to_user_id}`;
        const confirmedCents = pairwiseConfirmed.get(key) || 0;
        const reportedCents = pairwiseReported.get(key) || 0;

        let status = 'PENDING';
        if (sug.amount_cents <= 0) status = 'SETTLED';
        else if (reportedCents > 0) status = 'REPORTED';
        else if (confirmedCents > 0) status = 'PARTIALLY_PAID';

        return {
            from_user_id: sug.from_user_id,
            from_user_name: sug.from_user_name,
            from_user_avatar: sug.from_user_avatar,
            to_user_id: sug.to_user_id,
            to_user_name: sug.to_user_name,
            to_user_avatar: sug.to_user_avatar,
            amount: sug.amount,
            confirmed_paid: fromCents(confirmedCents),
            pending_reported: fromCents(reportedCents),
            status,
        };
    });

    let totalPositiveDebtCents = 0;
    const membersBalances = members.map(m => {
        const uid = m.user_id;
        const user = usersMap.get(uid);
        const outCents = outstandingBalanceMap.get(uid) || 0;
        const outFloat = fromCents(outCents);

        let statusLabel = 'Settled';
        let statusType = 'SETTLED';
        if (outCents < 0) {
            totalPositiveDebtCents += Math.abs(outCents);
            statusLabel = `Owes ₹${Math.abs(outFloat).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            statusType = 'OWES';
        } else if (outCents > 0) {
            statusLabel = `Is owed ₹${outFloat.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            statusType = 'IS_OWED';
        }

        return {
            user_id: uid,
            user_name: user ? user.full_name : `User #${uid}`,
            user_email: user ? user.email : '',
            user_avatar: user?.avatar || '/game_avatar.png',
            role: m.role,
            total_paid: fromCents(totalPaidMap.get(uid) || 0),
            total_share: fromCents(totalShareMap.get(uid) || 0),
            net_expense_balance: fromCents(netExpenseBalanceMap.get(uid) || 0),
            confirmed_sent: fromCents(confirmedSentMap.get(uid) || 0),
            confirmed_received: fromCents(confirmedRecvMap.get(uid) || 0),
            pending_sent: fromCents(pendingSentMap.get(uid) || 0),
            pending_received: fromCents(pendingRecvMap.get(uid) || 0),
            outstanding_balance: outFloat,
            status_label: statusLabel,
            status_type: statusType,
        };
    });

    const totalSettledCents = payments
        .filter(p => p.status === 'CONFIRMED')
        .reduce((sum, p) => sum + toCents(p.amount), 0);

    const isFullySettled = totalPositiveDebtCents <= 0;
    const totalDebtVolumeCents = totalSettledCents + totalPositiveDebtCents;
    let progressPct = 0;
    if (isFullySettled) {
        progressPct = 100;
    } else if (totalDebtVolumeCents > 0) {
        const rawPct = Math.round((totalSettledCents / totalDebtVolumeCents) * 1000) / 10;
        progressPct = Math.min(99, Math.max(0, rawPct));
    }

    if (room.is_settled !== isFullySettled) {
        room.is_settled = isFullySettled;
    }

    return {
        total_spent: fromCents(totalSpentCents),
        expenses_count: expenses.length,
        members_count: members.length,
        total_outstanding_debt: fromCents(totalPositiveDebtCents),
        total_settled_amount: fromCents(totalSettledCents),
        settlement_progress_percentage: Math.round(progressPct * 10) / 10,
        is_fully_settled: isFullySettled,
        members_balances: membersBalances,
        settlement_plan: settlementPlan,
        payments: payments.map(serializePayment),
    };
}

// =============================================================================
// Rooms Endpoints
// =============================================================================

router.get('/rooms', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomIds = new Set(store.splitMembers.filter(m => m.user_id === user.id).map(m => m.room_id));
    if (roomIds.size === 0) {
        res.status(200).json({ rooms: [] });
        return;
    }

    const statusFilter = String(req.query.status || 'all').toLowerCase();
    let rooms = store.splitRooms.filter(r => roomIds.has(r.id));
    if (statusFilter === 'active') rooms = rooms.filter(r => !r.is_settled);
    else if (statusFilter === 'settled') rooms = rooms.filter(r => r.is_settled);

    rooms.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    const results = rooms.map(r => {
        const base = serializeRoom(r, user.id);
        try {
            const fin = computeRoomFinancials(r.id);
            const userBalance = fin.members_balances.find(mb => mb.user_id === user.id);
            return {
                ...base,
                user_outstanding: userBalance ? userBalance.outstanding_balance : 0,
                user_status_label: userBalance ? userBalance.status_label : 'Settled',
                user_status_type: userBalance ? userBalance.status_type : 'SETTLED',
                settlement_progress: fin.settlement_progress_percentage,
                is_fully_settled: fin.is_fully_settled,
            };
        } catch {
            return {
                ...base,
                user_outstanding: 0,
                user_status_label: 'Settled',
                user_status_type: 'SETTLED',
                settlement_progress: r.is_settled ? 100 : 0,
                is_fully_settled: r.is_settled,
            };
        }
    });

    res.status(200).json({ rooms: results });
});

router.post('/rooms', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const data = req.body || {};
    const name = String(data.name || '').trim();
    if (!name) {
        res.status(400).json({ error: 'Room name is required' });
        return;
    }

    const code = generateUniqueRoomCode();
    const nowIso = new Date().toISOString();

    const room: SplitRoomRecord = {
        id: store.nextId('splitRooms'),
        code,
        name,
        description: String(data.description || '').trim() || null,
        currency: String(data.currency || 'INR').trim().toUpperCase(),
        icon: String(data.icon || 'Users').trim(),
        start_date: isIsoDate(data.start_date) ? data.start_date : null,
        end_date: isIsoDate(data.end_date) ? data.end_date : null,
        created_by: user.id,
        is_settled: true,
        created_at: nowIso,
        updated_at: nowIso,
    };
    store.splitRooms.push(room);

    store.splitMembers.push({
        id: store.nextId('splitMembers'),
        room_id: room.id,
        user_id: user.id,
        role: 'owner',
        joined_at: nowIso,
    });

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: room.id,
        user_id: user.id,
        activity_type: 'ROOM_CREATED',
        description: `${user.full_name} created the room '${name}'`,
        metadata_json: null,
        created_at: nowIso,
    });

    res.status(201).json({
        message: 'Room created successfully',
        room: serializeRoom(room, user.id),
    });
});

router.post('/rooms/join', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const rawCode = String(req.body?.code || '').trim().toUpperCase();

    if (!rawCode) {
        res.status(400).json({ error: 'Room code is required' });
        return;
    }
    if (!/^[0-9A-F]{6}$/.test(rawCode)) {
        res.status(400).json({
            error: 'Invalid room code. Code must be exactly 6 hexadecimal characters (0-9, A-F)',
        });
        return;
    }

    const room = store.splitRooms.find(r => r.code === rawCode);
    if (!room) {
        res.status(404).json({ error: 'No room found with this code. Please check and try again.' });
        return;
    }

    const existing = getMembership(room.id, user.id);
    if (existing) {
        res.status(200).json({
            message: 'You are already a member of this room',
            room: serializeRoom(room, user.id),
            already_member: true,
        });
        return;
    }

    const nowIso = new Date().toISOString();
    store.splitMembers.push({
        id: store.nextId('splitMembers'),
        room_id: room.id,
        user_id: user.id,
        role: 'member',
        joined_at: nowIso,
    });

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: room.id,
        user_id: user.id,
        activity_type: 'MEMBER_JOINED',
        description: `${user.full_name} joined the room`,
        metadata_json: null,
        created_at: nowIso,
    });

    res.status(200).json({
        message: `Joined '${room.name}' successfully`,
        room: serializeRoom(room, user.id),
        already_member: false,
    });
});

router.get('/rooms/:roomId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);

    if (!getMembership(roomId, user.id)) {
        res.status(403).json({ error: 'Access denied. You are not a member of this room.' });
        return;
    }

    const room = store.splitRooms.find(r => r.id === roomId);
    if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }

    const financials = computeRoomFinancials(roomId);
    const members = store.splitMembers.filter(m => m.room_id === roomId).map(serializeMember);

    res.status(200).json({
        room: serializeRoom(room, user.id),
        members,
        financials,
    });
});

router.put('/rooms/:roomId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);

    const membership = getMembership(roomId, user.id);
    if (!membership || membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the room owner can modify room settings' });
        return;
    }

    const room = store.splitRooms.find(r => r.id === roomId);
    if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }

    const data = req.body || {};
    if (typeof data.name === 'string' && data.name.trim()) room.name = data.name.trim();
    if ('description' in data) room.description = data.description ? String(data.description).trim() : null;
    if (typeof data.icon === 'string') room.icon = data.icon.trim();
    if ('start_date' in data) room.start_date = isIsoDate(data.start_date) ? data.start_date : null;
    if ('end_date' in data) room.end_date = isIsoDate(data.end_date) ? data.end_date : null;
    room.updated_at = new Date().toISOString();

    res.status(200).json({
        message: 'Room updated successfully',
        room: serializeRoom(room, user.id),
    });
});

router.delete('/rooms/:roomId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);

    const membership = getMembership(roomId, user.id);
    if (!membership || membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the room owner can delete this room' });
        return;
    }

    const idx = store.splitRooms.findIndex(r => r.id === roomId);
    if (idx === -1) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }

    store.splitRooms.splice(idx, 1);
    store.splitMembers = store.splitMembers.filter(m => m.room_id !== roomId);
    store.splitExpenses = store.splitExpenses.filter(e => e.room_id !== roomId);
    store.splitSettlementPayments = store.splitSettlementPayments.filter(p => p.room_id !== roomId);
    store.splitActivities = store.splitActivities.filter(a => a.room_id !== roomId);

    res.status(200).json({ message: 'Room deleted successfully' });
});

router.post('/rooms/:roomId/leave', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);

    const membership = getMembership(roomId, user.id);
    if (!membership) {
        res.status(400).json({ error: 'You are not a member of this room' });
        return;
    }

    const room = store.splitRooms.find(r => r.id === roomId);
    if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }

    const fin = computeRoomFinancials(roomId);
    const userBal = fin.members_balances.find(mb => mb.user_id === user.id);
    if (userBal && Math.abs(userBal.outstanding_balance) > 0.005) {
        const balStr = `₹${Math.abs(userBal.outstanding_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        if (userBal.outstanding_balance < 0) {
            res.status(400).json({
                error: `Cannot leave room: you have an outstanding debt of ${balStr}. Settle debts first.`,
            });
            return;
        }
        res.status(400).json({
            error: `Cannot leave room: you are owed ${balStr}. Collect settlements first.`,
        });
        return;
    }

    const roomMembers = store.splitMembers.filter(m => m.room_id === roomId);
    if (membership.role === 'owner' && roomMembers.length > 1) {
        const nextMember = roomMembers.find(m => m.user_id !== user.id);
        if (nextMember) nextMember.role = 'owner';
    }

    store.splitMembers = store.splitMembers.filter(m => m.id !== membership.id);
    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: room.id,
        user_id: user.id,
        activity_type: 'MEMBER_LEFT',
        description: `${user.full_name} left the room`,
        metadata_json: null,
        created_at: new Date().toISOString(),
    });

    res.status(200).json({ message: 'You have left the room' });
});

// =============================================================================
// Members Endpoints
// =============================================================================

router.get('/rooms/:roomId/members', requireAuth, (req: AuthenticatedRequest, res) => {
    const roomId = Number(req.params.roomId);
    if (!getMembership(roomId, req.userId!)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const fin = computeRoomFinancials(roomId);
    res.status(200).json({ members: fin.members_balances });
});

router.delete('/rooms/:roomId/members/:targetUserId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);
    const targetUserId = Number(req.params.targetUserId);

    const membership = getMembership(roomId, user.id);
    if (!membership || membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the room owner can remove members' });
        return;
    }

    const targetMembership = getMembership(roomId, targetUserId);
    if (!targetMembership) {
        res.status(404).json({ error: 'Member not found in this room' });
        return;
    }

    const fin = computeRoomFinancials(roomId);
    const targetBal = fin.members_balances.find(mb => mb.user_id === targetUserId);
    if (targetBal && Math.abs(targetBal.outstanding_balance) > 0.005) {
        res.status(400).json({
            error: `Cannot remove member: ${targetBal.user_name} has an unsettled balance of ₹${Math.abs(targetBal.outstanding_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
        });
        return;
    }

    const targetUser = store.users.find(u => u.id === targetUserId);
    const targetName = targetUser ? targetUser.full_name : `User #${targetUserId}`;

    store.splitMembers = store.splitMembers.filter(m => m.id !== targetMembership.id);
    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: roomId,
        user_id: user.id,
        activity_type: 'MEMBER_REMOVED',
        description: `${user.full_name} removed ${targetName} from the room`,
        metadata_json: null,
        created_at: new Date().toISOString(),
    });

    res.status(200).json({ message: `Member ${targetName} removed successfully` });
});

// =============================================================================
// Expenses Endpoints
// =============================================================================

router.get('/rooms/:roomId/expenses', requireAuth, (req: AuthenticatedRequest, res) => {
    const roomId = Number(req.params.roomId);
    if (!getMembership(roomId, req.userId!)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    let expenses = store.splitExpenses.filter(e => e.room_id === roomId && !e.is_deleted);

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    if (search) {
        expenses = expenses.filter(e => e.title.toLowerCase().includes(search));
    }

    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    if (category && category !== 'All') {
        expenses = expenses.filter(e => e.category === category);
    }

    if (typeof req.query.payer_id === 'string' && /^\d+$/.test(req.query.payer_id)) {
        const pUid = Number(req.query.payer_id);
        expenses = expenses.filter(e => e.payers.some(p => p.user_id === pUid));
    }

    if (isIsoDate(req.query.start_date)) {
        const sd = req.query.start_date;
        expenses = expenses.filter(e => e.expense_date >= sd);
    }
    if (isIsoDate(req.query.end_date)) {
        const ed = req.query.end_date;
        expenses = expenses.filter(e => e.expense_date <= ed);
    }

    const sortBy = String(req.query.sort_by || 'newest');
    expenses.sort((a, b) => {
        if (sortBy === 'oldest') return a.expense_date.localeCompare(b.expense_date) || a.id - b.id;
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return b.expense_date.localeCompare(a.expense_date) || b.id - a.id;
    });

    res.status(200).json({ expenses: expenses.map(serializeExpense) });
});

router.post('/rooms/:roomId/expenses', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);

    if (!getMembership(roomId, user.id)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const data = req.body || {};
    const title = String(data.title || '').trim();
    if (!title) {
        res.status(400).json({ error: 'Expense title is required' });
        return;
    }

    const totalCents = toCents(data.amount);
    if (totalCents <= 0) {
        res.status(400).json({ error: 'Amount must be greater than zero' });
        return;
    }

    const category = String(data.category || 'Other').trim();
    const splitMethod = String(data.split_method || 'EQUAL').trim().toUpperCase();
    const notes = String(data.notes || '').trim();
    const expenseDate = isIsoDate(data.expense_date) ? data.expense_date : todayIso();

    const roomMembers = store.splitMembers.filter(m => m.room_id === roomId);
    const validMemberIds = new Set(roomMembers.map(m => m.user_id));

    const payersInput =
        Array.isArray(data.payers) && data.payers.length > 0
            ? data.payers
            : [{ user_id: user.id, amount_paid: fromCents(totalCents) }];

    const processedPayers: Array<{ user_id: number; amount_paid: number }> = [];
    let payerCentsSum = 0;

    for (const p of payersInput) {
        const pUid = Number(p.user_id);
        if (!validMemberIds.has(pUid)) {
            res.status(400).json({ error: `Payer user ID ${p.user_id} is not a member of this room` });
            return;
        }
        const pCents = toCents(p.amount_paid);
        if (pCents < 0) {
            res.status(400).json({ error: 'Payer amount cannot be negative' });
            return;
        }
        payerCentsSum += pCents;
        processedPayers.push({ user_id: pUid, amount_paid: fromCents(pCents) });
    }

    if (Math.abs(payerCentsSum - totalCents) > 1) {
        res.status(400).json({
            error: `Total paid by payers (₹${fromCents(payerCentsSum).toFixed(2)}) does not match expense amount (₹${fromCents(totalCents).toFixed(2)}).`,
        });
        return;
    }

    const participantsInput: ShareInput[] =
        Array.isArray(data.participants) && data.participants.length > 0
            ? data.participants
            : roomMembers.map(m => ({ user_id: m.user_id }));

    for (const p of participantsInput) {
        if (!validMemberIds.has(Number(p.user_id))) {
            res.status(400).json({ error: `Participant user ID ${p.user_id} is not a room member` });
            return;
        }
    }

    let calculatedShares: Array<{ user_id: number; share_amount: number; raw_value: number | null }>;
    try {
        calculatedShares = calculateShares(totalCents, splitMethod, participantsInput);
    } catch (err: any) {
        res.status(400).json({ error: err?.message || 'Invalid split configuration' });
        return;
    }

    const nowIso = new Date().toISOString();
    const expenseId = store.nextId('splitExpenses');

    const expense: SplitExpenseRecord = {
        id: expenseId,
        room_id: roomId,
        created_by: user.id,
        title,
        amount: fromCents(totalCents),
        category,
        expense_date: expenseDate,
        notes: notes || null,
        split_method: splitMethod,
        is_deleted: false,
        created_at: nowIso,
        updated_at: nowIso,
        payers: processedPayers.map(pp => ({
            id: store.nextId('splitPayers'),
            expense_id: expenseId,
            user_id: pp.user_id,
            amount_paid: pp.amount_paid,
        })),
        shares: calculatedShares.map(cs => ({
            id: store.nextId('splitShares'),
            expense_id: expenseId,
            user_id: cs.user_id,
            share_amount: cs.share_amount,
            raw_value: cs.raw_value,
        })),
    };
    store.splitExpenses.push(expense);

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: roomId,
        user_id: user.id,
        activity_type: 'EXPENSE_ADDED',
        description: `${user.full_name} added expense '${title}' for ₹${fromCents(totalCents).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        metadata_json: null,
        created_at: nowIso,
    });

    const room = store.splitRooms.find(r => r.id === roomId);
    if (room) room.updated_at = nowIso;

    res.status(201).json({
        message: 'Expense recorded successfully',
        expense: serializeExpense(expense),
    });
});

router.get('/rooms/:roomId/expenses/:expenseId', requireAuth, (req: AuthenticatedRequest, res) => {
    const roomId = Number(req.params.roomId);
    const expenseId = Number(req.params.expenseId);

    if (!getMembership(roomId, req.userId!)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const expense = store.splitExpenses.find(
        e => e.id === expenseId && e.room_id === roomId && !e.is_deleted
    );
    if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
    }

    res.status(200).json({ expense: serializeExpense(expense) });
});

router.put('/rooms/:roomId/expenses/:expenseId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);
    const expenseId = Number(req.params.expenseId);

    const membership = getMembership(roomId, user.id);
    if (!membership) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const expense = store.splitExpenses.find(
        e => e.id === expenseId && e.room_id === roomId && !e.is_deleted
    );
    if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
    }

    if (expense.created_by !== user.id && membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the expense creator or room owner can edit this expense' });
        return;
    }

    const data = req.body || {};
    const title = String(data.title || expense.title).trim();
    const totalCents = 'amount' in data ? toCents(data.amount) : toCents(expense.amount);
    if (totalCents <= 0) {
        res.status(400).json({ error: 'Amount must be greater than zero' });
        return;
    }

    const category = String(data.category || expense.category).trim();
    const splitMethod = String(data.split_method || expense.split_method).trim().toUpperCase();
    const notes = 'notes' in data ? (data.notes ? String(data.notes).trim() : null) : expense.notes;
    const expenseDate = isIsoDate(data.expense_date) ? data.expense_date : expense.expense_date;

    const roomMembers = store.splitMembers.filter(m => m.room_id === roomId);
    const validMemberIds = new Set(roomMembers.map(m => m.user_id));

    const payersInput =
        Array.isArray(data.payers) && data.payers.length > 0
            ? data.payers
            : [{ user_id: user.id, amount_paid: fromCents(totalCents) }];

    const processedPayers: Array<{ user_id: number; amount_paid: number }> = [];
    let payerCentsSum = 0;

    for (const p of payersInput) {
        const pUid = Number(p.user_id);
        if (!validMemberIds.has(pUid)) {
            res.status(400).json({ error: `Payer user ID ${p.user_id} is not a member of this room` });
            return;
        }
        const pCents = toCents(p.amount_paid);
        if (pCents < 0) {
            res.status(400).json({ error: 'Payer amount cannot be negative' });
            return;
        }
        payerCentsSum += pCents;
        processedPayers.push({ user_id: pUid, amount_paid: fromCents(pCents) });
    }

    if (Math.abs(payerCentsSum - totalCents) > 1) {
        res.status(400).json({
            error: `Total paid by payers (₹${fromCents(payerCentsSum).toFixed(2)}) does not match expense amount (₹${fromCents(totalCents).toFixed(2)}).`,
        });
        return;
    }

    const participantsInput: ShareInput[] =
        Array.isArray(data.participants) && data.participants.length > 0
            ? data.participants
            : roomMembers.map(m => ({ user_id: m.user_id }));

    let calculatedShares: Array<{ user_id: number; share_amount: number; raw_value: number | null }>;
    try {
        calculatedShares = calculateShares(totalCents, splitMethod, participantsInput);
    } catch (err: any) {
        res.status(400).json({ error: err?.message || 'Invalid split configuration' });
        return;
    }

    const nowIso = new Date().toISOString();
    expense.title = title;
    expense.amount = fromCents(totalCents);
    expense.category = category;
    expense.split_method = splitMethod;
    expense.expense_date = expenseDate;
    expense.notes = notes;
    expense.updated_at = nowIso;
    expense.payers = processedPayers.map(pp => ({
        id: store.nextId('splitPayers'),
        expense_id: expense.id,
        user_id: pp.user_id,
        amount_paid: pp.amount_paid,
    }));
    expense.shares = calculatedShares.map(cs => ({
        id: store.nextId('splitShares'),
        expense_id: expense.id,
        user_id: cs.user_id,
        share_amount: cs.share_amount,
        raw_value: cs.raw_value,
    }));

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: roomId,
        user_id: user.id,
        activity_type: 'EXPENSE_UPDATED',
        description: `${user.full_name} updated expense '${title}'`,
        metadata_json: null,
        created_at: nowIso,
    });

    const room = store.splitRooms.find(r => r.id === roomId);
    if (room) room.updated_at = nowIso;

    res.status(200).json({
        message: 'Expense updated successfully',
        expense: serializeExpense(expense),
    });
});

router.delete('/rooms/:roomId/expenses/:expenseId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);
    const expenseId = Number(req.params.expenseId);

    const membership = getMembership(roomId, user.id);
    if (!membership) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const expense = store.splitExpenses.find(
        e => e.id === expenseId && e.room_id === roomId && !e.is_deleted
    );
    if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
    }

    if (expense.created_by !== user.id && membership.role !== 'owner') {
        res.status(403).json({ error: 'Only the expense creator or room owner can delete this expense' });
        return;
    }

    const nowIso = new Date().toISOString();
    expense.is_deleted = true;
    expense.updated_at = nowIso;

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: roomId,
        user_id: user.id,
        activity_type: 'EXPENSE_DELETED',
        description: `${user.full_name} deleted expense '${expense.title}'`,
        metadata_json: null,
        created_at: nowIso,
    });

    const room = store.splitRooms.find(r => r.id === roomId);
    if (room) room.updated_at = nowIso;

    res.status(200).json({ message: 'Expense deleted successfully' });
});

// =============================================================================
// Balances & Settlements Endpoints
// =============================================================================

router.get('/rooms/:roomId/balances', requireAuth, (req: AuthenticatedRequest, res) => {
    const roomId = Number(req.params.roomId);
    if (!getMembership(roomId, req.userId!)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const fin = computeRoomFinancials(roomId);
    res.status(200).json(fin);
});

router.post('/rooms/:roomId/payments', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);

    const membership = getMembership(roomId, user.id);
    if (!membership) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const data = req.body || {};
    const payerId = Number(data.payer_id);
    const recipientId = Number(data.recipient_id);
    const notes = String(data.notes || '').trim();

    if (!payerId || !recipientId) {
        res.status(400).json({ error: 'Both payer and recipient are required' });
        return;
    }
    if (payerId === recipientId) {
        res.status(400).json({ error: 'Payer and recipient cannot be the same user' });
        return;
    }
    if (user.id !== payerId && user.id !== recipientId && membership.role !== 'owner') {
        res.status(403).json({ error: 'You can only record payments involving yourself' });
        return;
    }

    const roomMemberIds = new Set(store.splitMembers.filter(m => m.room_id === roomId).map(m => m.user_id));
    if (!roomMemberIds.has(payerId) || !roomMemberIds.has(recipientId)) {
        res.status(400).json({ error: 'Both payer and recipient must be room members' });
        return;
    }

    const amountCents = toCents(data.amount);
    if (amountCents <= 0) {
        res.status(400).json({ error: 'Payment amount must be greater than zero' });
        return;
    }

    const nowIso = new Date().toISOString();
    const initialStatus: 'REPORTED' | 'CONFIRMED' = user.id === recipientId ? 'CONFIRMED' : 'REPORTED';
    const amount = fromCents(amountCents);

    const payment: SplitSettlementPaymentRecord = {
        id: store.nextId('splitSettlementPayments'),
        room_id: roomId,
        payer_id: payerId,
        recipient_id: recipientId,
        created_by: user.id,
        amount,
        status: initialStatus,
        notes: notes || null,
        created_at: nowIso,
        confirmed_at: initialStatus === 'CONFIRMED' ? nowIso : null,
    };
    store.splitSettlementPayments.push(payment);

    const payerUser = store.users.find(u => u.id === payerId);
    const recipientUser = store.users.find(u => u.id === recipientId);
    const payerName = payerUser ? payerUser.full_name : `User #${payerId}`;
    const recipientName = recipientUser ? recipientUser.full_name : `User #${recipientId}`;
    const statusText = initialStatus === 'CONFIRMED' ? 'confirmed' : 'reported (pending confirmation)';

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: roomId,
        user_id: user.id,
        activity_type: 'PAYMENT_REPORTED',
        description: `${user.full_name} recorded a payment of ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${payerName} to ${recipientName} (${statusText})`,
        metadata_json: null,
        created_at: nowIso,
    });

    const room = store.splitRooms.find(r => r.id === roomId);
    if (room) room.updated_at = nowIso;

    res.status(201).json({
        message: `Payment recorded successfully as ${initialStatus.toLowerCase()}`,
        payment: serializePayment(payment),
    });
});

router.post('/rooms/:roomId/payments/:paymentId/confirm', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);
    const paymentId = Number(req.params.paymentId);

    if (!getMembership(roomId, user.id)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const payment = store.splitSettlementPayments.find(p => p.id === paymentId && p.room_id === roomId);
    if (!payment) {
        res.status(404).json({ error: 'Payment record not found' });
        return;
    }

    if (user.id !== payment.recipient_id) {
        res.status(403).json({ error: 'Only the recipient can confirm payment receipt' });
        return;
    }

    if (payment.status === 'CONFIRMED') {
        res.status(200).json({ message: 'Payment is already confirmed', payment: serializePayment(payment) });
        return;
    }

    const nowIso = new Date().toISOString();
    payment.status = 'CONFIRMED';
    payment.confirmed_at = nowIso;

    const payerUser = store.users.find(u => u.id === payment.payer_id);
    const payerName = payerUser ? payerUser.full_name : `User #${payment.payer_id}`;

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: roomId,
        user_id: user.id,
        activity_type: 'PAYMENT_CONFIRMED',
        description: `${user.full_name} confirmed receipt of ₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${payerName}`,
        metadata_json: null,
        created_at: nowIso,
    });

    const room = store.splitRooms.find(r => r.id === roomId);
    if (room) room.updated_at = nowIso;

    computeRoomFinancials(roomId);

    res.status(200).json({
        message: 'Payment confirmed successfully',
        payment: serializePayment(payment),
    });
});

router.post('/rooms/:roomId/payments/:paymentId/dispute', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.currentUser!;
    const roomId = Number(req.params.roomId);
    const paymentId = Number(req.params.paymentId);

    if (!getMembership(roomId, user.id)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const payment = store.splitSettlementPayments.find(p => p.id === paymentId && p.room_id === roomId);
    if (!payment) {
        res.status(404).json({ error: 'Payment record not found' });
        return;
    }

    if (user.id !== payment.recipient_id) {
        res.status(403).json({ error: 'Only the recipient can dispute this payment' });
        return;
    }

    const nowIso = new Date().toISOString();
    payment.status = 'DISPUTED';

    store.splitActivities.push({
        id: store.nextId('splitActivities'),
        room_id: roomId,
        user_id: user.id,
        activity_type: 'PAYMENT_DISPUTED',
        description: `${user.full_name} disputed payment #${payment.id} of ₹${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        metadata_json: null,
        created_at: nowIso,
    });

    const room = store.splitRooms.find(r => r.id === roomId);
    if (room) room.updated_at = nowIso;

    res.status(200).json({
        message: 'Payment disputed',
        payment: serializePayment(payment),
    });
});

router.get('/rooms/:roomId/payments', requireAuth, (req: AuthenticatedRequest, res) => {
    const roomId = Number(req.params.roomId);
    if (!getMembership(roomId, req.userId!)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const payments = store.splitSettlementPayments
        .filter(p => p.room_id === roomId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);

    res.status(200).json({ payments: payments.map(serializePayment) });
});

// =============================================================================
// Analytics & Activities Endpoints
// =============================================================================

router.get('/rooms/:roomId/analytics', requireAuth, (req: AuthenticatedRequest, res) => {
    const roomId = Number(req.params.roomId);
    if (!getMembership(roomId, req.userId!)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const fin = computeRoomFinancials(roomId);
    const expenses = store.splitExpenses
        .filter(e => e.room_id === roomId && !e.is_deleted)
        .sort((a, b) => a.expense_date.localeCompare(b.expense_date));

    const spendingByMember = fin.members_balances.map(mb => ({
        user_id: mb.user_id,
        name: mb.user_name,
        avatar: mb.user_avatar,
        amount: mb.total_paid,
    }));

    const sharesByMember = fin.members_balances.map(mb => ({
        user_id: mb.user_id,
        name: mb.user_name,
        avatar: mb.user_avatar,
        share: mb.total_share,
    }));

    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    for (const exp of expenses) {
        const cat = exp.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount);
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const spendingByCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, total]) => ({
            category,
            amount: fromCents(toCents(total)),
            count: categoryCounts[category],
            color: CATEGORY_COLORS[category] || '#6B7280',
        }));

    const dailyTotals: Record<string, number> = {};
    for (const exp of expenses) {
        dailyTotals[exp.expense_date] = (dailyTotals[exp.expense_date] || 0) + Number(exp.amount);
    }

    let cumulative = 0;
    const spendingOverTime = Object.keys(dailyTotals)
        .sort()
        .map(dStr => {
            const amt = dailyTotals[dStr];
            cumulative += amt;
            return {
                date: dStr,
                amount: fromCents(toCents(amt)),
                cumulative: fromCents(toCents(cumulative)),
            };
        });

    const settlementOverview = {
        total_spent: fin.total_spent,
        total_settled_amount: fin.total_settled_amount,
        total_outstanding_debt: fin.total_outstanding_debt,
        settlement_progress_percentage: fin.settlement_progress_percentage,
        completed_payments_count: fin.payments.filter(p => p.status === 'CONFIRMED').length,
        pending_payments_count: fin.payments.filter(p => p.status === 'REPORTED').length,
        is_fully_settled: fin.is_fully_settled,
    };

    res.status(200).json({
        spending_by_member: spendingByMember,
        shares_by_member: sharesByMember,
        spending_by_category: spendingByCategory,
        spending_over_time: spendingOverTime,
        settlement_overview: settlementOverview,
    });
});

router.get('/rooms/:roomId/activities', requireAuth, (req: AuthenticatedRequest, res) => {
    const roomId = Number(req.params.roomId);
    if (!getMembership(roomId, req.userId!)) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    const rawLimit = Number(req.query.limit || 30);
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.trunc(rawLimit))) : 30;

    const activities = store.splitActivities
        .filter(a => a.room_id === roomId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
        .slice(0, limit);

    res.status(200).json({ activities: activities.map(serializeActivity) });
});

export default router;
