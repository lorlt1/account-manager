import { hashPassword, requireAuth, sanitizeUser, signToken, verifyPassword } from "./auth.js";
import { encryptJson, decryptJson } from "./crypto.js";

function validateUsername(username) {
  return typeof username === "string" && username.trim().length >= 2 && username.trim().length <= 32;
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6 && password.length <= 128;
}

function normalizeUsername(username) {
  return username.trim();
}

export async function registerRoutes(app, db) {
  const users = db.collection("users");
  const vaults = db.collection("vaults");

  app.get("/health", async () => ({
    ok: true,
    service: "account-manager-api",
    time: new Date().toISOString(),
  }));

  app.post("/auth/register", async (request, reply) => {
    const { username, password } = request.body || {};
    if (!validateUsername(username)) {
      return reply.code(400).send({ error: "用户名需要 2-32 个字符" });
    }
    if (!validatePassword(password)) {
      return reply.code(400).send({ error: "密码至少 6 位" });
    }

    const normalized = normalizeUsername(username);
    const now = new Date();
    const user = {
      username: normalized,
      usernameLower: normalized.toLowerCase(),
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await users.insertOne(user);
      user._id = result.insertedId;
      const token = signToken(user);
      return reply.code(201).send({ token, user: sanitizeUser(user) });
    } catch (error) {
      if (error.code === 11000) {
        return reply.code(409).send({ error: "用户名已存在" });
      }
      throw error;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const { username, password } = request.body || {};
    if (!validateUsername(username) || !validatePassword(password)) {
      return reply.code(400).send({ error: "账号或密码格式不正确" });
    }

    const user = await users.findOne({ usernameLower: normalizeUsername(username).toLowerCase() });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.code(401).send({ error: "账号或密码错误" });
    }

    await users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    return { token: signToken(user), user: sanitizeUser(user) };
  });

  app.get("/sync", { preHandler: requireAuth }, async (request) => {
    const vault = await vaults.findOne({ userId: request.user.id });
    if (!vault) {
      return { data: null, updatedAt: null };
    }

    return {
      data: decryptJson(vault.encrypted),
      updatedAt: vault.updatedAt,
    };
  });

  app.put("/sync", { preHandler: requireAuth }, async (request, reply) => {
    const { data } = request.body || {};
    if (!data || typeof data !== "object" || !Array.isArray(data.accounts) || !Array.isArray(data.subscriptionReminders)) {
      return reply.code(400).send({ error: "同步数据格式不正确" });
    }

    const now = new Date();
    await vaults.updateOne(
      { userId: request.user.id },
      {
        $set: {
          userId: request.user.id,
          encrypted: encryptJson(data),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    return { ok: true, updatedAt: now };
  });
}
