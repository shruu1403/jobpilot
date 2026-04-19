import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";
import { extractTextFromBuffer } from "@/lib/extractText";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const existingText = formData.get("text") as string | null;
    const jobRole = formData.get("jobRole") as string | null;
    const company = formData.get("company") as string | null;

    let text = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractTextFromBuffer(buffer, file.type);
    } else if (existingText) {
      text = existingText;
    } else {
      return NextResponse.json({ error: "No resume content provided" }, { status: 400 });
    }

    const prompt = `You are an expert career consultant. Analyze the following resume text and provide structured data for a job referral application.

RESUME TEXT:
${text}

JOB CONTEXT (Optional):
- Target Role: ${jobRole || "Not specified"}
- Target Company: ${company || "Not specified"}

TASK:
1. **Brief Background**: Generate a 2-3 line professional summary. Include current/most recent role, experience level (e.g., student, fresher, 5+ years experience), and key domains. Make it personalized, not generic.
2. **Top Skills**: Extract all important technologies, languages, tools, and methodologies mentioned in the Skills section, Projects, and Work Experience. Deduplicate them and list the most relevant ones first.
3. **Links**: Extract the most relevant "Portfolio" or "Personal Website" link. Prioritize portfolio > GitHub > LinkedIn. Ensure it is a valid URL starting with http/https.
4. **Why This Company** (Only if Job Context is provided): Generate a short (1-2 sentences) personalized, compelling reason why the candidate admires or wants to work at the target company. Use common knowledge about the company if available, or keep it professional and mission-driven.

Return ONLY strict JSON in this exact shape:
{
  "background": "string",
  "keySkills": "string (comma separated list)",
  "portfolioLink": "string (URL or empty)",
  "whyCompany": "string (personalized reason or empty)"
}

Do NOT truncate content randomly. Scan the entire text including projects and contact sections.`;

    const rawText = await callGemini(prompt, { label: "Autofill", timeoutMs: 20_000 });
    const analysis = extractJson(rawText);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Autofill API Error:", error);
    const isTimeout = error?.message?.includes("Timed out");
    return NextResponse.json(
      { error: isTimeout ? "Analysis timed out. Please retry." : error.message || "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
