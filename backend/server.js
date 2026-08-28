import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads serving
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'Data-Driven Real Estate Valuation and Market Intelligence System',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/bids', bidRoutes);
  app.use('/api/ml', mlRoutes);
  app.use('/api/gemini', geminiRoutes);

  // Vite Middleware in Development
  const frontendDir = path.join(__dirname, '../frontend');
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: frontendDir,
      configFile: path.join(frontendDir, 'vite.config.js'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(frontendDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
