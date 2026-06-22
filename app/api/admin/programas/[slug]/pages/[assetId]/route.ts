import { MissingCloudinaryConfigError, StaticProgramMutationError, deleteProgramPage } from "@/lib/cloudinary";
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
    if (!(error instanceof StaticProgramMutationError)) {
      console.error("Program page delete error:", error);
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo borrar la página") },
      { status: getErrorStatus(error) },
    );
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof MissingCloudinaryConfigError) return "Falta configurar Cloudinary";
  if (error instanceof StaticProgramMutationError) return error.message;
  return fallback;
}

function getErrorStatus(error: unknown) {
  return error instanceof StaticProgramMutationError ? 409 : 500;
}
