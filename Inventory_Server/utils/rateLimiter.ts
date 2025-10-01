import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

type RateBucket = {
    count: number;
    resetAt: number;
};

const buckets: Map<string, RateBucket> = new Map();

interface CreateRateLimiterOptions {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
    message?: string;
}

export function createRateLimiter(options: CreateRateLimiterOptions) {
    const { windowMs, max, keyGenerator, message } = options;
    return function rateLimiter(req: Request, res: Response, next: NextFunction) {
        const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "unknown";
        const customKey = keyGenerator ? keyGenerator(req) : "";
        const key = `${ip}:${customKey}`;
        const now = Date.now();
        const bucket = buckets.get(key);

        if (!bucket || now > bucket.resetAt) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        if (bucket.count < max) {
            bucket.count += 1;
            return next();
        }

        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader("Retry-After", retryAfterSec.toString());
        return res.status(429).json({ success: false, error: message || "Too many requests. Please try again later." });
    };
}

// Convenience creators for auth flows using env with sane defaults
const LOGIN_RATE_WINDOW_MS = Number(process.env.LOGIN_RATE_WINDOW_MS || 15 * 60 * 1000);
const LOGIN_RATE_MAX = Number(process.env.LOGIN_RATE_MAX || 20);
const FORGOT_RATE_WINDOW_MS = Number(process.env.FORGOT_RATE_WINDOW_MS || 15 * 60 * 1000);
const FORGOT_RATE_MAX = Number(process.env.FORGOT_RATE_MAX || 5);

export const loginRateLimiter = createRateLimiter({
    windowMs: LOGIN_RATE_WINDOW_MS,
    max: LOGIN_RATE_MAX,
    keyGenerator: (req) => `login:${(req.body?.email || "").toLowerCase()}`,
    message: "Too many login attempts. Please slow down.",
});

export const forgotPasswordRateLimiter = createRateLimiter({
    windowMs: FORGOT_RATE_WINDOW_MS,
    max: FORGOT_RATE_MAX,
    keyGenerator: (req) => `forgot:${(req.body?.email || "").toLowerCase()}`,
    message: "Too many password reset requests. Please try later.",
});


