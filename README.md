# AI PDF Chat & Knowledge Assistant

A SaaS-style web app where users upload PDFs, index them through a strict Retrieval-Augmented Generation pipeline, and chat with an assistant that answers only from retrieved document context.

## What It Does

- Secure signup/login with JWT sessions.
- User dashboard for uploading, listing, and deleting PDFs.
- PDF extraction, chunking, embedding generation, and Qdrant vector indexing.
- Streaming chat answers grounded in semantic retrieval.
- Persistent conversation history with source citations.
- Responsive React interface with loading, empty, error, and processing states.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- Vector store: Qdrant
- AI: OpenAI embeddings/chat when an API key is provided
- Local fallback: deterministic development embeddings and grounded extractive answers
- Bonus coverage: Docker setup, streaming responses, source citations, multi-service local environment

## RAG Workflow

1. User uploads a PDF from the dashboard.
2. The server stores metadata in MongoDB and saves the file locally.
3. `pdf-parse` extracts raw text from the document.
4. Text is normalized and chunked with overlap for retrieval quality.
5. Embeddings are generated for each chunk.
6. Chunks and metadata are stored in Qdrant.
7. A chat question is embedded and used for semantic search.
8. Retrieved chunks are sent to the generator.
9. The answer streams back to the UI with citations.

See [Architecture](./docs/ARCHITECTURE.md) for the full diagram.

## Local Setup

Copy environment files:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

Install packages and start local services:

```bash
npm install
docker compose up -d
```

Run the API and client in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

Open the app at `http://localhost:5173`.

## Environment Variables

Server:

- `PORT`: API port, defaults to `4000`.
- `CLIENT_ORIGIN`: frontend origin for CORS.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: long random secret for auth tokens.
- `QDRANT_URL`: Qdrant HTTP endpoint.
- `QDRANT_COLLECTION`: vector collection name.
- `EMBEDDING_DIMENSIONS`: vector size, default `1536`.
- `OPENAI_EMBEDDING_MODEL`: embedding model name.
- `OPENAI_CHAT_MODEL`: chat model name.
- `OPENAI_API_KEY`: optional for production AI responses.

Client:

- `VITE_API_URL`: API base URL, for example `http://localhost:4000/api`.

## Useful Commands

```bash
npm run build
npm run dev:server
npm run dev:client
npm audit --omit=dev
```

## Deployment

Deployment notes are in [Deployment](./docs/DEPLOYMENT.md). The clean path is Vercel for the React client and Render/Railway for the Express API, MongoDB Atlas, and Qdrant Cloud.

## Project Structure

```text
apps/
  client/    React dashboard and chat UI
  server/    Express API, Mongo models, ingestion, retrieval, streaming chat
docs/        Architecture and deployment notes
```
