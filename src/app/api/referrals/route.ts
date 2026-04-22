import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";
import { checkUsage, incrementUsage, LIMITS } from "@/lib/rateLimit";
import type { ReferralFormValues } from "@/types/referral";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

function buildPrompt(values: ReferralFormValues & { variationSeed?: number }) {
  return `You are writing highly personalized referral outreach.

Generate exactly one LinkedIn message and one email draft for a job seeker.

Context:
- Job role: ${values.jobRole}
- Company: ${values.company}
- Tone: ${values.tone}
- Recipient name: ${values.recipientName || "Not provided"}
- Candidate background: ${values.background || "Not provided"}
- Key skills: ${values.keySkills || "Not provided"}
- Why this company: ${values.whyCompany || "Not provided"}
- Connection context: ${values.connectionContext}
- Job link or JD: ${values.jobLink || "Not provided"}
- Portfolio or resume link: ${values.portfolioLink || "Not provided"}
- Preferred message length: ${values.messageLength}
- Call to action: ${values.callToAction}
- Variation seed: ${values.variationSeed ?? 0}

Writing requirements:
- Sound human, concise, and credible.
- Avoid generic praise and robotic phrasing.
- Mention the company specifically.
- **CRITICAL**: You MUST seamlessly weave the "Why this company" reasoning into the message to demonstrate deep, personalized interest in the company. Do not ignore this field.
- Use the candidate background naturally and only if supported by the provided inputs.
- Align key skills with the role.
- Respect connection context:
  - Cold outreach: polite and concise.
  - Same college: warmer and more familiar.
  - Mutual connection: mention the connection naturally.
  - Recruiter: a bit more formal and direct.
  - Employee: collegial and respectful.
- Do not hallucinate facts, projects, or achievements.
- Do not repeat phrases between the LinkedIn message and the email.
- LinkedIn message should stay especially tight when message length is Short.
- Email subject should be clear and natural, not salesy.
- If a portfolio or resume link exists, include it only when it feels useful and not forced.

Return ONLY strict JSON in this exact shape:
{
  "linkedinMessage": "string",
  "email": {
    "subject": "string",
    "body": "string"
  }
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReferralFormValues & { variationSeed?: number; userId?: string };

    // 1. Rate-limit CHECK (don't increment yet)
    const isGuest = !body.userId;
    const identifier = isGuest ? getClientIp(request) : (body.userId as string);
    const type = isGuest ? "ip" : "user";

    const { allowed, limit } = await checkUsage(identifier, type, "referral");

    if (!allowed) {
      const msg = isGuest
        ? `Daily limit reached (${limit} referrals/day for guests). Sign in for higher limits.`
        : `Daily limit reached (${limit} referrals/day). Please try again tomorrow.`;
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    if (!body.jobRole?.trim() || !body.company?.trim()) {
      return NextResponse.json(
        { error: "Job role and company are required." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt({
      ...body,
      jobRole: body.jobRole.trim().slice(0, 120),
      company: body.company.trim().slice(0, 120),
      recipientName: body.recipientName?.trim().slice(0, 120) ?? "",
      background: body.background?.trim().slice(0, 1000) ?? "",
      keySkills: body.keySkills?.trim().slice(0, 400) ?? "",
      whyCompany: body.whyCompany?.trim().slice(0, 600) ?? "",
      jobLink: body.jobLink?.trim().slice(0, 500) ?? "",
      portfolioLink: body.portfolioLink?.trim().slice(0, 300) ?? "",
    });

    const rawText = await callGemini(prompt, { label: "Referrals", timeoutMs: 20_000 });
    const parsed = extractJson(rawText);

    // 2. Increment usage ONLY on success
    await incrementUsage(identifier, type, "referral");

    return NextResponse.json({
      linkedinMessage: String(parsed.linkedinMessage || "").trim(),
      email: {
        subject: String(parsed.email?.subject || "").trim(),
        body: String(parsed.email?.body || "").trim(),
      },
    });
  } catch (error: unknown) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    const message = error instanceof Error ? error.message : "Failed to generate referral drafts.";
    const isTimeout = message.includes("Timed out");
    const is429 = status === 429 || message.includes("429");
    const is503 = status === 503 || message.includes("503") || message.includes("high demand");

    const msg = isTimeout
      ? "Server busy. Please try again."
      : is429
      ? "AI rate limit reached. Retry in 1m."
      : is503
      ? "AI service is under high demand. Please try again in a moment."
      : message;

    return NextResponse.json({ error: msg }, { status: is429 ? 429 : 500 });
  }
}
