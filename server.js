import app from './index.mjs';
import logger from './logger.mjs';

// Start the server

const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1 /* number of proxies between user and server */);

app.listen(PORT, () => {
  logger.info(`Server läuft auf Port ${PORT}`);
});
