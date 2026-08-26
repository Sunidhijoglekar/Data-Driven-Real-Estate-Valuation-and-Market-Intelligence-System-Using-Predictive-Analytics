import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

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

    // ==========================================
    // MIDDLEWARE
    // ==========================================

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ==========================================
    // UPLOADS DIRECTORY
    // ==========================================

    const uploadsDir = path.join(__dirname, '../uploads');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    app.use('/uploads', express.static(uploadsDir));

    // ==========================================
    // HEALTH CHECK
    // ==========================================

    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            system: 'Data-Driven Real Estate Valuation and Market Intelligence System',
            timestamp: new Date().toISOString()
        });
    });

    // ==========================================
    // API ROUTES
    // ==========================================

    app.use('/api/auth', authRoutes);
    app.use('/api/properties', propertyRoutes);
    app.use('/api/bids', bidRoutes);
    app.use('/api/ml', mlRoutes);
    app.use('/api/gemini', geminiRoutes);

    // ==========================================
    // FRONTEND
    // ==========================================

    const frontendDir = path.join(__dirname, '../frontend');

    if (process.env.NODE_ENV !== 'production') {

        const viteConfigPath = path.join(
            frontendDir,
            'vite.config.js'
        );

        // Load Vite only in development. Keeping this import dynamic prevents
        // production/API startup from depending on Rollup's optional native package.
        const { createServer: createViteServer } = await import('vite');

        const vite = await createViteServer({
            root: frontendDir,
            configFile: viteConfigPath,
            server: {
                middlewareMode: true,
                hmr: false
            },
            appType: 'spa'
        });

        app.use(vite.middlewares);

    } else {

        const distPath = path.join(
            frontendDir,
            'dist'
        );

        app.use(express.static(distPath));

        app.get('*', (req, res) => {
            res.sendFile(
                path.join(distPath, 'index.html')
            );
        });
    }

    // ==========================================
    // START SERVER
    // ==========================================

    // Start on the configured port. If that port is already occupied by
    // another copy of the application, automatically try the next ports.
    const startHttpServer = (port, attemptsLeft = 10) => {
        const server = app.listen(port, '0.0.0.0');

        server.once('listening', () => {
            const actualPort = server.address().port;
            const browserURL = `http://localhost:${actualPort}`;

            console.log('');
            console.log('==========================================');
            console.log(' Real Estate Valuation System');
            console.log('==========================================');
            console.log(` Server running at: ${browserURL}`);
            console.log(` API health check: ${browserURL}/api/health`);
            if (actualPort !== Number(PORT)) {
                console.log(` Port ${PORT} was busy, so the app automatically switched to ${actualPort}.`);
            }
            console.log('==========================================');
            console.log('');

            setTimeout(() => {
                if (process.platform === 'win32') {
                    exec(`start "" "${browserURL}"`);
                } else if (process.platform === 'darwin') {
                    exec(`open "${browserURL}"`);
                } else {
                    exec(`xdg-open "${browserURL}"`);
                }
            }, 500);
        });

        server.once('error', (error) => {
            if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
                const nextPort = Number(port) + 1;
                console.warn(`Port ${port} is already in use. Trying ${nextPort}...`);
                setTimeout(() => startHttpServer(nextPort, attemptsLeft - 1), 100);
            } else {
                console.error('Failed to start HTTP server:', error);
                process.exit(1);
            }
        });
    };

    startHttpServer(Number(PORT));
}

// ==========================================
// START APPLICATION
// ==========================================

startServer().catch((error) => {

    console.error(
        'Failed to start server:',
        error
    );

    process.exit(1);
});