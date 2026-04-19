import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 }
      );
    }

    const trimmedResume = resumeText.slice(0, 5000);
    const trimmedJD = jobDescription.slice(0, 3000);

    const prompt = `Generate a professional cover letter based on the resume and job description.

Resume:
"""
${trimmedResume}
"""

Job Description:
"""
${trimmedJD}
"""

Requirements:
- Tailored to the specific job role mentioned in the JD
- Highlight the most relevant skills and experiences from the resume
- Professional and formal tone
- 200-300 words
- Include proper greeting and closing

Return ONLY valid JSON:

{
  "coverLetter": "the full cover letter text"
}

Rules:
- No extra text outside JSON
- Strict JSON only
- Use proper paragraph breaks with \\n`;

    const text = await callGemini(prompt, { label: "CoverLetter", timeoutMs: 25_000 });

    try {
      const parsed = extractJson(text);

      return NextResponse.json({
        coverLetter: parsed.coverLetter || "",
      });
    } catch {
      console.error("[CoverLetter] JSON Parse Error:", text);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[CoverLetter] Error:", error);
    const isTimeout = error?.message?.includes("Timed out");
    const is429 = error?.status === 429 || error?.message?.includes("429");
    return NextResponse.json(
      { error: isTimeout ? "Generation timed out — please try again." : is429 ? "Rate limit reached. Wait 60s." : `Failed: ${error.message}` },
      { status: is429 ? 429 : 500 }
    );
  }
}
