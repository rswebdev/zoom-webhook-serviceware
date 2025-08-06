import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Konfigurierbare Protokollpfade mit Umgebungsvariablen und Fallbacks
const LOG_DIR =
  process.env.LOG_DIR || (process.env.NODE_ENV === 'production' ? '/tmp/logs' : 'logs');

// Erstellen Sie das Verzeichnis, falls es nicht existiert, mit Fehlerbehandlung
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (error) {
  console.warn(`Warnung: Konnte das Log-Verzeichnis nicht erstellen: ${error.message}`);
  console.warn('Fallback auf Konsolen-Logging...');
}

// Erstellen der Transportoptionen basierend auf Verzeichniszugriff
const transports = [new winston.transports.Console()];

// Datei-Transporte nur hinzufügen, wenn Zugriff auf das Verzeichnis möglich ist
try {
  if (fs.existsSync(LOG_DIR) && fs.accessSync(LOG_DIR, fs.constants.W_OK)) {
    transports.push(
      new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(LOG_DIR, 'combined.log') })
    );
  }
} catch (error) {
  console.warn(`Warnung: Kein Schreibzugriff auf ${LOG_DIR}: ${error.message}`);
}

// Logger-Konfiguration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports,
});

export default logger;
