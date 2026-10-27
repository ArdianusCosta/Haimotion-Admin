// server.js - Entry point for cPanel Setup Node.js App (Phusion Passenger)
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');

// 1. Force working directory to the directory of server.js (Crucial for cPanel Passenger!)
process.chdir(__dirname);

// 2. Force production mode and load environment variables from .env
process.env.NODE_ENV = 'production';
try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(__dirname);
} catch (e) {
  console.warn('Could not preload @next/env:', e.message);
}

const next = require('next');

const dev = false;
const port = process.env.PORT || 3000;

console.log(`[Startup] Directory: ${__dirname}`);
console.log(`[Startup] Port/Socket: ${port}`);
console.log(`[Startup] ACTIVE_DB: ${process.env.ACTIVE_DB || 'not set'}`);
console.log(`[Startup] BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || 'not set'}`);

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    console.log('[Startup] Next.js app prepared successfully.');
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        res.statusCode = 500;
        res.end(`Internal Server Error\n${err ? err.stack || err.message : ''}`);
      }
    });

    server.once('error', (err) => {
      console.error('[Fatal] Server error:', err);
      process.exit(1);
    });

    // Standard Passenger listen call
    server.listen(port, () => {
      console.log(`> Next.js production server ready on ${port}`);
    });
  })
  .catch((err) => {
    console.error('[Fatal] Failed to prepare Next.js app:', err);
    process.exit(1);
  });
