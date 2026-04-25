# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.11.1

# Stage 0: base
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app
# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Stage 1: development
FROM base AS dev
ENV NODE_ENV development
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["npx", "tsx", "watch", "./src/index.ts"]

# Stage 2: builder
FROM base AS builder
COPY . .
RUN npm run build

# Stage 3: production
FROM node:${NODE_VERSION}-alpine AS prod 
ENV NODE_ENV production
WORKDIR /usr/src/app

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]