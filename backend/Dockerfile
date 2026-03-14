FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Create data dir for SQLite
RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "src/server.js"]
