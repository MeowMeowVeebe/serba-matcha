# deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
FROM node:20-slim

RUN node -v && npm -v && ls -la
RUN npm run build --loglevel verbose
RUN npx prisma generate

# If Prisma is used, uncomment:
# RUN npx prisma generate
RUN npm run build > /tmp/build.log 2>&1 || (echo "===== BUILD LOG =====" && tail -n 200 /tmp/build.log && exit 1)



# run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production


# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public


EXPOSE 3000
CMD ["node", "server.js"]
