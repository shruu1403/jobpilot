import { NextRequest, NextResponse } from "next/server";
import { getUsageCount, LIMITS, type Feature } from "@/lib/rateLimit";

/**
 * Extracts the client IP from the request.
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

const VALID_FEATURES: Feature[] = ["analyzer", "referral"];

/**
 * GET  /api/quota?feature=analyzer&userId=xxx
 * → Returns  { count, limit }
 *
 * If userId is provided, returns the auth user's usage.
 * Otherwise, returns the guest (IP-based) usage.
 */
export async function GET(req: NextRequest) {
  const feature = req.nextUrl.searchParams.get("feature") as Feature;
  const userId = req.nextUrl.searchParams.get("userId");

  if (!feature || !VALID_FEATURES.includes(feature)) {
    return NextResponse.json(
      { error: "Invalid feature. Use 'analyzer' or 'referral'." },
      { status: 400 }
    );
  }

  let count = 0;
  let limit = 0;

  if (userId) {
    // Authenticated user — check by user ID
    count = await getUsageCount(userId, "user", feature);
    limit = LIMITS.auth[feature];
  } else {
    // Guest user — check by IP
    const ip = getClientIp(req);
    count = await getUsageCount(ip, "ip", feature);
    limit = LIMITS.guest[feature];
  }

  return NextResponse.json({ count, limit });
}
