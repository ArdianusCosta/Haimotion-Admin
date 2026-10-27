// server.js - Entry point for cPanel Setup Node.js App (Phusion Passenger)
const { createServer } = require('http');
const { parse } = require('url');

// 1. Force production mode and load environment variables from .env
process.env.NODE_ENV = 'production';
try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(process.cwd());
} catch (e) {
  console.warn('Could not preload @next/env:', e.message);
}

const next = require('next');

// 2. dev MUST be false for cPanel production
const dev = false;
const port = process.env.PORT || 3000;

console.log(`[Startup] Initializing Next.js in production mode...`);
console.log(`[Startup] Target port/socket: ${port}`);
console.log(`[Startup] ACTIVE_DB: ${process.env.ACTIVE_DB || 'not set'}`);
console.log(`[Startup] BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || 'not set'}`);

const app = next({ dev });
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

    // Handle both Phusion Passenger Unix domain socket and standard TCP port
    if (typeof port === 'string' && isNaN(Number(port))) {
      server.listen(port, () => {
        console.log(`> Next.js ready on Passenger socket: ${port}`);
      });
    } else {
      const numPort = parseInt(port, 10);
      server.listen(numPort, '0.0.0.0', () => {
        console.log(`> Next.js ready on http://0.0.0.0:${numPort}`);
      });
    }
  })
  .catch((err) => {
    console.error('[Fatal] Failed to prepare Next.js app:', err);
    process.exit(1);
  });
