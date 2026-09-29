# ---- Base stage ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- Stage 1: Development (used by docker compose in dev) ----
FROM base AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Stage 2: Production Build ----
FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# NEXT_PUBLIC_* values are baked in at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---- Stage 3: Small runtime image for Production ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "server.js"]