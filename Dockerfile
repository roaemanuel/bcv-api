# Dockerfile — bcv-api
# Node 18 + dependencias de sistema para Playwright/Chromium

FROM node:18-slim

# Dependencias del sistema necesarias para Chromium headless
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    curl \
    unzip \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar dependencias primero (cache de Docker)
COPY package.json ./
RUN npm install --omit=dev

# Instalar playwright-core sin descargar browsers
# (usamos el Chromium del sistema instalado arriba)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# Copiar resto del proyecto
COPY . .

# Crear directorio para SQLite con permisos correctos
RUN mkdir -p /app/data && chown -R node:node /app

# Usar usuario no-root
USER node

EXPOSE 3000

CMD ["node", "server.js"]
