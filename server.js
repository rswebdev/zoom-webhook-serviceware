import app from './index.mjs';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
