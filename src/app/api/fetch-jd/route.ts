import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

// Heuristic check: does the extracted text actually look like a job description?
function looksLikeJobDescription(text: string): boolean {
  const lower = text.toLowerCase();
  const jobSignals = [
    "responsibilities",
    "requirements",
    "qualifications",
    "experience",
    "skills",
    "salary",
    "apply",
    "candidate",
    "role",
    "position",
    "job description",
    "we are looking",
    "you will",
    "you'll",
    "must have",
    "nice to have",
    "preferred",
    "full-time",
    "full time",
    "part-time",
    "part time",
    "remote",
    "hybrid",
    "onsite",
    "on-site",
    "internship",
    "benefits",
    "compensation",
    "hiring",
    "team",
    "proficiency",
    "degree",
    "bachelor",
    "years of experience",
    "job type",
    "employment type",
    "about the role",
    "what you'll do",
    "who you are",
    "key responsibilities",
    "desired skills",
    "stipend",
    "ctc",
    "lpa",
    "perks",
  ];

  let matchCount = 0;
  for (const signal of jobSignals) {
    if (lower.includes(signal)) {
      matchCount++;
    }
  }

  // Require at least 3 job-related keywords to consider it a valid JD
  return matchCount >= 3;
}

// Normalize Indeed URLs: convert /?vjk=xxx to /viewjob?jk=xxx
function normalizeIndeedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("indeed.com")) {
      const vjk = parsed.searchParams.get("vjk");
      if (vjk) {
        return `${parsed.origin}/viewjob?jk=${vjk}`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

// Extract text from HTML using cheerio selectors
function extractJobText(html: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("script, style, nav, footer, header, form, aside, noscript, iframe").remove();

  let text = "";

  // Common job board selectors (covers major platforms globally)
  const selectors = [
    // Indeed
    "#jobDescriptionText",
    ".jobsearch-JobComponent-description",
    "[data-testid='jobDescriptionText']",
    // LinkedIn
    ".show-more-less-html__markup",
    ".show-more-less-html__description",
    // Naukri
    ".styles_JDC__dang-inner-html__h0K4t",
    ".job-desc", ".dang-inner-html",
    ".styles_job-desc-container__txpYf",
    // Unstop
    ".opp_desc", ".opportunity-detail",
    ".detail_desc", ".about-opportunity",
    // Internshala
    ".internship_details", ".detail_view",
    "#job_description_heading_container",
    // Glassdoor
    ".desc", ".jobDescriptionContent",
    "[data-test='jobDescriptionContent']",
    // Wellfound / AngelList
    ".job-description-text",
    // Foundit (Monster India)
    ".job-description-container", ".job-description-wrapper",
    // SimplyHired
    ".viewjob-jobDescription",
    // Generic fallback selectors
    ".description", ".job-description", "#job-description",
    ".job_description", ".details__content",
  ];

  for (const selector of selectors) {
    const match = $(selector).text();
    if (match && match.trim().length > 150) {
      text = match;
      break;
    }
  }

  // Fallback to main/article/body
  if (!text) {
    text = $("main").text() || $("article").text() || $("body").text();
  }

  // Clean up
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 5000);
}

// Try simple fetch first (works for most job boards)
async function trySimpleFetch(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const lower = html.toLowerCase();

    // Detect Cloudflare / bot challenge pages
    if (
      lower.includes("just a moment") ||
      lower.includes("cf-browser-verification") ||
      lower.includes("attention required")
    ) {
      return null;
    }

    const text = extractJobText(html);
    return text.length > 100 ? text : null;
  } catch {
    return null;
  }
}

// Fallback: use Puppeteer headless browser (bypasses Cloudflare)
async function tryPuppeteerFetch(url: string): Promise<string | null> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    // Spoof to look like a real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 768 });

    // Navigate and wait for the page to fully render
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait a bit extra for dynamic content
    await new Promise((r) => setTimeout(r, 3000));

    const html = await page.content();
    const text = extractJobText(html);

    return text.length > 100 ? text : null;
  } catch (err) {
    console.error("Puppeteer fetch error:", err);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes(".")) {
        return NextResponse.json(
          { error: "Invalid URL provided. Please include a valid domain." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL provided. Please check the format." },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeIndeedUrl(url);

    // Strategy 1: Simple fetch (fast, works for non-protected sites)
    let text = await trySimpleFetch(normalizedUrl);

    // Strategy 2: Puppeteer headless browser (handles Cloudflare, JS-rendered pages)
    if (!text) {
      console.log("Simple fetch failed, trying Puppeteer for:", normalizedUrl);
      text = await tryPuppeteerFetch(normalizedUrl);
    }

    if (!text || text.length < 100) {
      return NextResponse.json(
        {
          error:
            "Could not reach this page. Please paste text manually.",
        },
        { status: 422 }
      );
    }

    // Validate that the extracted content actually resembles a job description
    if (!looksLikeJobDescription(text)) {
      return NextResponse.json(
        {
          error:
            "This doesn't look like a job posting. Please use a job listing URL.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Fetch JD Error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to extract JD from link. Please paste text manually.",
      },
      { status: 500 }
    );
  }
}
