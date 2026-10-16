# Production Container for Electricity Bazaar API
FROM node:20-slim

# Install OpenSSL required by Prisma query engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies and Prisma schema
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies
RUN npm install

# Generate Prisma Client for Linux Debian
RUN npx prisma generate

# Copy source code and TypeScript config
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Build TypeScript to dist
RUN npm run build

# Default Environment Variables for Railway
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="railway_production_jwt_secret_electricity_bazaar_2026"
ENV JWT_REFRESH_SECRET="railway_production_jwt_refresh_secret_electricity_bazaar_2026"
ENV CORS_ORIGIN="*"

# Create and sync SQLite database tables
RUN npx prisma db push

EXPOSE 5000

CMD ["node", "dist/index.js"]
