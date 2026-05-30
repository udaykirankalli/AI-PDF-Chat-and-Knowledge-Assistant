# Demo Video Script

Target length: 3 to 5 minutes.

## 1. Product Overview

Introduce the app as an AI PDF Chat and Knowledge Assistant. Explain that users upload PDFs and ask questions, but every answer must pass through retrieval first.

## 2. Authentication

Show signup or login. Mention that documents and chats are scoped to the authenticated user with JWT-protected APIs.

## 3. PDF Upload

Upload a PDF from the dashboard. Point out upload progress, document status, and metadata such as file size, pages, chunks, and indexing state.

## 4. RAG Pipeline

Use the architecture diagram in `docs/ARCHITECTURE.md`.

Explain:

- PDF text is extracted with `pdf-parse`.
- Text is chunked with overlap.
- Each chunk receives an embedding.
- Vectors and payload metadata are stored in Qdrant.
- Chat questions are embedded and searched against Qdrant.
- Retrieved chunks are passed to the generator.

## 5. Chat Experience

Ask a question related to the uploaded PDF. Show the answer streaming into the chat panel and highlight citations below the answer.

## 6. Code Walkthrough

Briefly open:

- `apps/server/src/services/ingestion.service.ts`
- `apps/server/src/services/vector-store.service.ts`
- `apps/server/src/routes/chat.routes.ts`
- `apps/client/src/App.tsx`

Mention that the app includes persistent conversation history and a development fallback when `OPENAI_API_KEY` is not set.

## 7. Deployment Notes

Mention the deployment plan:

- Vercel for frontend.
- Render or Railway for API.
- MongoDB Atlas for database.
- Qdrant Cloud for vector storage.

Close by showing the README and deployment documentation.
