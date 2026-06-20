import { createRequire } from "module";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { csrfRouter, csrfProtection } from "./middleware/csrf";
import { logger } from "./lib/logger";
import db from "./lib/sqlite";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SqliteStoreFactory = require("better-sqlite3-session-store") as (
  dep: { Store: typeof session.Store },
) => new (options: { client: typeof db; expired?: { clear?: boolean; intervalMs?: number } }) => session.Store;

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but was not provided.");
}

const isProd = process.env.NODE_ENV === "production";

function getAllowedOrigins(): string[] | true {
  if (!isProd) return true;
  const domains = process.env.REPLIT_DOMAINS;
  if (!domains) return true;
  return domains.split(",").map((d) => `https://${d.trim()}`);
}

const SqliteStore = SqliteStoreFactory(session);

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["https://www.youtube.com", "https://open.spotify.com"],
        connectSrc: ["'self'"],
      },
    },
  }),
);

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

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  }),
);

app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "64kb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SqliteStore({
      client: db,
      expired: {
        clear: true,
        intervalMs: 15 * 60 * 1000,
      },
    }),
    cookie: {
      httpOnly: true,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  }),
);

app.use("/api", csrfRouter);
app.use("/api", csrfProtection);
app.use("/api", router);

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../../music-sns/dist");
app.use(express.static(frontendPath));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
