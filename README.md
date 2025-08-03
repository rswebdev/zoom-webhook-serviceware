# zoom-webhook-serviceware

Ein Docker-basiertes Node.js-Projekt, das Zoom Phone Webhook-Events entgegennimmt und an einen Serviceware-Webhook weiterleitet. Für lokale Entwicklung und Tests sind ein ngrok-Tunnel und ein Serviceware-Mock-Server integriert.

## Features
- Empfängt und prüft Zoom Phone Webhook-Events (`call_connected`, `call_disconnected`, `url_validation`)
- Leitet Events an Serviceware weiter (mit Shared Secret)
- Healthcheck- und Logging-Integration
- Docker- und Compose-Setup mit ngrok und Mock-Server

## Schnellstart

1. **.env Datei anlegen** (siehe `example.env`):
   ```sh
   cp example.env .env
   # Werte in .env anpassen
   ```

2. **Docker Compose starten:**
   ```sh
   docker compose up --build
   ```

3. **ngrok-URL finden:**
   - Im Terminal oder unter http://localhost:4040
   - Diese URL bei Zoom als Event-Subscription-Endpoint eintragen

4. **Serviceware-Mock-Server:**
   - Lauscht auf Port 4000 (intern: `serviceware-mock:4000`)
   - Zeigt empfangene Events im Log an

## Endpunkte
- `POST /zoom-phone-call-events` – Zoom Webhook Endpoint
- `GET /health` – Healthcheck
- Serviceware-Mock: `/PhoneBox/TelephonyHook/OnCallConnected` und `/PhoneBox/TelephonyHook/OnCallDisconnected`

## Konfigurationsdateien
- `.env` – Umgebungsvariablen (siehe `example.env`)
- `docker-compose.yml` – Multi-Service-Setup
- `Dockerfile` – App-Container
- `.gitignore` – ignoriert sensible Daten und node_modules

## Entwicklung
- Quellcode: `index.js`, Typen: `index.d.ts`
- Mock-Server: `mock-server/mock.js`

## Sicherheit
- Nutzt aktuelle Node.js-Alpine-Images
- Healthchecks und Logging integriert
- Shared Secret für Serviceware-Webhook

## Lizenz
ISC
