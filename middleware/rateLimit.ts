import { NextApiRequest, NextApiResponse } from "next";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Create a rate limiter instance - 5 attempts per minute
const loginRateLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60, // per 60 seconds (1 minute)
});

// Rate limiting middleware for login attempts
export const loginRateLimitMiddleware = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) => {
  try {
    // Use IP address as key for rate limiting
    const key =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

    await loginRateLimiter.consume(key.toString());
    next();
  } catch (error) {
    // Rate limit exceeded
    return res.status(429).json({
      message: "Too many login attempts. Please try again after 1 minute.",
    });
  }
};

// General API rate limiter - 60 requests per minute
const apiRateLimiter = new RateLimiterMemory({
  points: 60, // 60 requests
  duration: 60, // per 60 seconds (1 minute)
});

// Rate limiting middleware for general API requests
export const apiRateLimitMiddleware = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) => {
  try {
    const key =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

    await apiRateLimiter.consume(key.toString());
    next();
  } catch (error) {
    // Rate limit exceeded
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
  }
};
