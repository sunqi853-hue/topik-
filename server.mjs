import http from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || process.env.PORT || 4178);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
};

function sendFile(req, res, file) {
  const size = statSync(file).size;
  const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;

  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    const start = match && match[1] ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : size - 1;
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
    });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": size,
    "Accept-Ranges": "bytes",
  });
  createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = path.normalize(path.join(root, requested));

  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  sendFile(req, res, file);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`TOPIK 背词网页已启动：http://0.0.0.0:${port}/`);
});
