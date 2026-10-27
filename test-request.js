const http = require('http');
const { parse } = require('url');

process.chdir(__dirname);
process.env.NODE_ENV = 'production';
try {
  require('@next/env').loadEnvConfig(__dirname);
} catch (e) {}

const next = require('next');
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

async function run() {
  console.log('[Test] Preparing Next.js...');
  await app.prepare();
  console.log('[Test] Next.js prepared. Starting internal listener...');

  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res, parse(req.url, true));
    } catch (err) {
      console.error('[Test] CATCH in handle:', err);
      res.statusCode = 500;
      res.end('Error: ' + (err.stack || err.message));
    }
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    console.log('[Test] Requesting http://127.0.0.1:' + port + '/ ...');
    http.get(`http://127.0.0.1:${port}/`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('=== RESPONSE STATUS ===', res.statusCode);
        console.log('=== RESPONSE BODY PREVIEW ===\n', body.slice(0, 400));
        server.close();
        process.exit(0);
      });
    }).on('error', (e) => {
      console.error('[Test] Request failed:', e);
      server.close();
      process.exit(1);
    });
  });
}

run().catch((err) => {
  console.error('[Test] Fatal error:', err);
  process.exit(1);
});
