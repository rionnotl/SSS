import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "リクエストが多すぎます。15分後に再試行してください。" },
  skipSuccessfulRequests: false,
});
