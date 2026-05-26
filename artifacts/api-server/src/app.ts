import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

// Serve frontend static files when built together on Railway
const STATIC_DIR = path.resolve(process.cwd(), "artifacts/synorlab/dist/public");

// Dynamic config.js so apiUrl is always correct (same-origin on Railway)
app.get("/config.js", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.send(`window.__SYNORLAB_CONFIG__ = { apiUrl: "" };`);
});

app.use(express.static(STATIC_DIR));

// SPA fallback — let React Router handle all non-API routes
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

export default app;
