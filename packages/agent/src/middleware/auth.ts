import { Request, Response, NextFunction } from "express";

/**
 * Simple API key authentication middleware
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;
  const validApiKey = process.env.AGENT_API_KEY;

  // Skip auth if no API key is configured (development mode)
  if (!validApiKey) {
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  if (apiKey !== validApiKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
}

/**
 * Rate limiting state (in-memory, use Redis for production)
 */
const rateLimitState = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();

    const state = rateLimitState.get(key);

    if (!state || now > state.resetTime) {
      rateLimitState.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (state.count >= maxRequests) {
      const resetIn = Math.ceil((state.resetTime - now) / 1000);
      res.setHeader("Retry-After", resetIn.toString());
      return res.status(429).json({
        error: "Too many requests",
        resetIn: `${resetIn} seconds`,
      });
    }

    state.count++;
    next();
  };
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${err.message}`, err.stack);

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
}
