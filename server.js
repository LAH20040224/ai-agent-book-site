// 极简静态文件服务器（仅使用 Node 内置模块，无需安装任何依赖）。
// 支持 MkDocs 的目录式 URL：/book/chapter1/ -> /book/chapter1/index.html
// 可通过 npm run dev -- --port 7100 --host 0.0.0.0 或 PORT/HOST 环境变量指定监听地址。

const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const PORT = Number(argValue('--port', process.env.PORT || 7100));
const HOST = argValue('--host', process.env.HOST || '0.0.0.0');
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return send(res, 400, 'Bad Request');
  }

  // 防止路径穿越
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  let target = filePath;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  if (!fs.existsSync(target) && !urlPath.endsWith('/') && !path.extname(urlPath)) {
    // MkDocs 目录式 URL：补全 /index.html
    const asDir = path.join(filePath, 'index.html');
    if (fs.existsSync(asDir)) {
      return send(res, 301, '', { Location: urlPath + '/' });
    }
  }
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    const notFound = path.join(ROOT, '404.html');
    const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : '404 Not Found';
    return send(res, 404, body, { 'Content-Type': 'text/html; charset=utf-8' });
  }

  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`《深入理解 AI Agent》学习网站已启动: http://localhost:${PORT}/`);
});
