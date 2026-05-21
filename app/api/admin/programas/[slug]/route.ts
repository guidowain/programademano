import { MissingCloudinaryConfigError, deleteProgram, getProgramDetails, updateProgram } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    return NextResponse.json(await getProgramDetails(slug));
  } catch (error) {
    console.error("Program detail error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudo cargar el programa") }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { name, slug: nextSlug, ticketUrl } = await request.json();
    const details = await updateProgram(slug, {
      name: String(name || ""),
      slug: String(nextSlug || ""),
      ticketUrl: String(ticketUrl || ""),
    });

    return NextResponse.json(details);
  } catch (error) {
    console.error("Program update error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudo guardar el programa") }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await deleteProgram(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Program delete error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudo borrar el programa") }, { status: 500 });
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof MissingCloudinaryConfigError ? "Falta configurar Cloudinary" : fallback;
}
