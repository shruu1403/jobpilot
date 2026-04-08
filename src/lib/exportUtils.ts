import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ExternalHyperlink } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

/**
 * PDF Export: Handles raw strings (Cover Letters) AND structured ATS Resumes with clickable links
 */
export async function exportToPDF(content: string | any, filename: string) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  
  let cursorY = margin;

  const checkPageBreak = (addSpace: number) => {
    if (cursorY + addSpace > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  if (typeof content === "string") {
    // COVER LETTER MODE
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(content, maxWidth);
    
    for (let i = 0; i < lines.length; i++) {
      checkPageBreak(6);
      doc.text(lines[i], margin, cursorY);
      cursorY += 6;
    }
  } else {
    // ATS RESUME MODE (Structured JSON with links)
    
    // Helper: render a clickable link in PDF
    const addLink = (text: string, url: string, x: number) => {
      doc.setTextColor(37, 99, 235); // Blue
      doc.textWithLink(text, x, cursorY, { url });
      doc.setTextColor(0, 0, 0); // Reset to black
    };

    // Header (Centered)
    if (content.header) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const nameStr = content.header.name || "";
      let w = doc.getTextWidth(nameStr);
      doc.text(nameStr, (pageWidth - w) / 2, cursorY);
      cursorY += 8;

      // Contact line with clickable links
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      if (content.header.contact?.items && Array.isArray(content.header.contact.items)) {
        const items = content.header.contact.items;
        // Calculate total width for centering
        const separator = "  |  ";
        const texts = items.map((item: any) => item.text);
        const fullText = texts.join(separator);
        const totalWidth = doc.getTextWidth(fullText);
        let xPos = (pageWidth - totalWidth) / 2;
        
        items.forEach((item: any, idx: number) => {
          if (item.url && item.url.length > 0) {
            addLink(item.text, item.url, xPos);
          } else {
            doc.text(item.text, xPos, cursorY);
          }
          xPos += doc.getTextWidth(item.text);
          
          if (idx < items.length - 1) {
            doc.setTextColor(150, 150, 150);
            doc.text(separator, xPos, cursorY);
            doc.setTextColor(0, 0, 0);
            xPos += doc.getTextWidth(separator);
          }
        });
        cursorY += 10;
      } else if (typeof content.header.contact === "string") {
        // Fallback for plain string contact
        w = doc.getTextWidth(content.header.contact);
        doc.text(content.header.contact, (pageWidth - w) / 2, cursorY);
        cursorY += 10;
      }
    }

    // Section Header Helper
    const addSectionHeader = (title: string) => {
      checkPageBreak(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title.toUpperCase(), margin, cursorY);
      cursorY += 2;
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    // Summary
    if (content.summary) {
      addSectionHeader("Professional Summary");
      const lines = doc.splitTextToSize(content.summary, maxWidth);
      for (let i = 0; i < lines.length; i++) {
        checkPageBreak(5);
        doc.text(lines[i], margin, cursorY);
        cursorY += 5;
      }
      cursorY += 5;
    }

    // Skills
    if (content.skills && Object.keys(content.skills).length > 0) {
      addSectionHeader("Technical Skills");
      Object.entries(content.skills).forEach(([group, skills]) => {
        checkPageBreak(6);
        doc.setFont("helvetica", "bold");
        const prefix = `${group}: `;
        const prefixW = doc.getTextWidth(prefix);
        doc.text(prefix, margin, cursorY);
        
        doc.setFont("helvetica", "normal");
        const arr = Array.isArray(skills) ? skills : [];
        const skillsText = arr.join(", ");
        const lines = doc.splitTextToSize(skillsText, maxWidth - prefixW);
        
        for (let i = 0; i < lines.length; i++) {
          checkPageBreak(5);
          doc.text(lines[i], i === 0 ? margin + prefixW : margin, cursorY);
          cursorY += 5;
        }
      });
      cursorY += 5;
    }

    // Projects / Experience
    if (content.projects && content.projects.length > 0) {
      addSectionHeader("Experience & Projects");
      content.projects.forEach((p: any) => {
        checkPageBreak(8);
        
        // Project title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        const titleText = p.title || "Project";
        doc.text(titleText, margin, cursorY);
        
        // Tech stack inline
        if (p.techStack) {
          const titleW = doc.getTextWidth(titleText + "  ");
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`[${p.techStack}]`, margin + titleW, cursorY);
          doc.setTextColor(0, 0, 0);
        }
        cursorY += 5;
        
        // Project links on their own line
        if (p.links && Array.isArray(p.links) && p.links.length > 0) {
          doc.setFontSize(9);
          let linkX = margin;
          p.links.forEach((link: any, idx: number) => {
            if (link.url) {
              doc.setFont("helvetica", "normal");
              const labelText = `${link.label}: `;
              doc.text(labelText, linkX, cursorY);
              linkX += doc.getTextWidth(labelText);
              
              addLink(link.url, link.url, linkX);
              linkX += doc.getTextWidth(link.url);
              
              if (idx < p.links.length - 1) {
                doc.text("  |  ", linkX, cursorY);
                linkX += doc.getTextWidth("  |  ");
              }
            }
          });
          cursorY += 5;
        }
        
        // Bullet points
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (Array.isArray(p.description)) {
          p.description.forEach((d: string) => {
            const lines = doc.splitTextToSize(d, maxWidth - 5);
            for (let i = 0; i < lines.length; i++) {
              checkPageBreak(5);
              if (i === 0) {
                doc.text("•", margin, cursorY);
                doc.text(lines[i], margin + 5, cursorY);
              } else {
                doc.text(lines[i], margin + 5, cursorY);
              }
              cursorY += 5;
            }
          });
        }
        cursorY += 3;
      });
      cursorY += 2;
    }

    // Education
    if (content.education && content.education.length > 0) {
      addSectionHeader("Education");
      content.education.forEach((e: any) => {
        checkPageBreak(6);
        doc.setFont("helvetica", "bold");
        const uni = e.institution || "Institution";
        doc.text(uni, margin, cursorY);
        
        if (e.year) {
          doc.setFont("helvetica", "normal");
          const yw = doc.getTextWidth(e.year);
          doc.text(e.year, pageWidth - margin - yw, cursorY);
        }
        cursorY += 5;

        doc.setFont("helvetica", "normal");
        doc.text(e.degree || "", margin, cursorY);
        cursorY += 6;
      });
    }
  }

  doc.save(`${filename}.pdf`);
}

