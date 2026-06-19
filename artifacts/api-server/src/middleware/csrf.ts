import { randomBytes, timingSafeEqual } from "crypto";
import { Router, type RequestHandler } from "express";

export const csrfRouter = Router();

csrfRouter.get("/auth/csrf", (req, res): void => {
  const session = req.session as any;
  if (!session.csrfToken) {
    session.csrfToken = randomBytes(32).toString("hex");
  }
  res.json({ token: session.csrfToken });
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfProtection: RequestHandler = (req, res, next): void => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const session = req.session as any;
  const sessionToken: string | undefined = session.csrfToken;
  const headerToken = req.headers["x-csrf-token"];

  if (
    !sessionToken ||
    typeof headerToken !== "string" ||
    !headerToken ||
    !timingSafeEqual(Buffer.from(sessionToken), Buffer.from(headerToken))
  ) {
    res.status(403).json({ error: "CSRFトークンが無効です" });
    return;
  }

  next();
};
