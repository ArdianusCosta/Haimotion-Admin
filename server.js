// server.js - Entry point for cPanel Setup Node.js App (Phusion Passenger)
const { createServer } = require('http');
const { parse } = require('url');

// 1. Force production mode and load environment variables from .env
process.env.NODE_ENV = 'production';
try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(process.cwd());
} catch (e) {
  console.warn('Could not preload @next/env, relying on default env loading:', e.message);
}

const next = require('next');

// 2. dev MUST be false for cPanel production
const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

console.log(`[Startup] Starting Next.js in production mode on port ${port}...`);
console.log(`[Startup] ACTIVE_DB: ${process.env.ACTIVE_DB || 'not set'}`);
console.log(`[Startup] BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || 'not set'}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    console.log('[Startup] Next.js app prepared successfully.');
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        res.statusCode = 500;
        res.end(`Internal Server Error\n${err ? err.stack || err.message : ''}`);
      }
    })
    .once('error', (err) => {
      console.error('[Fatal] Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Next.js production server ready on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('[Fatal] Failed to prepare Next.js app:', err);
    process.exit(1);
  });
