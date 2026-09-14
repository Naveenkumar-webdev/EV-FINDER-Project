const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
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

const server = http.createServer((req, res) => {
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
    console.log(`Frontend static server running on all interfaces on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}/index.html`);
});
