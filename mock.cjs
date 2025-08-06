// Minimaler Mock-Server für Serviceware Webhook
const express = require('express');
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
dotenv.config();

const logger = require('./logger.mjs').default; // Importiere den Logger

const app = express();
app.use(bodyParser.json());

const SHARED_SECRET = process.env.SERVICEWARE_SHARED_SECRET || 'test';
const CALL_CONNECT_ENDPOINT =
  process.env.SERVICEWARE_WH_ENDPOINT_ON_CALL_CONNECTED ||
  '/PhoneBox/TelephonyHook/OnCallConnected';
const CALL_DISCONNECT_ENDPOINT =
  process.env.SERVICEWARE_WH_ENDPOINT_ON_CALL_ENDED || '/PhoneBox/TelephonyHook/OnCallDisconnected';
const PORT = process.env.PORT || 4000;

// Middleware zur Prüfung des Shared Secret
app.use((req, res, next) => {
  const auth = req.header('Authorization');
  if (auth === `Bearer ${SHARED_SECRET}`) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
});

app.post(CALL_CONNECT_ENDPOINT, (req, res) => {
  logger.info('OnCallConnected empfangen:', req.body);
  res.json({ status: 'received', event: 'OnCallConnected' });
});

app.post(CALL_DISCONNECT_ENDPOINT, (req, res) => {
  logger.info('OnCallDisconnected empfangen:', req.body);
  res.json({ status: 'received', event: 'OnCallDisconnected' });
});

app.listen(PORT, () => {
  logger.info(`Serviceware Mock Server läuft auf Port ${PORT}`);
});
