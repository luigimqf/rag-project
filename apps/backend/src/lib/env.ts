import path from "node:path";
import dotenv from "dotenv";
import z from "zod";

const nodeEnv = process.env.NODE_ENV ?? "development";

const envFile = `.env.${nodeEnv}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const schema = z.object({
  NODE_ENV: z.string(),
  PORT: z.coerce.number(),
  DB_URL: z.string(),
  EMBEDDING_PROVIDER: z.enum(["ollama"]).default("ollama"),
  EMBEDDER_HOST: z.url(),
  EMBEDDER_MODEL: z.string().min(1),
  EMBED_DIMS: z.coerce.number().int().positive(),

  LLM_PROVIDER: z.enum(["ollama"]).default("ollama"),
  LLM_HOST: z.url().optional(),
  LLM_MODEL: z.string().min(1),
});

const _env = schema.safeParse(process.env);

if (_env.success === false) {
  console.error("Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
