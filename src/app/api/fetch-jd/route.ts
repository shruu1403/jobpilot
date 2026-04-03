import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to reach recruiter domain: ${response.statusText}`);
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    // 1. Remove unwanted elements
    $("script, style, nav, footer, header, form, aside, noscript, iframe").remove();

    // 2. Targeted extraction
    let text = "";

    // Common job board selectors (LinkedIn, Indeed, Reed, totaljobs)
    const selectors = [
      ".description", ".job-description", "#job-description", 
      ".show-more-less-html__description", // LinkedIn
      "#jobDescriptionText", // Indeed
      ".job_description", ".details__content"
    ];

    for (const selector of selectors) {
      const match = $(selector).text();
      if (match.length > 200) {
        text = match;
        break;
      }
    }

    // 3. Fallback to main content or body if no specific match
    if (!text) {
      text = $("main").text() || $("article").text() || $("body").text();
    }

    // 4. Sanitation
    const cleanedText = text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 5000); // Higher limit for raw extraction before LLM processing

    return NextResponse.json({ text: cleanedText });
  } catch (error: any) {
    console.error("Fetch JD Error:", error);
    return NextResponse.json(
      { error: "Failed to extract job content from this Link. Ensure accurate URL." },
      { status: 500 }
    );
  }
}
