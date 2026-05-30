import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  QDRANT_URL: z.string().url().default("http://localhost:6333"),
  QDRANT_COLLECTION: z.string().default("pdf_chunks"),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(1536),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  REDIS_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
