# Dockerfile für zoom-webhook-serviceware
FROM node:lts-alpine3.22

# Arbeitsverzeichnis setzen
WORKDIR /usr/src/app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm ci --omit=dev

# Quellcode kopieren
COPY . .

# Port für Express (anpassbar, Standard 3000)
EXPOSE 3000

# Umgebungsvariable für Production
ENV NODE_ENV=production

# Healthcheck direkt im Container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Aus Sicherheitsgründen als node-User ausführen
USER node

# Startbefehl
CMD ["node", "server.js"]
