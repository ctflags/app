FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create shared directory for file uploads
RUN mkdir -p /tmp/shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app && \
    chown -R nodejs:nodejs /tmp/shared
USER nodejs

EXPOSE 3000

CMD ["node", "app.js"]
