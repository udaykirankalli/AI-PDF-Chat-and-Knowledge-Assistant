import type { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { verifyAuthToken } from "../utils/auth-token.js";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.id).select("name email");

    if (!user) {
      res.status(401).json({ message: "User session is no longer valid" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
