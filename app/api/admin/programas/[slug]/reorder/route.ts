import { MissingCloudinaryConfigError, reorderProgramPages } from "@/lib/cloudinary";
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
    console.error("Program reorder error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudo guardar el orden") }, { status: 500 });
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof MissingCloudinaryConfigError ? "Falta configurar Cloudinary" : fallback;
}
