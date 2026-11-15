import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../lib/env.js";

export type Database = typeof db;

export const db = drizzle({
  connection: {
    connectionString: env.DB_URL,
  },
  paramsInErrors: env.NODE_ENV === "development" && true,
});
