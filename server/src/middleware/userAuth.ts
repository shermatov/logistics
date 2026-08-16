import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  userId?: number;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export function signUserToken(userId: number, email: string): string {
  return jwt.sign({ sub: userId, email }, secret(), { expiresIn: "30d" });
}

export function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized: missing token" });
    return;
  }
  try {
    const payload = jwt.verify(token, secret());
    const sub = typeof payload === "object" ? payload.sub : undefined;
    const userId = Number(sub);
    if (!sub || Number.isNaN(userId)) {
      res.status(401).json({ error: "Unauthorized: invalid token payload" });
      return;
    }
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: invalid or expired token" });
  }
}
