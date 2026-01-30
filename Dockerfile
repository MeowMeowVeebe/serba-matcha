# deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate dulu (biar client kebentuk sebelum build)
RUN npx prisma generate

# Next build (harus menghasilkan .next/standalone)
RUN npm run build

# run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# (Opsional tapi sering penting kalau kamu pakai prisma schema/migrate di runtime)
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
