import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { jobRole, company } = await req.json();

    if (!jobRole || !company) {
      return NextResponse.json({ error: "Job role and company are required" }, { status: 400 });
    }

    const prompt = `Generate a short, professional, and personalized reason (1 sentence) for a job seeker explaining why they want to work at ${company} as a ${jobRole}. 
Focus on common company values, products, or industry impact. 
Return only the text of the reason. 
Example for Stripe: "I've long admired how Stripe simplifies complex financial infrastructure for developers worldwide."`;

    // Very short timeout — this is a lightweight suggestion
    const text = await callGemini(prompt, { label: "SuggestWhy", timeoutMs: 10_000 });

    return NextResponse.json({ suggestion: text.trim() });
  } catch (error: any) {
    console.error("Suggest Why Error:", error);
    // Non-critical — silently fail and let user write their own
    return NextResponse.json({ suggestion: "" });
  }
}
