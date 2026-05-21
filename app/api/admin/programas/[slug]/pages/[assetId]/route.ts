import { MissingCloudinaryConfigError, deleteProgramPage } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; assetId: string }> },
) {
  try {
    const { slug, assetId } = await params;
    await deleteProgramPage(slug, assetId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Program page delete error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudo borrar la página") }, { status: 500 });
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof MissingCloudinaryConfigError ? "Falta configurar Cloudinary" : fallback;
}
