// Custom server so this app can run under cPanel's "Setup Node.js App"
// (Phusion Passenger), which starts a Node app by executing a single JS
// file directly rather than running an npm script — it can't invoke the
// `next start` CLI itself. Passenger sets PORT (and NODE_ENV=production,
// via the app's "Production" mode setting), and this file just needs to
// listen on that port. Pattern is straight from the Next.js docs
// (node_modules/next/dist/docs/01-app/02-guides/custom-server.md).
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Ready on port ${port} (${dev ? "development" : "production"})`);
  });
});
