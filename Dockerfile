FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN pnpm build

FROM node:24-alpine
USER node
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
CMD ["node", "dist/server.js"]
