import pdfParse from "pdf-parse";  
import mammoth from "mammoth";

/**
 * Extracts plain text from a resume file buffer.
 * Supports PDF and DOCX formats.
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    let text = "";

    const isPdf = mimeType.includes("application/pdf");
    const isDocx = mimeType.includes("wordprocessingml.document") || mimeType.includes("application/msword");

    if (isPdf) {
      console.log("Extracting PDF text, buffer size:", buffer.length);
      try {
        const data = await pdfParse(buffer);
        console.log("PDF extraction successful, text length:", data.text.length);
        text = data.text;
      } catch (pdfError: any) {
        console.error("PDF Parsing Error Details:", pdfError);
        throw new Error(`PDF Parsing failed: ${pdfError.message}`);
      }
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      throw new Error("Unsupported file format for extraction.");
    }

    // Clean up the text: remove excessive whitespace and invisible characters
    return text
      .replace(/\r\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (error: any) {
    console.error("Text Extraction Error:", error);
    try {
      require('fs').appendFileSync('extraction_errors.log', `${new Date().toISOString()} - ${error.stack}\n`);
    } catch {}
    throw error;
  }
}
