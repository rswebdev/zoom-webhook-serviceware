# Hinweise zur API-Versionierung und Secrets-Management

## API-Versionierung
- Bei Breaking Changes sollte der Hauptendpunkt versioniert werden, z. B. `/v1/zoom-phone-call-events`.
- Dokumentiere Änderungen im Changelog und in der OpenAPI-Doku.

## Secrets-Management
- `.env` niemals ins Repository einchecken (bereits in .gitignore).
- Für Produktion: Secrets über sichere Mechanismen bereitstellen (z. B. Docker Secrets, CI/CD-Umgebungsvariablen, Vault).
- Beispiel für Docker Secrets:
  - Lege ein Secret an: `echo "mysecret" | docker secret create serviceware_secret -`
  - Im Compose-File unter `secrets:` einbinden und im Container als Datei bereitstellen.

## Monitoring/Alerting
- Healthcheck-Endpoint vorhanden.
- Für produktive Nutzung empfiehlt sich Integration mit Prometheus, Grafana oder Sentry.
- Beispiel: Prometheus-Exporter oder Sentry-Client in index.js einbinden.

## Logging
- Für produktive Nutzung empfiehlt sich ein Logging-Framework wie Winston oder Pino, das Logs in Dateien oder an zentrale Systeme weiterleitet.

---

Diese Hinweise sind als `SECURITY_AND_VERSIONING.md` im Projekt abgelegt.
