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

# Copy workspace root and packages
COPY package.json ./
COPY packages/core/ packages/core/
COPY packages/cli/ packages/cli/

# Copy shared resources
COPY brand.json ./
COPY themes/ ./themes/
COPY resources/ ./resources/

# Install dependencies and build
RUN npm install
RUN npm run build -w packages/core && npm run build -w packages/cli

# Copy mermaid.min.js from installed package into resources
RUN cp node_modules/mermaid/dist/mermaid.min.js resources/mermaid.min.js

# Set working directory for input docs
WORKDIR /docs

ENTRYPOINT ["node", "/app/packages/cli/dist/index.js"]
CMD ["--help"]
