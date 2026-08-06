# ==========================================
# Stage 1: Build the Frontend (Vite)
# ==========================================
FROM node:22-alpine AS client-builder
WORKDIR /app/client

# Install dependencies
COPY client/package*.json ./
RUN npm ci

# Copy source and build
COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Setup and Run the Backend (Express + Socket.io)
# ==========================================
FROM node:22-alpine
WORKDIR /app/server

# Install server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server sources
COPY server/ ./

# Copy built frontend assets from Stage 1 into the sibling client directory
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose port and environment variables
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server.js"]
