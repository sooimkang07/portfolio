// Local bridge to Yap's existing audio-processing backend. No database writes.
const http = require('node:http');
const allowed = new Set(['http://localhost:5500', 'http://127.0.0.1:5500']);
http.createServer({maxHeaderSize: 65536}, async (req, res) => {
  const origin = req.headers.origin;
  if (!allowed.has(origin)) { res.writeHead(403); res.end(); return; }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Yap-Duration-Ms, X-Yap-Thread-Context');
  if (req.url !== '/api/process-audio') { res.writeHead(404); res.end(); return; }
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 25 * 1024 * 1024) { res.writeHead(413); res.end(); return; }
      chunks.push(chunk);
    }
    const headers = {};
    for (const key of ['content-type', 'x-yap-duration-ms', 'x-yap-thread-context']) {
      if (req.headers[key]) headers[key] = req.headers[key];
    }
    const response = await fetch('https://www.joinyap.chat/api/process-audio', {
      method: 'POST', headers, body: Buffer.concat(chunks), signal: AbortSignal.timeout(120000),
    });
    res.writeHead(response.status, {'Content-Type': 'application/json'});
    res.end(await response.text());
  } catch {
    res.writeHead(502, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: 'Yap audio processing is unavailable. Please try again.'}));
  }
}).listen(3003, '127.0.0.1', () => console.log('Yap demo audio bridge: http://localhost:3003'));
