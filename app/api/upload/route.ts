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
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "svg"];

    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    // @ts-ignore - Injected via vinext/cloudflare bindings
    const bucket = process.env.BUCKET as R2Bucket;

    await bucket.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Depending on R2 config, you might have a custom domain for reading
    // For now we assume the worker handles the read, or we return the raw object path
    return NextResponse.json({
      url: `/api/uploads/${filename}`,
      filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Handle GET for serving the uploaded files via the worker
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const filename = pathParts[pathParts.length - 1];

  if (!filename || filename === "uploads") {
    return new NextResponse("Not found", { status: 404 });
  }

  // @ts-ignore
  const bucket = process.env.BUCKET as R2Bucket;
  const object = await bucket.get(filename);

  if (object === null) {
    return new NextResponse("Object Not Found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new NextResponse(object.body as any, {
    headers,
  });
}
