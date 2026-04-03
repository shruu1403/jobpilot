import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Primary: gemini-3.1-flash-lite-preview (high daily limit, fast)
// Fallbacks from verified available models list
const MODEL_PRIORITY = [
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

async function callGemini(prompt: string): Promise<string> {
  let lastError: any;

  for (const modelName of MODEL_PRIORITY) {
    try {
      console.log(`[Analyze] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(`[Analyze] Success with model: ${modelName}`);
      return response.text();
    } catch (err: any) {
      lastError = err;
      const status = err?.status;
      // Rate limited or model not found → try next
      if (status === 429 || status === 404) {
        console.warn(`[Analyze] Model ${modelName} failed (${status}). Trying next...`);
        continue;
      }
      throw err; // Other errors → fail immediately
    }
  }

  const is429 = lastError?.status === 429 || lastError?.message?.includes("429");
  if (is429) {
    throw new Error("API rate limit reached. Please wait 60 seconds and try again.");
  }
  throw lastError || new Error("All models failed.");
}

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

Return ONLY valid JSON:

{
  "matchScore": number (0-100),
  "reason": "short explanation",
  "skillGaps": ["skill1", "skill2", "skill3"],
  "suggestions": [
    "improvement suggestion 1",
    "improvement suggestion 2"
  ]
}

Rules:
- No extra text
- Strict JSON only
- Keep output concise`;

    // 4. Call Gemini (single call)
    const text = await callGemini(prompt);

    // 5. Safely Extract JSON
    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const jsonText = text.substring(jsonStart, jsonEnd);

      const analysis = JSON.parse(jsonText);

      return NextResponse.json({
        matchScore: analysis.matchScore ?? 0,
        reason: analysis.reason ?? "Analysis complete.",
        skillGaps: Array.isArray(analysis.skillGaps) ? analysis.skillGaps : [],
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
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

    const is429 = error?.status === 429 || error?.message?.includes("429");
    const msg = is429
      ? "API rate limit reached. Please wait 60 seconds and try again."
      : `Analysis failed: ${error.message || "Unknown error"}`;

    return NextResponse.json({ error: msg }, { status: is429 ? 429 : 500 });
  }
}
