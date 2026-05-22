import "dotenv/config";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 8080),
  host: process.env.HOST || "0.0.0.0",
  mongoUri: requireEnv("MONGODB_URI"),
  mongoDb: process.env.MONGODB_DB || "account_manager",
  jwtSecret: requireEnv("JWT_SECRET"),
  dataEncryptionKey: requireEnv("DATA_ENCRYPTION_KEY"),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
};
