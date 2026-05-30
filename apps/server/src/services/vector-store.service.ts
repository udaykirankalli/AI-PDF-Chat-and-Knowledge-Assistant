import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

const qdrant = new QdrantClient({
  url: env.QDRANT_URL
});

type VectorChunk = {
  documentId: string;
  userId: string;
  title: string;
  chunkIndex: number;
  text: string;
  vector: number[];
};

export type RetrievedChunk = {
  documentId: string;
  title: string;
  chunkIndex: number;
  text: string;
  score: number;
};

export async function ensureVectorCollection() {
  const exists = await qdrant.collectionExists(env.QDRANT_COLLECTION);

  if (exists.exists) {
    return;
  }

  await qdrant.createCollection(env.QDRANT_COLLECTION, {
    vectors: {
      size: env.EMBEDDING_DIMENSIONS,
      distance: "Cosine"
    }
  });
}

export async function upsertDocumentChunks(chunks: VectorChunk[]) {
  if (chunks.length === 0) {
    return;
  }

  await ensureVectorCollection();

  await qdrant.upsert(env.QDRANT_COLLECTION, {
    wait: true,
    points: chunks.map((chunk) => ({
      id: randomUUID(),
      vector: chunk.vector,
      payload: {
        documentId: chunk.documentId,
        userId: chunk.userId,
        title: chunk.title,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text
      }
    }))
  });
}

export async function deleteDocumentVectors(documentId: string) {
  await ensureVectorCollection();

  await qdrant.delete(env.QDRANT_COLLECTION, {
    wait: true,
    filter: {
      must: [
        {
          key: "documentId",
          match: {
            value: documentId
          }
        }
      ]
    }
  });
}

export async function searchRelevantChunks(userId: string, queryVector: number[], limit = 5) {
  await ensureVectorCollection();

  const response = await qdrant.query(env.QDRANT_COLLECTION, {
    query: queryVector,
    limit,
    with_payload: true,
    filter: {
      must: [
        {
          key: "userId",
          match: {
            value: userId
          }
        }
      ]
    }
  });

  return response.points
    .map((point) => {
      const payload = point.payload ?? {};

      return {
        documentId: String(payload.documentId ?? ""),
        title: String(payload.title ?? "Untitled PDF"),
        chunkIndex: Number(payload.chunkIndex ?? 0),
        text: String(payload.text ?? ""),
        score: point.score ?? 0
      };
    })
    .filter((chunk) => chunk.documentId && chunk.text) satisfies RetrievedChunk[];
}
