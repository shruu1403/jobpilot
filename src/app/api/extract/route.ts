import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/extractText";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromBuffer(buffer, file.type);

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Extraction API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
