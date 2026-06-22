import { MissingCloudinaryConfigError, StaticProgramMutationError, uploadProgramPages } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/avif", "image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 12 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No se enviaron imágenes" }, { status: 400 });
    }

    const invalidFile = files.find((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE);

    if (invalidFile) {
      return NextResponse.json(
        { error: "Solo se aceptan AVIF, JPG, PNG o WEBP de hasta 12MB" },
        { status: 400 },
      );
    }

    const pages = await uploadProgramPages(slug, files);
    return NextResponse.json({ pages });
  } catch (error) {
    if (!(error instanceof StaticProgramMutationError)) {
      console.error("Program upload error:", error);
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudieron subir las imágenes") },
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
