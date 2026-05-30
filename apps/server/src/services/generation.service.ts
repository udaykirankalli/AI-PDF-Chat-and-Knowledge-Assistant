import OpenAI from "openai";
import { env } from "../config/env.js";
import type { RetrievedChunk } from "./vector-store.service.js";

let openai: OpenAI | null = null;

export async function* generateGroundedAnswer(question: string, context: RetrievedChunk[]) {
  if (context.length === 0) {
    yield "I could not find relevant indexed context for this question. Upload and index a PDF first, then ask again.";
    return;
  }

  if (!env.OPENAI_API_KEY) {
    yield createDevelopmentAnswer(question, context);
    return;
  }

  openai ??= new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  const contextBlock = context
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.title}, chunk ${chunk.chunkIndex + 1}\n${chunk.text}`
    )
    .join("\n\n");

  const stream = await openai.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    stream: true,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You answer only from the retrieved PDF context. If the answer is not present, say that the documents do not contain enough information. Include short source markers like [1] when useful."
      },
      {
        role: "user",
        content: `Question: ${question}\n\nRetrieved context:\n${contextBlock}`
      }
    ]
  });

  for await (const event of stream) {
    const token = event.choices[0]?.delta?.content;

    if (token) {
      yield token;
    }
  }
}

function createDevelopmentAnswer(question: string, context: RetrievedChunk[]) {
  const bestContext = context
    .slice(0, 3)
    .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
    .join("\n\n");

  return `Based on the retrieved PDF context, here is the most relevant information for: "${question}"\n\n${bestContext}\n\nThis development response is grounded in retrieved chunks. Add OPENAI_API_KEY to stream polished LLM answers.`;
}
