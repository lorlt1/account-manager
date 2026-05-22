import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { config } from "./config.js";

const tokenMaxAgeSeconds = 60 * 60 * 24 * 30;

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
    },
    config.jwtSecret,
    { expiresIn: tokenMaxAgeSeconds }
  );
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
  };
}

export async function requireAuth(request, reply) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return reply.code(401).send({ error: "未登录" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    request.user = {
      id: new ObjectId(payload.sub),
      username: payload.username,
    };
  } catch {
    return reply.code(401).send({ error: "登录已过期" });
  }
}
