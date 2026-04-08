import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function testExtraction() {
  const testFiles = fs.readdirSync('.').filter(f => f.endsWith('.pdf'));
  if (testFiles.length === 0) {
    console.log("No PDF files found in cwd for testing.");
    console.log("But pdfjs-dist loaded successfully! getDocument is:", typeof getDocument);
    return;
  }
  
  const buffer = fs.readFileSync(testFiles[0]);
  const uint8Array = new Uint8Array(buffer);
  const doc = await getDocument({ data: uint8Array }).promise;
  
  console.log(`Pages: ${doc.numPages}`);
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const annots = await page.getAnnotations();
    console.log(`Page ${i}: ${annots.length} annotations`);
    
    for (const a of annots) {
      if (a.subtype === "Link" && a.url) {
        console.log(`  Link: "${a.contentsObj?.str || a.title || '(no label)'}" → ${a.url}`);
      }
    }
  }
}

testExtraction().catch(e => console.error("Test failed:", e.message));
