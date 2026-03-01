import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"];

    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.${ext}`;

    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({
      url: blob.url,
      filename, // you can store this in the db if needed
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
