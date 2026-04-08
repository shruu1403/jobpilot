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
      console.log(`[QuickFix] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      if (err?.status === 429 || err?.status === 404) continue;
      throw err;
    }
  }
  throw lastError || new Error("All models failed.");
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }

    const trimmedResume = resumeText.slice(0, 7000);

    const prompt = `You are an expert ATS resume optimizer and professional resume writer.

Your task is to ENHANCE the given resume and return it in a STRUCTURED JSON format for rendering into a professional resume layout.

--------------------------------------

INPUT RESUME:
"""
${trimmedResume}
"""

--------------------------------------

STRICT RULES:

1. NEVER REMOVE IMPORTANT CONTENT:
- Keep ALL projects, technologies, achievements.
- Keep ALL links exactly as they appear in the original.

2. DO NOT INVENT:
- No fake metrics, experience, or links.

3. DO NOT OVER-EXAGGERATE:
- Prefer realistic verbs: Developed, Built, Implemented, Designed.
- Avoid "Architected", "Orchestrated" unless clearly justified.

--------------------------------------

LINK PRESERVATION (EXTREMELY IMPORTANT):

- The input text may contain a section at the end labeled "--- EXTRACTED HYPERLINKS (from original document) ---".
- This section contains the REAL URLs that were embedded as hidden hyperlinks in the original PDF/DOCX file.
- These are the AUTHORITATIVE URLs. Use them for LinkedIn, GitHub, Portfolio, Live Demo, etc.
- Copy ALL URLs from the original resume and extracted hyperlinks EXACTLY as they are.
- DO NOT guess, infer, or fabricate any URL.
- NEVER substitute a real URL with a placeholder like "linkedin.com/in/yourprofile".
- If a URL is NOT present in the original resume or extracted hyperlinks, DO NOT add it.
- When building the contact.items array, match each label (LinkedIn, GitHub, Portfolio) with the correct URL from the extracted hyperlinks section.

--------------------------------------

SECTION NAMING RULES:

Use clean ATS-friendly names for the skills object keys:
✅ Use: "Frontend", "Backend", "Database & BaaS", "Tools & Platforms"
❌ DO NOT use: "Database_and_baas", "Tools_and_platforms"

--------------------------------------

BULLET IMPROVEMENT:

Use action + impact structure:
GOOD: "Developed a real-time expense tracking system using React.js and Node.js, enabling seamless multi-user collaboration"
BAD: "Worked on expense tracker"

--------------------------------------

SUMMARY:

Make it crisp. Mention role, tech stack, and deployment/cloud exposure.

--------------------------------------

LINKS IN PROJECTS:

For each project, include a separate "links" array containing objects with "label" and "url".
Extract links from the original text. Only include links that actually exist in the input.

Example:
"links": [
  { "label": "Live Demo", "url": "https://splitmate.me" },
  { "label": "GitHub", "url": "https://github.com/user/repo" }
]

--------------------------------------

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "header": {
    "name": "Full Name",
    "contact": {
      "items": [
        { "text": "phone number", "url": "" },
        { "text": "email@example.com", "url": "mailto:email@example.com" },
        { "text": "LinkedIn", "url": "https://linkedin.com/in/exact-profile" },
        { "text": "GitHub", "url": "https://github.com/exact-username" },
        { "text": "Portfolio", "url": "https://exact-portfolio-url.com" }
      ]
    }
  },
  "summary": "Improved professional summary",
  "skills": {
    "Frontend": ["React.js", "HTML5"],
    "Backend": ["Node.js"],
    "Database & BaaS": ["MongoDB"],
    "Tools & Platforms": ["Git", "AWS"]
  },
  "projects": [
    {
      "title": "Project Name",
      "techStack": "React.js, Node.js, MongoDB",
      "links": [
        { "label": "Live Demo", "url": "https://exact-url.com" },
        { "label": "GitHub", "url": "https://github.com/exact/repo" }
      ],
      "description": [
        "Developed ...",
        "Implemented ..."
      ]
    }
  ],
  "education": [
    {
      "institution": "College Name",
      "degree": "Degree details",
      "year": "Year"
    }
  ],
  "improvementsMade": [
    "Refined bullet points",
    "Fixed ATS section names"
  ]
}

--------------------------------------

CRITICAL:
- Output ONLY valid JSON. No markdown. No explanation.
- ALL URLs must be copied verbatim from the input resume. NEVER fabricate a URL.
- If a link is missing "https://", prepend it.`;

    const text = await callGemini(prompt);

    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd));

      return NextResponse.json({
        header: parsed.header || {},
        summary: parsed.summary || "",
        skills: parsed.skills || {},
        projects: parsed.projects || [],
        education: parsed.education || [],
        improvements: Array.isArray(parsed.improvementsMade) ? parsed.improvementsMade : [],
      });
    } catch {
      console.error("[QuickFix] JSON Parse Error:", text);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[QuickFix] Error:", error);
    const is429 = error?.status === 429 || error?.message?.includes("429");
    return NextResponse.json(
      { error: is429 ? "Rate limit reached. Wait 60s." : `Failed: ${error.message}` },
      { status: is429 ? 429 : 500 }
    );
  }
}
