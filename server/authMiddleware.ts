import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store, type UserRecord } from './store.js';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'AstraMinds_jwt_dev_secret_change_me';

export interface AuthenticatedRequest extends Request {
    userId?: number;
    currentUser?: UserRecord;
}

export function signAccessToken(userId: number): string {
    return jwt.sign({ sub: String(userId) }, JWT_SECRET);
}

export function decodeAccessToken(token: string): number | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string | number };
        if (decoded && decoded.sub !== undefined) {
            const id = Number(decoded.sub);
            return Number.isFinite(id) ? id : null;
        }
        return null;
    } catch {
        return null;
    }
}

export function extractBearerToken(req: Request): string | null {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7).trim();
    }
    if (typeof req.query.token === 'string' && req.query.token.trim()) {
        return req.query.token.trim();
    }
    return null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const token = extractBearerToken(req);
    if (!token) {
        res.status(401).json({ error: 'Missing Authorization Header' });
        return;
    }

    const userId = decodeAccessToken(token);
    if (!userId) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    const user = store.users.find(u => u.id === userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    req.userId = userId;
    req.currentUser = user;
    next();
}
