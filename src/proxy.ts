import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "127.0.0.1";
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
}

const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/search": { limit: 10, windowMs: 60_000 },
  "/api/leads/import": { limit: 5, windowMs: 60_000 },
  "/api/enrich": { limit: 5, windowMs: 60_000 },
  "/api/dodo/checkout": { limit: 5, windowMs: 60_000 },
  "/api/dodo/portal": { limit: 10, windowMs: 60_000 },
  "/api/templates": { limit: 30, windowMs: 60_000 },
};

function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } | null {
  if (pathname in RATE_LIMITS) {
    return RATE_LIMITS[pathname];
  }

  if (pathname.startsWith("/api/leads/")) {
    return { limit: 60, windowMs: 60_000 };
  }

  if (pathname.startsWith("/api/")) {
    return { limit: 30, windowMs: 60_000 };
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const config = getRateLimitConfig(pathname);
  if (!config) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);
  const key = `${clientIp}:${pathname}`;
  const { allowed, remaining, resetTime } = checkRateLimit(
    key,
    config.limit,
    config.windowMs
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
          "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(config.limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
