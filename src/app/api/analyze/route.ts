import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";
import { checkUsage, incrementUsage, LIMITS } from "@/lib/rateLimit";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription, userId } = body;

    // 1. Rate-limit CHECK (don't increment yet)
    const isGuest = !userId;
    const identifier = isGuest ? getClientIp(req) : userId;
    const type = isGuest ? "ip" : "user";

    const { allowed, limit } = await checkUsage(identifier, type, "analyzer");

    if (!allowed) {
      const msg = isGuest
        ? `Daily limit reached (${limit} analyses/day for guests). Sign in for higher limits.`
        : `Daily limit reached (${limit} analyses/day). Please try again tomorrow.`;
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    // 2. Validate Input
    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 }
      );
    }

    // 3. Trim inputs to optimize token usage
    const trimmedResume = resumeText.slice(0, 5000);
    const trimmedJD = jobDescription.slice(0, 3000);

    // 4. Structured AI Prompt
    const prompt = `Compare the following resume and job description.

Resume:
"""
${trimmedResume}
"""

Job Description:
"""
${trimmedJD}
"""

Evaluate based on:
- Skills match
- Experience relevance
- Keyword alignment
- ATS (Applicant Tracking System) formatting issues

Return ONLY valid JSON:

{
  "jobTitle": "extracted job title",
  "company": "extracted company name (or 'Unknown Company')",
  "matchScore": number (0-100),
  "reason": "short explanation",
  "skillGaps": ["skill1", "skill2", "skill3"],
  "suggestions": [
    "improvement suggestion 1",
    "improvement suggestion 2"
  ],
  "atsIssues": [
    "formatting issue 1",
    "formatting issue 2"
  ]
}

Rules:
- No extra text
- Strict JSON only
- Keep output concise
- suggestions should contain exactly 2 highly actionable tips
- atsIssues should list specific ATS problems like missing keywords, weak action verbs, improper formatting, lack of measurable achievements`;

    // 5. Call Gemini (centralized, with timeout)
    const text = await callGemini(prompt, { label: "Analyze", timeoutMs: 25_000 });

    // 6. Safely Extract JSON
    const analysis = extractJson(text);

    // 7. Increment usage ONLY on success
    await incrementUsage(identifier, type, "analyzer");

    return NextResponse.json({
      matchScore: analysis.matchScore ?? 0,
      reason: analysis.reason ?? "Analysis complete.",
      skillGaps: Array.isArray(analysis.skillGaps) ? analysis.skillGaps : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      atsIssues: Array.isArray(analysis.atsIssues) ? analysis.atsIssues : [],
      jobTitle: analysis.jobTitle || "",
      company: analysis.company || "",
    });

  } catch (error: any) {
    console.error("[Analyze] API Error:", error);

    const isTimeout = error?.message?.includes("Timed out");
    const is429 = error?.status === 429 || error?.message?.includes("429");
    const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand");
    
    const msg = isTimeout
      ? "Analysis is taking too long. Please try again — the AI service may be under load."
      : is429
      ? "API rate limit reached. Please wait 60 seconds and try again."
      : is503
      ? "AI service is currently under high demand. Please try again in a moment."
      : `Analysis failed: ${error.message || "Unknown error"}`;

    return NextResponse.json({ error: msg }, { status: is429 ? 429 : 500 });
  }
}
