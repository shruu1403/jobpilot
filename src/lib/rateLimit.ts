import { supabase } from "@/lib/supabaseClient";

export const LIMITS = {
  guest: {
    analyzer: 3,
    referral: 7,
  },
  auth: {
    analyzer: 5,
    referral: 15,
  },
} as const;

export type Feature = "analyzer" | "referral";

/**
 * Try to increment usage for an IP or User.
 * Returns `{ allowed: true, count }` if under the limit,
 * or `{ allowed: false, count }` if the daily cap is reached.
 */
export async function incrementUsage(
  identifier: string,
  type: "ip" | "user",
  feature: Feature
): Promise<{ allowed: boolean; count: number }> {
  const limit = type === "ip" ? LIMITS.guest[feature] : LIMITS.auth[feature];

  const { data, error } = await supabase.rpc("increment_usage", {
    p_identifier: identifier,
    p_identifier_type: type,
    p_feature: feature,
    p_limit: limit,
  });

  if (error) {
    console.error("Rate limit DB error:", error);
    // Fail closed or open? Let's fail open to not block users if DB is slow,
    // but default to 1 so they don't abuse it.
    return { allowed: true, count: 1 };
  }

  return data as { allowed: boolean; count: number };
}

/** Return the current usage count for this IP/User today. */
export async function getUsageCount(
  identifier: string,
  type: "ip" | "user",
  feature: Feature
): Promise<number> {
  const { data, error } = await supabase.rpc("get_usage", {
    p_identifier: identifier,
    p_identifier_type: type,
    p_feature: feature,
  });

  if (error) {
    console.error("Rate limit DB check error:", error);
    return 0;
  }

  return data as number;
}

/** Check if a user/IP is allowed to use a feature without incrementing. */
export async function checkUsage(
  identifier: string,
  type: "ip" | "user",
  feature: Feature
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const limit = type === "ip" ? LIMITS.guest[feature] : LIMITS.auth[feature];
  const count = await getUsageCount(identifier, type, feature);

  return {
    allowed: count < limit,
    count,
    limit,
  };
}
