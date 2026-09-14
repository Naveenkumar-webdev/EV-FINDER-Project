const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5500;
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';
const PUBLIC_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const serverOptions = {
    maxHeaderSize: 64 * 1024 // 64KB max header size to prevent header overflow
};

const server = http.createServer(serverOptions, (req, res) => {
    // Handle CORS preflight options
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        });
        res.end();
        return;
    }

    // Proxy /api requests to Spring Boot Backend
    if (req.url.startsWith('/api')) {
        try {
            const targetUrl = new url.URL(req.url, BACKEND_URL);
            const transport = targetUrl.protocol === 'https:' ? https : http;

            // Clean request headers for proxying
            const proxyHeaders = { ...req.headers };
            proxyHeaders.host = targetUrl.host;
            delete proxyHeaders['connection'];
            delete proxyHeaders['keep-alive'];
            delete proxyHeaders['transfer-encoding'];
            delete proxyHeaders['expect'];

            const options = {
                hostname: targetUrl.hostname,
                port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
                path: targetUrl.pathname + targetUrl.search,
                method: req.method,
                headers: proxyHeaders,
                maxHeaderSize: 64 * 1024,
                rejectUnauthorized: false
            };

            const proxyReq = transport.request(options, (proxyRes) => {
                const resHeaders = {
                    ...proxyRes.headers,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
                };
                delete resHeaders['transfer-encoding'];

                res.writeHead(proxyRes.statusCode, resHeaders);
                proxyRes.pipe(res, { end: true });
            });

            proxyReq.on('error', (err) => {
                console.error('[API PROXY ERROR]', err.message);
                res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: 'Backend API connection failed', message: err.message }));
            });

            req.pipe(proxyReq, { end: true });
            return;
        } catch (e) {
            console.error('[PROXY EXCEPTION]', e);
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Proxy internal error', message: e.message }));
            return;
        }
    }

    // Serve static frontend files
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(PUBLIC_DIR, reqUrl === '/' ? 'index.html' : reqUrl);
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (!path.extname(filePath)) {
                filePath += '.html';
            }
        }
        
        let extname = String(path.extname(filePath)).toLowerCase();
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1>', 'utf-8');
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${error.code}`, 'utf-8');
                }
            } else {
                const contentType = MIME_TYPES[extname] || 'application/octet-stream';
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(content, 'utf-8');
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend & API Proxy Server running on port ${PORT}`);
    console.log(`Backend Target URL: ${BACKEND_URL}`);
});
