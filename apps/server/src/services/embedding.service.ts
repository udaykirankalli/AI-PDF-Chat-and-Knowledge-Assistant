import OpenAI from "openai";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";

let openai: OpenAI | null = null;

export async function embedTexts(texts: string[]) {
  if (texts.length === 0) {
    return [];
  }

  if (env.OPENAI_API_KEY) {
    openai ??= new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });

    const response = await openai.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: texts,
      dimensions: env.EMBEDDING_DIMENSIONS
    });

    return response.data.map((item) => item.embedding);
  }

  return texts.map(createDevelopmentEmbedding);
}

function createDevelopmentEmbedding(text: string) {
  const vector = Array.from({ length: env.EMBEDDING_DIMENSIONS }, () => 0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

  for (const token of tokens) {
    const hash = createHash("sha256").update(token).digest();
    const index = hash.readUInt32BE(0) % env.EMBEDDING_DIMENSIONS;
    const sign = hash[4] % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}
