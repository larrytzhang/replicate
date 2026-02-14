import { NextResponse } from "next/server";

export async function GET() {
  const hasToken = !!process.env.REPLICATE_API_TOKEN;

  return NextResponse.json({
    liveAvailable: hasToken,
    defaultMode: hasToken ? "replicate" : "demo",
  });
}
