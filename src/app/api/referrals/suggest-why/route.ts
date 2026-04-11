import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

const MODEL_PRIORITY = [
  "gemini-3.1-flash-lite-preview",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export async function POST(req: NextRequest) {
  try {
    const { jobRole, company } = await req.json();

    if (!jobRole || !company) {
      return NextResponse.json({ error: "Job role and company are required" }, { status: 400 });
    }

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError: any;

    for (const modelName of MODEL_PRIORITY) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `Generate a short, professional, and personalized reason (1 sentence) for a job seeker explaining why they want to work at ${company} as a ${jobRole}. 
Focus on common company values, products, or industry impact. 
Return only the text of the reason. 
Example for Stripe: "I've long admired how Stripe simplifies complex financial infrastructure for developers worldwide."`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        return NextResponse.json({ suggestion: text });
      } catch (err: any) {
        lastError = err;
        if (err?.status === 404 || err?.status === 429) continue;
        throw err;
      }
    }
    throw lastError;
  } catch (error: any) {
    console.error("Suggest Why Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
