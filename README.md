# Zoom Webhook Serviceware

## Übersicht
Dieser Service fungiert als Webhook-Handler für Zoom Phone Events und leitet die relevanten Informationen an Serviceware weiter. Er verarbeitet eingehende Anrufereignisse und sendet sie an die entsprechenden Serviceware-Endpunkte.

## Funktionen
- Empfang und Verarbeitung von Zoom Phone Webhook-Events
- Validierung der Zoom-Webhook-Signatur für Sicherheit
- Weiterleitung spezifischer Anrufereignisse an Serviceware
- Unterstützung für folgende Ereignisse:
  - `phone.caller_connected`
  - `phone.caller_ended`
  - `phone.callee_answered`
  - `phone.callee_ended`
- Healthcheck-Endpunkt

## Installation

### Voraussetzungen
- Node.js (empfohlen: v16 oder höher)
- npm oder yarn
- Docker (optional, für Container-Deployment)

### Lokale Installation
```bash
# Repository klonen
git clone [repository-url]
cd zoom-webhook-serviceware

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env-Datei mit den erforderlichen Werten bearbeiten

# Anwendung starten
npm start
```

## Umgebungsvariablen
Die Anwendung erfordert die folgenden Umgebungsvariablen:

```
# Zoom Konfiguration
ZOOM_SECRET_TOKEN=          # Secret Token für Zoom Webhook-Validierung
ZOOM_EVENT_SUBSCRIBER_ENDPOINT = # Endpunkt für Zoom Phone Events (z.B. `/zoom-phone-call-event`)

# Serviceware API Konfiguration
SERVICEWARE_API_URL=        # Basis-URL der Serviceware API
SERVICEWARE_WH_ENDPOINT_ON_CALL_CONNECTED= # Endpoint für Anrufverbindungen
SERVICEWARE_WH_ENDPOINT_ON_CALL_ENDED=     # Endpoint für beendete Anrufe
SERVICEWARE_SHARED_SECRET=  # Shared Secret für Serviceware API-Authentifizierung

# Ngrok Konfiguration
# see https://ngrok.com/docs/get-started/your-authtoken
NGROK_AUTHTOKEN=your_ngrok_authtoken
NGROK_URL=your_ngrok_url

# Logging-Konfiguration
LOG_LEVEL=info              # Log-Level (debug, info, warn, error)
LOG_DIR=/tmp/logs           # Verzeichnis für Log-Dateien
```

## Docker-Deployment
Die Anwendung kann einfach mit Docker deployed werden:

```bash
# Docker-Image bauen
docker compose build

# Container starten
docker compose up -d
```

### Hinweis zur Docker-Konfiguration
Die Anwendung verwendet in Docker `/tmp/logs` als Verzeichnis für Log-Dateien. Stellen Sie sicher, dass die entsprechenden Umgebungsvariablen in Ihrer Docker-Konfiguration gesetzt sind.

## API-Endpunkte

### Health Check
- **GET** `/health`
  - Liefert "OK" mit Status 200, wenn der Service funktioniert

### Zoom Webhook-Endpunkt
- **POST** `/zoom-phone-call-events`
  - Verarbeitet eingehende Zoom Phone-Ereignisse
  - Erfordert korrekte Zoom-Signatur im Header

## Entwicklung
Die Anwendung basiert auf Express.js und nutzt folgende Haupttechnologien:
- Express.js für die API
- Winston für das Logging
- Axios für HTTP-Anfragen
- Helmet, CORS und Rate Limiting für Sicherheit

### Ngrok für lokale Entwicklung
Das Projekt verwendet ngrok im Entwicklungsprofil, um lokale Webhooks für Zoom zugänglich zu machen. Mit ngrok können Sie Ihre lokale Entwicklungsumgebung über einen öffentlich zugänglichen Endpunkt testen:

- **Automatische Konfiguration**: Wenn Sie `docker compose --profile dev up` ausführen, wird ngrok automatisch gestartet und erstellt einen sicheren Tunnel zu Ihrem lokalen Service.
- **Zugriffsüberwachung**: Öffnen Sie `http://localhost:4040` in Ihrem Browser, um das ngrok-Dashboard mit allen eingehenden Anfragen einzusehen.
- **Webhook-Konfiguration**: Verwenden Sie die von ngrok generierte URL (sichtbar im Dashboard oder in den Logs), um Ihren Zoom Webhook für Tests zu konfigurieren.
- **Authentifizierung**: Stellen Sie sicher, dass die Umgebungsvariable `NGROK_AUTHTOKEN` in Ihrer `.env`-Datei gesetzt ist. Einen kostenlosen Auth-Token erhalten Sie nach der Registrierung auf [ngrok.com](https://ngrok.com).

Diese Integration ermöglicht das einfache Testen von Webhook-Ereignissen während der Entwicklung, ohne die Notwendigkeit, Ihre Anwendung in einer öffentlich zugänglichen Umgebung bereitzustellen.

### Debugging
Zum Aktivieren ausführlicherer Logs setzen Sie die Umgebungsvariable `LOG_LEVEL=debug`.

## Lizenz
[Hier Lizenzinformationen einfügen]
