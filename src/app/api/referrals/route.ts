import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ReferralFormValues } from "@/types/referral";

const apiKey = process.env.GEMINI_API_KEY;

const MODEL_PRIORITY = [
  "gemini-3.1-flash-lite-preview",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

function parseJsonResponse(text: string) {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}") + 1;

  if (jsonStart === -1 || jsonEnd === 0) {
    throw new Error("AI did not return JSON.");
  }

  return JSON.parse(text.slice(jsonStart, jsonEnd));
}

async function callGemini(prompt: string) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: unknown) {
      lastError = error;
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;

      if (status === 429 || status === 404) {
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

function buildPrompt(values: ReferralFormValues & { variationSeed?: number }) {
  return `You are writing highly personalized referral outreach.

Generate exactly one LinkedIn message and one email draft for a job seeker.

Context:
- Job role: ${values.jobRole}
- Company: ${values.company}
- Tone: ${values.tone}
- Recipient name: ${values.recipientName || "Not provided"}
- Candidate background: ${values.background || "Not provided"}
- Key skills: ${values.keySkills || "Not provided"}
- Why this company: ${values.whyCompany || "Not provided"}
- Connection context: ${values.connectionContext}
- Job link or JD: ${values.jobLink || "Not provided"}
- Portfolio or resume link: ${values.portfolioLink || "Not provided"}
- Preferred message length: ${values.messageLength}
- Call to action: ${values.callToAction}
- Variation seed: ${values.variationSeed ?? 0}

Writing requirements:
- Sound human, concise, and credible.
- Avoid generic praise and robotic phrasing.
- Mention the company specifically.
- Use the candidate background naturally and only if supported by the provided inputs.
- Align key skills with the role.
- Respect connection context:
  - Cold outreach: polite and concise.
  - Same college: warmer and more familiar.
  - Mutual connection: mention the connection naturally.
  - Recruiter: a bit more formal and direct.
  - Employee: collegial and respectful.
- Do not hallucinate facts, projects, or achievements.
- Do not repeat phrases between the LinkedIn message and the email.
- LinkedIn message should stay especially tight when message length is Short.
- Email subject should be clear and natural, not salesy.
- If a portfolio or resume link exists, include it only when it feels useful and not forced.

Return ONLY strict JSON in this exact shape:
{
  "linkedinMessage": "string",
  "email": {
    "subject": "string",
    "body": "string"
  }
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReferralFormValues & { variationSeed?: number };

    if (!body.jobRole?.trim() || !body.company?.trim()) {
      return NextResponse.json(
        { error: "Job role and company are required." },
        { status: 400 }
      );
    }

    const prompt = buildPrompt({
      ...body,
      jobRole: body.jobRole.trim().slice(0, 120),
      company: body.company.trim().slice(0, 120),
      recipientName: body.recipientName?.trim().slice(0, 120) ?? "",
      background: body.background?.trim().slice(0, 1000) ?? "",
      keySkills: body.keySkills?.trim().slice(0, 400) ?? "",
      whyCompany: body.whyCompany?.trim().slice(0, 600) ?? "",
      jobLink: body.jobLink?.trim().slice(0, 500) ?? "",
      portfolioLink: body.portfolioLink?.trim().slice(0, 300) ?? "",
    });

    const rawText = await callGemini(prompt);
    const parsed = parseJsonResponse(rawText);

    return NextResponse.json({
      linkedinMessage: String(parsed.linkedinMessage || "").trim(),
      email: {
        subject: String(parsed.email?.subject || "").trim(),
        body: String(parsed.email?.body || "").trim(),
      },
    });
  } catch (error: unknown) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    const message =
      error instanceof Error ? error.message : "Failed to generate referral drafts.";
    const is429 = status === 429 || message.includes("429");

    return NextResponse.json(
      {
        error: is429
          ? "Gemini is rate limited right now. Please try again in a minute."
          : message,
      },
      { status: is429 ? 429 : 500 }
    );
  }
}
