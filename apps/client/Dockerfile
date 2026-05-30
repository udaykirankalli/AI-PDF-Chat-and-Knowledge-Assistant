FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci

COPY apps/client apps/client
RUN npm run build --workspace apps/client

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
