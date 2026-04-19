import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    // 1. Validate Input
    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 }
      );
    }

    // 2. Trim inputs to optimize token usage
    const trimmedResume = resumeText.slice(0, 5000);
    const trimmedJD = jobDescription.slice(0, 3000);

    // 3. Structured AI Prompt — SINGLE CALL for all results
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

    // 4. Call Gemini (centralized, with timeout)
    const text = await callGemini(prompt, { label: "Analyze", timeoutMs: 25_000 });

    // 5. Safely Extract JSON
    try {
      const analysis = extractJson(text);

      return NextResponse.json({
        matchScore: analysis.matchScore ?? 0,
        reason: analysis.reason ?? "Analysis complete.",
        skillGaps: Array.isArray(analysis.skillGaps) ? analysis.skillGaps : [],
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
        atsIssues: Array.isArray(analysis.atsIssues) ? analysis.atsIssues : [],
        jobTitle: analysis.jobTitle || "",
        company: analysis.company || "",
      });
    } catch (parseError) {
      console.error("[Analyze] JSON Parse Error. Raw response:", text);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Analyze] API Error:", error);

    const isTimeout = error?.message?.includes("Timed out");
    const is429 = error?.status === 429 || error?.message?.includes("429");
    
    const msg = isTimeout
      ? "Analysis is taking too long. Please try again — the AI service may be under load."
      : is429
      ? "API rate limit reached. Please wait 60 seconds and try again."
      : `Analysis failed: ${error.message || "Unknown error"}`;

    return NextResponse.json({ error: msg }, { status: is429 ? 429 : 500 });
  }
}
