import { MissingCloudinaryConfigError, StaticProgramMutationError, deleteProgram, getProgramDetails, updateProgram } from "@/lib/cloudinary";
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
    if (!(error instanceof StaticProgramMutationError)) {
      console.error("Program update error:", error);
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo guardar el programa") },
      { status: getErrorStatus(error) },
    );
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
    if (!(error instanceof StaticProgramMutationError)) {
      console.error("Program delete error:", error);
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo borrar el programa") },
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
