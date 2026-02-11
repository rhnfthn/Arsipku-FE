# ---------- BUILD ----------
FROM node:20-bookworm AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- RUN ----------
FROM node:20-bookworm

WORKDIR /app
ENV NODE_ENV=production

# Copy hasil build Nuxt
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
