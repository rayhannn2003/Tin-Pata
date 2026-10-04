# Optional container build. The VPS deploy path uses PM2 directly (see
# docs/VPS_DEPLOYMENT.md); this exists so the service can move to a container
# runtime without a rewrite.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3016
# Secrets are injected at run time (--env-file / -e), never baked into the image.
CMD ["node", "dist/server.js"]
