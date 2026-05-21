import {
  MissingCloudinaryConfigError,
  createProgram,
  isValidProgramSlug,
  listPrograms,
} from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listPrograms());
  } catch (error) {
    console.error("Program list error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudieron cargar los programas") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug } = await request.json();
    const normalizedSlug = String(slug || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();

    if (!isValidProgramSlug(normalizedSlug)) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    await createProgram(normalizedSlug, normalizedName);
    return NextResponse.json({ name: normalizedName, slug: normalizedSlug });
  } catch (error) {
    console.error("Program create error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudo crear el programa") }, { status: 500 });
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof MissingCloudinaryConfigError ? "Falta configurar Cloudinary" : fallback;
}
