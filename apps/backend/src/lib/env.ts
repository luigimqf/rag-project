import path from "node:path";
import dotenv from "dotenv";
import z from "zod";

const nodeEnv = process.env.NODE_ENV ?? "development";

const envFile = `.env.${nodeEnv}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const schema = z.object({
  PORT: z.coerce.number(),
  DB_URL: z.string()
});

const _env = schema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
