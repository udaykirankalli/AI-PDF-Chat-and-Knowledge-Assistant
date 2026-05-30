import { promises as fs } from "node:fs";
import pdfParse from "pdf-parse";
import { Document } from "../models/document.model.js";
import { embedTexts } from "./embedding.service.js";
import { chunkText } from "./text-chunker.service.js";
import { deleteDocumentVectors, upsertDocumentChunks } from "./vector-store.service.js";

export async function processDocument(documentId: string) {
  const document = await Document.findById(documentId);

  if (!document) {
    return;
  }

  try {
    await Document.updateOne(
      { _id: document._id },
      {
        status: "processing",
        errorMessage: ""
      }
    );

    const fileBuffer = await fs.readFile(document.storagePath);
    const parsedPdf = await pdfParse(fileBuffer);
    const chunks = chunkText(parsedPdf.text);

    if (chunks.length === 0) {
      throw new Error("No readable text was found in this PDF");
    }

    await deleteDocumentVectors(String(document._id)).catch(() => undefined);

    const embeddings = await embedTexts(chunks.map((chunk) => chunk.text));

    await upsertDocumentChunks(
      chunks.map((chunk, index) => ({
        documentId: String(document._id),
        userId: String(document.userId),
        title: document.title,
        chunkIndex: chunk.index,
        text: chunk.text,
        vector: embeddings[index]
      }))
    );

    await Document.updateOne(
      { _id: document._id },
      {
        status: "indexed",
        pageCount: parsedPdf.numpages,
        chunkCount: chunks.length,
        errorMessage: ""
      }
    );
  } catch (error) {
    await Document.updateOne(
      { _id: document._id },
      {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Document processing failed"
      }
    );
  }
}
