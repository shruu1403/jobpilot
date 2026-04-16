import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
      console.log(`[PriorityActions] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(`[PriorityActions] Success with model: ${modelName}`);
      return response.text();
    } catch (err: any) {
      lastError = err;
      const status = err?.status;
      if (status === 429 || status === 404) {
        console.warn(`[PriorityActions] Model ${modelName} failed (${status}). Trying next...`);
        continue;
      }
      throw err;
    }
  }

  const is429 = lastError?.status === 429 || lastError?.message?.includes("429");
  if (is429) {
    throw new Error("API rate limit reached");
  }
  throw lastError || new Error("All models failed.");
}

export async function POST(req: NextRequest) {
  try {
    const { actions } = await req.json();

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ actions: [] });
    }

    // Skip AI refinement for basic fallbacks
    if (actions[0].type === "no_resume") {
      return NextResponse.json({ actions });
    }

    const actionsForAI = actions.map((a: any) => ({
      title: a.title,
      description: a.description,
    }));

    const prompt = `Rewrite these job search action items to be more concise, motivating, and human-friendly. Keep titles under 8 words. Keep descriptions under 15 words. Maintain the exact same meaning, intent, and number of items.

Actions:
${JSON.stringify(actionsForAI, null, 2)}

Return ONLY valid JSON array (no markdown, no extra text):
[{ "title": "...", "description": "..." }, ...]`;

    const text = await callGemini(prompt);

    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
       throw new Error("Invalid format from AI");
    }
    
    const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));

    if (Array.isArray(parsed) && parsed.length === actions.length) {
      const refinedActions = actions.map((action, i) => ({
        ...action,
        title: parsed[i].title || action.title,
        description: parsed[i].description || action.description,
      }));
      return NextResponse.json({ actions: refinedActions });
    }
    
    return NextResponse.json({ actions }); // Fallback to raw if parsing fails
  } catch (error: any) {
    console.error("[PriorityActions API] Error:", error);
    // If AI fails, just return whatever the client sent as a safe fallback
    return NextResponse.json(
      { error: "AI refinement failed, falling back to raw actions" },
      { status: 500 }
    );
  }
}
