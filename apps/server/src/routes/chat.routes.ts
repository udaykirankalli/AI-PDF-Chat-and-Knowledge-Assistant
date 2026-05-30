import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ChatSession } from "../models/chat-session.model.js";
import { Document } from "../models/document.model.js";
import { embedTexts } from "../services/embedding.service.js";
import { generateGroundedAnswer } from "../services/generation.service.js";
import { searchRelevantChunks } from "../services/vector-store.service.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const streamSchema = z.object({
  sessionId: z.string().optional(),
  question: z.string().trim().min(2).max(1200)
});

chatRouter.get("/sessions", async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user!.id })
      .sort({ updatedAt: -1 })
      .select("title messages createdAt updatedAt");

    res.json({
      sessions: sessions.map((session) => ({
        id: String(session._id),
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

chatRouter.post("/stream", async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = streamSchema.parse(req.body);
    const indexedCount = await Document.countDocuments({
      userId: req.user!.id,
      status: "indexed"
    });

    if (indexedCount === 0) {
      res.status(400).json({ message: "Upload and index at least one PDF before chatting" });
      return;
    }

    let session = data.sessionId
      ? await ChatSession.findOne({ _id: data.sessionId, userId: req.user!.id })
      : null;

    if (!session) {
      session = await ChatSession.create({
        userId: req.user!.id,
        title: data.question.slice(0, 70),
        messages: []
      });
    }

    session.messages.push({
      role: "user",
      content: data.question,
      citations: []
    });
    await session.save();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    });

    sendEvent(res, "session", { sessionId: String(session._id), title: session.title });

    const [queryVector] = await embedTexts([data.question]);
    const chunks = await searchRelevantChunks(req.user!.id, queryVector, 6);
    const citations = chunks.map((chunk) => ({
      documentId: chunk.documentId,
      title: chunk.title,
      chunkIndex: chunk.chunkIndex,
      score: chunk.score
    }));

    sendEvent(res, "citations", { citations });

    let answer = "";

    for await (const token of generateGroundedAnswer(data.question, chunks)) {
      answer += token;
      sendEvent(res, "token", { token });
    }

    session.messages.push({
      role: "assistant",
      content: answer,
      citations
    });
    await session.save();

    sendEvent(res, "done", { sessionId: String(session._id) });
    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Please enter a clear question" });
      return;
    }

    next(error);
  }
});

function sendEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
