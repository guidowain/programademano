import { MissingCloudinaryConfigError, StaticProgramMutationError, reorderProgramPages } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const assetIds = Array.isArray(body.assetIds) ? body.assetIds : [];

    if (!assetIds.every((assetId) => typeof assetId === "string")) {
      return NextResponse.json({ error: "Orden inválido" }, { status: 400 });
    }

    const pages = await reorderProgramPages(slug, assetIds);
    return NextResponse.json({ pages });
  } catch (error) {
    if (!(error instanceof StaticProgramMutationError)) {
      console.error("Program reorder error:", error);
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo guardar el orden") },
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
