import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { closeDatabase, connectDatabase } from "./db.js";
import { registerRoutes } from "./routes.js";

const app = Fastify({
  logger: true,
});

const db = await connectDatabase();

await app.register(cors, {
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes("*") || config.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed"), false);
  },
});

await registerRoutes(app, db);

const shutdown = async () => {
  await app.close();
  await closeDatabase();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ host: config.host, port: config.port });