/**
 * DOCX Export: Handles strings and structured ATS JSON with clickable links
 */
export async function exportToDOCX(content: string | any, filename: string) {
  let docChildren: any[] = [];

  if (typeof content === "string") {
    // COVER LETTER MODE
    const lines = content.split("\n");
    docChildren = lines.map((line) => new Paragraph({
      children: [new TextRun({ text: line, font: "Arial", size: 22 })],
    }));
  } else {
    // ATS RESUME MODE (Structured JSON)
    
    // Header
    if (content.header) {
      docChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: content.header.name || "", bold: true, size: 36, font: "Arial" })],
      }));
      
      // Contact with clickable links
      if (content.header.contact?.items && Array.isArray(content.header.contact.items)) {
        const contactRuns: any[] = [];
        content.header.contact.items.forEach((item: any, idx: number) => {
          if (item.url && item.url.length > 0) {
            contactRuns.push(
              new ExternalHyperlink({
                children: [new TextRun({ text: item.text, size: 20, font: "Arial", color: "2563EB", underline: {} })],
                link: item.url,
              })
            );
          } else {
            contactRuns.push(new TextRun({ text: item.text, size: 20, font: "Arial", color: "555555" }));
          }
          if (idx < content.header.contact.items.length - 1) {
            contactRuns.push(new TextRun({ text: "  |  ", size: 20, font: "Arial", color: "999999" }));
          }
        });
        docChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: contactRuns,
          spacing: { after: 200 }
        }));
      } else if (typeof content.header.contact === "string") {
        docChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: content.header.contact, size: 20, font: "Arial", color: "555555" })],
          spacing: { after: 200 }
        }));
      }
    }

    const addSectionHeader = (title: string) => {
      docChildren.push(new Paragraph({
        text: title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } }
      }));
    };

    // Summary
    if (content.summary) {
      addSectionHeader("Professional Summary");
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: content.summary, size: 22, font: "Arial" })],
      }));
    }

    // Skills
    if (content.skills && Object.keys(content.skills).length > 0) {
      addSectionHeader("Technical Skills");
      Object.entries(content.skills).forEach(([group, skills]) => {
        const arr = Array.isArray(skills) ? skills : [];
        docChildren.push(new Paragraph({
          children: [
            new TextRun({ text: `${group}: `, bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: arr.join(", "), size: 22, font: "Arial" })
          ],
          spacing: { after: 100 }
        }));
      });
    }

    // Projects
    if (content.projects && content.projects.length > 0) {
      addSectionHeader("Experience & Projects");
      content.projects.forEach((p: any) => {
        // Title + tech stack
        const titleChildren: any[] = [
          new TextRun({ text: p.title || "Project", bold: true, size: 24, font: "Arial" }),
        ];
        if (p.techStack) {
          titleChildren.push(new TextRun({ text: `  [${p.techStack}]`, italics: true, size: 20, font: "Arial", color: "666666" }));
        }
        docChildren.push(new Paragraph({
          children: titleChildren,
          spacing: { after: 50 }
        }));
        
        // Links
        if (p.links && Array.isArray(p.links) && p.links.length > 0) {
          const linkRuns: any[] = [];
          p.links.forEach((link: any, idx: number) => {
            if (link.url) {
              linkRuns.push(new TextRun({ text: `${link.label}: `, size: 20, font: "Arial" }));
              linkRuns.push(
                new ExternalHyperlink({
                  children: [new TextRun({ text: link.url, size: 20, font: "Arial", color: "2563EB", underline: {} })],
                  link: link.url,
                })
              );
              if (idx < p.links.length - 1) {
                linkRuns.push(new TextRun({ text: "  |  ", size: 20, font: "Arial", color: "999999" }));
              }
            }
          });
          docChildren.push(new Paragraph({ children: linkRuns, spacing: { after: 50 } }));
        }
        
        // Description bullets
        if (Array.isArray(p.description)) {
          p.description.forEach((d: string) => {
            docChildren.push(new Paragraph({
              text: d,
              bullet: { level: 0 },
              style: "ListParagraph",
              spacing: { after: 50 },
            }));
          });
        }
      });
    }

    // Education
    if (content.education && content.education.length > 0) {
      addSectionHeader("Education");
      content.education.forEach((e: any) => {
        docChildren.push(new Paragraph({
          alignment: AlignmentType.START,
          children: [
            new TextRun({ text: e.institution || "Institution", bold: true, size: 24, font: "Arial" }),
            new TextRun({ text: "\t\t\t" + (e.year || ""), size: 20, font: "Arial", color: "888888" })
          ],
        }));
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: e.degree || "", size: 22, font: "Arial" })],
          spacing: { after: 100 }
        }));
      });
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children: docChildren }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
