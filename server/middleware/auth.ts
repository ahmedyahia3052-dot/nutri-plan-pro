import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set.");
  return secret;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getSecret()) as AuthUser & { iat?: number; exp?: number };
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, getSecret()) as AuthUser & { iat?: number; exp?: number };
      req.user = { id: payload.id, email: payload.email, name: payload.name };
    } catch {
      // invalid token — just continue without user
    }
  }
  next();
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    getSecret(),
    { expiresIn: "7d" }
  );
}
