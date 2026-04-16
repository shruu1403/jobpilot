import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODEL_PRIORITY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

async function callGemini(prompt: string): Promise<string> {
  let lastError: any;

  for (const modelName of MODEL_PRIORITY) {
    try {
      console.log(`[Readiness] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(`[Readiness] Success with model: ${modelName}`);
      return response.text();
    } catch (err: any) {
      lastError = err;
      const status = err?.status;
      if (status === 429 || status === 404) {
        console.warn(`[Readiness] Model ${modelName} failed (${status}). Trying next...`);
        continue;
      }
      throw err;
    }
  }

  const is429 = lastError?.status === 429 || lastError?.message?.includes("429");
  if (is429) {
    throw new Error("API rate limit reached. Please wait and try again.");
  }
  throw lastError || new Error("All models failed.");
}

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

    const text = await callGemini(prompt);

    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const jsonText = text.substring(jsonStart, jsonEnd);
      const result = JSON.parse(jsonText);

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
    const is429 = error?.status === 429 || error?.message?.includes("429");
    const msg = is429
      ? "API rate limit reached. Please wait and try again."
      : `Readiness computation failed: ${error.message || "Unknown error"}`;
    return NextResponse.json({ error: msg }, { status: is429 ? 429 : 500 });
  }
}
