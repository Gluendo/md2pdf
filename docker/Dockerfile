# md2pdf - Markdown to PDF Generator
# Portable Docker image for generating PDFs from Markdown with Mermaid support

FROM node:20-slim

# Install Chromium and dependencies for Puppeteer/Mermaid
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-dejavu-core \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium (for both md-to-pdf and mermaid-cli)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production 2>/dev/null || npm install --only=production

# Copy generator and config
COPY generate-pdfs.js ./
COPY brand.json ./
COPY themes/ ./themes/

# Create Puppeteer config for mermaid-cli
RUN echo '{"executablePath": "/usr/bin/chromium", "args": ["--no-sandbox", "--disable-setuid-sandbox"]}' > /app/puppeteer-config.json

# Create directories
RUN mkdir -p /docs /output

# Set working directory for docs
WORKDIR /docs

# Default command: show help
ENTRYPOINT ["node", "/app/generate-pdfs.js"]
CMD ["--help"]
