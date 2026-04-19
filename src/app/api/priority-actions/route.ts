import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJsonArray } from "@/lib/gemini";

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

    // Short timeout — this is a lightweight refinement call
    const text = await callGemini(prompt, { label: "PriorityActions", timeoutMs: 15_000 });

    const parsed = extractJsonArray(text);

    if (Array.isArray(parsed) && parsed.length === actions.length) {
      const refinedActions = actions.map((action: any, i: number) => ({
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
