import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3421;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded games as static files
app.use('/static/games', express.static(path.join(__dirname, '../../games')));

// Health check
app.get('/', (req, res) => {
  res.json({ name: 'GameNode API', status: 'running', version: '0.1.0' });
});

// Routes
import gamesRouter from './routes/games.js';
app.use('/api/games', gamesRouter);

app.listen(PORT, () => {
  console.log(`🎮 GameNode API running on http://localhost:${PORT}`);
});
