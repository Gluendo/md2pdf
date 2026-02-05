# md2pdf - Markdown to PDF Generator
#
# Usage:
#   docker run --rm -v $(pwd):/docs ghcr.io/gluendo/md2pdf README.md
#   docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf docs/

FROM node:20-slim

# Install Chromium and fonts for Puppeteer/Mermaid
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-dejavu-core \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configure Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --only=production

# Copy application files
COPY generate-pdfs.js ./
COPY brand.json ./
COPY themes/ ./themes/

# Create Puppeteer config for mermaid-cli
RUN echo '{"executablePath": "/usr/bin/chromium", "args": ["--no-sandbox", "--disable-setuid-sandbox"]}' > /app/puppeteer-config.json

# Set working directory for input docs
WORKDIR /docs

ENTRYPOINT ["node", "/app/generate-pdfs.js"]
CMD ["--help"]
