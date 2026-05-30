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
