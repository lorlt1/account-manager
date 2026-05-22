import { MongoClient } from "mongodb";
import { config } from "./config.js";

let client;
let database;

export async function connectDatabase() {
  if (database) {
    return database;
  }

  client = new MongoClient(config.mongoUri);
  await client.connect();
  database = client.db(config.mongoDb);

  await database.collection("users").createIndex({ usernameLower: 1 }, { unique: true });
  await database.collection("vaults").createIndex({ userId: 1 }, { unique: true });

  return database;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
  }
}
