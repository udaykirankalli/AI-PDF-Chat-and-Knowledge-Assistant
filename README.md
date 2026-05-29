# AI PDF Chat & Knowledge Assistant

A production-minded SaaS application for uploading PDFs, indexing their content through a strict RAG pipeline, and chatting with an AI assistant grounded in the uploaded documents.

## Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB
- Vector store: Qdrant
- Cache / streaming support: Redis-ready architecture
- AI pipeline: PDF extraction, chunking, embeddings, semantic retrieval, grounded generation

## Planned Workflow

1. Users sign up and manage their document library.
2. Uploaded PDFs are extracted, chunked, embedded, and stored in Qdrant.
3. Chat requests perform semantic search before generation.
4. Answers stream back with source citations and conversation history.

## Local Development

```bash
npm install
docker compose up -d
npm run dev:server
npm run dev:client
```

Copy the environment examples before running the app:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

## Commit Plan

- Scaffold monorepo and local services
- Add authentication and session persistence
- Build dashboard and PDF upload flow
- Implement PDF ingestion and vector indexing
- Add chat retrieval with streaming responses
- Polish responsive UI and error states
- Add architecture diagram, deployment docs, and final README
