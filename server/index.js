import express from 'express';
import cors from 'cors';
import db from './db.js';
import cardsRouter from './routes/cards.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/cards', cardsRouter);
app.get('/api/health', (req, res) => res.json({ ok: true }));

async function start() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
