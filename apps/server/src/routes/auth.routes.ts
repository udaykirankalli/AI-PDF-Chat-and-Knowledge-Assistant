import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { User } from "../models/user.model.js";
import { signAuthToken } from "../utils/auth-token.js";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(72)
});

function publicUser(user: { _id: unknown; name: string; email: string }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email
  };
}

authRouter.post("/signup", async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash
    });

    const token = signAuthToken({ id: String(user._id), email: user.email });
    res.status(201).json({
      token,
      user: publicUser(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Please check the signup details and try again" });
      return;
    }

    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signAuthToken({ id: String(user._id), email: user.email });
    res.json({
      token,
      user: publicUser(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Please enter a valid email and password" });
      return;
    }

    next(error);
  }
});

authRouter.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user
  });
});
