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
// Use PORT from Passenger or default to 3999 (avoid port 3000 which is blocked/in-use on shared hosting)
const port = process.env.PORT || 3999;

console.log(`[Startup] Directory: ${__dirname}`);
console.log(`[Startup] Target port/socket: ${port}`);
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

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Warn] Port ${port} is in use, falling back to random available port...`);
        server.listen(0);
      } else {
        console.error('[Fatal] Server error:', err);
        process.exit(1);
      }
    });

    server.listen(port, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      console.log(`> Next.js production server ready on ${actualPort}`);
    });
  })
  .catch((err) => {
    console.error('[Fatal] Failed to prepare Next.js app:', err);
    process.exit(1);
  });
