import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, matchScore, skillGaps } = await req.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text is required." },
        { status: 400 }
      );
    }

    const trimmedResume = resumeText.slice(0, 5000);
    const gapsStr = Array.isArray(skillGaps) && skillGaps.length > 0
      ? skillGaps.join(", ")
      : "None identified yet";

    const prompt = `Analyze this user's resume and job-readiness context.

Inputs:
- Resume text: """
${trimmedResume}
"""
- Match score from latest analysis: ${matchScore !== null && matchScore !== undefined ? matchScore : "null (no analysis done yet)"}
- Skill gaps identified: ${gapsStr}

Return ONLY valid JSON (no extra text, no markdown):

{
  "readiness": number (0-100),
  "summary": string,
  "improvements": string[]
}

CRITICAL RULES FOR TONE & PERSPECTIVE:
- Speak DIRECTLY to the user in the second person ("You have strong skills...", "Your portfolio shows..."). 
- DO NOT use the third person ("The candidate is...", "Shruti is...", "They have...").
- Keep summary concise (1-2 sentences max).
- Return exactly 2-3 improvements as short actionable phrases addressed to the user (e.g. "Add unit testing to your projects").

EVALUATION RULES:
- Be realistic (do NOT give 90+ easily).
- Consider missing skills heavily.
- Consider project depth and experience breadth.
- If no analysis has been done, evaluate purely from resume quality.
- Strict JSON only, no HTML, no markdown fences.`;

    const text = await callGemini(prompt, { label: "Readiness", timeoutMs: 20_000 });

    try {
      const result = extractJson(text);

      return NextResponse.json({
        readiness: Math.min(100, Math.max(0, result.readiness ?? 50)),
        summary: result.summary ?? "Your profile is being evaluated.",
        improvements: Array.isArray(result.improvements) ? result.improvements.slice(0, 3) : [],
      });
    } catch (parseError) {
      console.error("[Readiness] JSON Parse Error. Raw:", text);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Readiness] API Error:", error);
    const isTimeout = error?.message?.includes("Timed out");
    const is429 = error?.status === 429 || error?.message?.includes("429");
    const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand");

    const msg = isTimeout
      ? "Readiness check is taking too long. Please try again."
      : is429
      ? "API rate limit reached. Please wait and try again."
      : is503
      ? "AI service is currently under high demand. Please try again in a moment."
      : `Readiness computation failed: ${error.message || "Unknown error"}`;
    return NextResponse.json({ error: msg }, { status: is429 ? 429 : 500 });
  }
}
