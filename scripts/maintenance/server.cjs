const fs = require("fs");
const path = require("path");
const http = require("http");
module.exports = function createServer(ROOT) {
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
  };
  return http.createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    } catch {}
    if (!fs.existsSync(file) && !path.extname(file) && fs.existsSync(file + ".html"))
      file += ".html";
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        return res.end();
      }
      const headers = {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Accept-Ranges": "bytes",
      };
      const match = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
      if (match) {
        const start = +match[1] || 0,
          end = match[2] ? Math.min(+match[2], st.size - 1) : st.size - 1;
        res.writeHead(206, {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${st.size}`,
          "Content-Length": end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { ...headers, "Content-Length": st.size });
        fs.createReadStream(file).pipe(res);
      }
    });
  });
};
