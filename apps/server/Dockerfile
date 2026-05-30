FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY apps/server apps/server
RUN npm run build --workspace apps/server

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci --omit=dev

COPY --from=build /app/apps/server/dist apps/server/dist
COPY apps/server/.env.example apps/server/.env.example

EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "apps/server"]
