# Deployment Guide

This project can be deployed as two apps plus managed data services.

## Recommended Setup

- Client: Vercel
- API: Render or Railway
- MongoDB: MongoDB Atlas
- Vector DB: Qdrant Cloud
- File storage: local disk for demo deployment, object storage for production hardening

## Client Deployment

Set the Vercel root directory to `apps/client`.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment:

```text
VITE_API_URL=https://your-api.example.com/api
```

## API Deployment

Set the API service root to the repository root so npm workspaces are available.

Build command:

```bash
npm install
npm run build --workspace apps/server
```

Start command:

```bash
npm run start --workspace apps/server
```

Environment:

```text
PORT=4000
CLIENT_ORIGIN=https://your-client.example.com
MONGO_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-secret
QDRANT_URL=https://your-qdrant-endpoint
QDRANT_COLLECTION=pdf_chunks
EMBEDDING_DIMENSIONS=1536
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

## Docker

Local dependencies are available with:

```bash
docker compose up -d
```

The app also includes separate Dockerfiles for the client and API:

```bash
docker build -f apps/server/Dockerfile -t pdf-chat-api .
docker build -f apps/client/Dockerfile -t pdf-chat-client .
```

## Production Notes

- Use object storage for uploaded PDFs if the API runs on ephemeral infrastructure.
- Keep `JWT_SECRET` private and rotate it if exposed.
- Configure CORS with the deployed client origin only.
- Qdrant payload filters enforce per-user retrieval boundaries.
- For large files, move ingestion into a background worker queue.
