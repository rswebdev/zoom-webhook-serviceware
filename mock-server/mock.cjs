// Minimaler Mock-Server für Serviceware Webhook
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const SHARED_SECRET = process.env.SERVICEWARE_SHARED_SECRET || 'test';
const PORT = process.env.PORT || 4000;

// Middleware zur Prüfung des Shared Secret
app.use((req, res, next) => {
  const auth = req.header('Authorization');
  if (auth === `Bearer ${SHARED_SECRET}`) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
});

app.post('/PhoneBox/TelephonyHook/OnCallConnected', (req, res) => {
  console.log('OnCallConnected empfangen:', req.body);
  res.json({ status: 'received', event: 'OnCallConnected' });
});

app.post('/PhoneBox/TelephonyHook/OnCallDisconnected', (req, res) => {
  console.log('OnCallDisconnected empfangen:', req.body);
  res.json({ status: 'received', event: 'OnCallDisconnected' });
});

app.listen(PORT, () => {
  console.log(`Serviceware Mock Server läuft auf Port ${PORT}`);
});
