import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type TokenUser = {
  id: string;
  email: string;
};

export function signAuthToken(user: TokenUser) {
  return jwt.sign(user, env.JWT_SECRET, {
    expiresIn: "7d"
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenUser;
}
