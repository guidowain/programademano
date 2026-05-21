import { getProgramAnalytics } from "@/lib/google-analytics";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return NextResponse.json(await getProgramAnalytics(slug));
}
