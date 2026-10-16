# Multi-stage production build for Electricity Bazaar API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend dependencies and schema
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source and build TypeScript
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "dist/index.js"]
