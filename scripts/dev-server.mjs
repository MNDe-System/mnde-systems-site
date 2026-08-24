/* Local dev server for MNDe.
 *
 * Serves the built static site from dist/ and mounts the SAME Cloudflare Pages
 * Function handlers at /api/*, so the real frontend runs against the real
 * endpoints locally. This is a development convenience only — production is
 * Cloudflare Pages (static assets + functions/).
 *
 * Env:
 *   PORT              default 8788
 *   MNDE_DEV_MAIL     "stub" routes contact mail to an in-memory recorder so
 *                     the success UI can be exercised without a real provider.
 *                     Any other value uses the real Resend path (needs keys).
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { onRequest as simulate } from "../functions/api/simulate.js";
import { onRequest as contact } from "../functions/api/contact.js";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT || 8788);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".zip": "application/zip",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2"
};

// Dev-only stub mailer so the contact success path is exercisable offline.
const recorder = [];
function devEnv() {
  const base = { ...process.env };
  if (process.env.MNDE_DEV_MAIL === "stub") {
    base.RESEND_API_KEY = "dev_stub";
    base.CONTACT_FROM = "MNDe Dev <dev@mndesystems.com>";
    base.CONTACT_TO = base.CONTACT_TO || "contact@mndesystems.com";
  }
  return base;
}

function nodeToWebRequest(req, bodyBuffer) {
  const url = `http://localhost:${PORT}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v) headers.set(k, Array.isArray(v) ? v.join(",") : v);
  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") init.body = bodyBuffer;
  return new Request(url, init);
}

async function sendWebResponse(res, webRes) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  const buf = Buffer.from(await webRes.arrayBuffer());
  res.end(buf);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function serveStatic(req, res, pathname) {
  let rel = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  if (rel === "/" || rel === "") rel = "/index.html";
  let filePath = join(DIST, rel);
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    // try adding .html for extensionless routes
    if (!extname(filePath)) filePath += ".html";
  }
  try {
    const data = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader("content-type", TYPES[extname(filePath)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<h1>404</h1>");
  }
}

const server = createServer(async (req, res) => {
  const pathname = req.url.split("?")[0];
  try {
    if (pathname === "/api/simulate") {
      const body = await readBody(req);
      return sendWebResponse(res, await simulate({ request: nodeToWebRequest(req, body) }));
    }
    if (pathname === "/api/contact") {
      const body = await readBody(req);
      const env = devEnv();
      const deps = {};
      if (process.env.MNDE_DEV_MAIL === "stub") {
        deps.sendEmail = async (_cfg, message) => {
          recorder.push({ to: message.to, subject: message.subject });
          return { id: `dev_${recorder.length}` };
        };
      }
      // The contact route reads env itself; for the stub we shim processContact
      // via a wrapped handler that injects deps.
      if (deps.sendEmail) {
        const { processContact } = await import("../functions/_lib/contact.js");
        const { json, errorResponse, readJson, rateLimit } = await import("../functions/_lib/http.js");
        const request = nodeToWebRequest(req, body);
        const limited = rateLimit(request, { limit: 5, windowMs: 60_000, key: "contact" });
        if (!limited.ok) return sendWebResponse(res, limited.response);
        const parsed = await readJson(request);
        if (!parsed.ok) return sendWebResponse(res, parsed.response);
        try {
          const meta = await processContact(parsed.value, env, deps);
          return sendWebResponse(res, json({ ok: true, status: "queued", request_id: meta.request_id, timestamp: meta.timestamp, lifecycle: ["validated", "queued", "review"] }));
        } catch (e) {
          return sendWebResponse(res, errorResponse(422, e.code || "ERROR", e.message));
        }
      }
      return sendWebResponse(res, await contact({ request: nodeToWebRequest(req, body), env }));
    }
    return serveStatic(req, res, pathname);
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: { code: "DEV_SERVER_ERROR", message: String(error) } }));
  }
});

server.listen(PORT, () => {
  console.log(`MNDe dev server on http://localhost:${PORT} (mail=${process.env.MNDE_DEV_MAIL || "real"})`);
});
