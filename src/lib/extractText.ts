import pdfParse from "pdf-parse";  
import mammoth from "mammoth";

/**
 * Extract hyperlinks from a PDF buffer using pdfjs-dist.
 * Returns a Map of display-text → URL for links found in the document.
 */
async function extractPdfHyperlinks(buffer: Buffer): Promise<Map<string, string>> {
  const linkMap = new Map<string, string>();
  
  try {
    // Dynamic import for pdfjs-dist (ESM module)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDoc = await loadingTask.promise;
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const annotations = await page.getAnnotations();
      
      for (const annot of annotations) {
        // Only care about Link annotations with a URI action
        if (annot.subtype === "Link" && annot.url) {
          // Try to get the display text from the annotation's content or title
          const displayText = annot.contentsObj?.str || annot.title || "";
          const url = annot.url;
          
          if (url) {
            // Store with display text as key (if available), otherwise URL itself
            if (displayText && displayText.trim().length > 0) {
              linkMap.set(displayText.trim().toLowerCase(), url);
            }
            // Also store the URL itself so we can match fragments
            linkMap.set(url.toLowerCase(), url);
          }
        }
      }
    }
    
    console.log(`[ExtractLinks] Found ${linkMap.size} links in PDF`);
  } catch (err: any) {
    console.warn("[ExtractLinks] PDF hyperlink extraction failed (non-fatal):", err.message);
  }
  
  return linkMap;
}

/**
 * Extract hyperlinks from a DOCX buffer using mammoth's HTML output.
 * Returns a Map of display-text → URL.
 */
async function extractDocxHyperlinks(buffer: Buffer): Promise<Map<string, string>> {
  const linkMap = new Map<string, string>();
  
  try {
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;
    
    // Parse all <a href="...">text</a> patterns
    const linkRegex = /<a\s+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const displayText = match[2].trim();
      
      if (url && displayText) {
        linkMap.set(displayText.toLowerCase(), url);
      }
      if (url) {
        linkMap.set(url.toLowerCase(), url);
      }
    }
    
    console.log(`[ExtractLinks] Found ${linkMap.size} links in DOCX`);
  } catch (err: any) {
    console.warn("[ExtractLinks] DOCX hyperlink extraction failed (non-fatal):", err.message);
  }
  
  return linkMap;
}

/**
 * Append extracted hyperlinks to the end of the resume text so the AI can see them.
 * Format: 
 *   --- EXTRACTED HYPERLINKS ---
 *   LinkedIn: https://linkedin.com/in/actual-profile
 *   Portfolio: https://actualportfolio.dev
 */
function appendLinksToText(text: string, linkMap: Map<string, string>): string {
  if (linkMap.size === 0) return text;
  
  // Deduplicate URLs (multiple keys may point to the same URL)
  const seenUrls = new Set<string>();
  const linkEntries: string[] = [];
  
  // Common labels to look for
  const labelPriority = ["linkedin", "github", "portfolio", "website", "live demo", "demo", "live", "deploy"];
  
  for (const [key, url] of linkMap.entries()) {
    // Skip if this URL was already added  
    if (seenUrls.has(url)) continue;
    
    // Determine a nice label
    let label = key;
    if (url.includes("linkedin.com")) label = "LinkedIn";
    else if (url.includes("github.com")) label = "GitHub";
    else if (url.includes("mailto:")) label = "Email";
    else if (key === url.toLowerCase()) {
      // Key is the URL itself, try to infer a label
      if (url.includes("linkedin")) label = "LinkedIn";
      else if (url.includes("github")) label = "GitHub";
      else label = "Link";
    } else {
      // Use the display text as label, capitalized
      label = key.charAt(0).toUpperCase() + key.slice(1);
    }
    
    // Skip mailto duplicates if email already in text
    if (url.startsWith("mailto:")) continue;
    
    linkEntries.push(`${label}: ${url}`);
    seenUrls.add(url);
  }
  
  if (linkEntries.length === 0) return text;
  
  return text + "\n\n--- EXTRACTED HYPERLINKS (from original document) ---\n" + linkEntries.join("\n");
}

/**
 * Extracts plain text + embedded hyperlinks from a resume file buffer.
 * Supports PDF and DOCX formats.
 * 
 * Hyperlinks that are hidden behind display text (e.g., "LinkedIn" → actual URL)
 * are extracted and appended to the text so downstream AI can use the real URLs.
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    let text = "";
    let linkMap = new Map<string, string>();

    const isPdf = mimeType.includes("application/pdf");
    const isDocx = mimeType.includes("wordprocessingml.document") || mimeType.includes("application/msword");

    if (isPdf) {
      console.log("Extracting PDF text, buffer size:", buffer.length);
      
      // Step 1: Extract plain text (existing approach)
      try {
        const data = await pdfParse(buffer);
        console.log("PDF extraction successful, text length:", data.text.length);
        text = data.text;
      } catch (pdfError: any) {
        console.error("PDF Parsing Error Details:", pdfError);
        throw new Error(`PDF Parsing failed: ${pdfError.message}`);
      }
      
      // Step 2: Extract hyperlinks from PDF annotations
      linkMap = await extractPdfHyperlinks(buffer);
      
    } else if (isDocx) {
      // Step 1: Extract plain text
      const rawResult = await mammoth.extractRawText({ buffer });
      text = rawResult.value;
      
      // Step 2: Extract hyperlinks from DOCX
      linkMap = await extractDocxHyperlinks(buffer);
      
    } else {
      throw new Error("Unsupported file format for extraction.");
    }

    // Clean up the text: remove excessive whitespace and invisible characters
    let cleanText = text
      .replace(/\r\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // Append extracted hyperlinks so the AI can see the real URLs
    cleanText = appendLinksToText(cleanText, linkMap);
    
    return cleanText;
  } catch (error: any) {
    console.error("Text Extraction Error:", error);
    try {
      require('fs').appendFileSync('extraction_errors.log', `${new Date().toISOString()} - ${error.stack}\n`);
    } catch {}
    throw error;
  }
}
