import { listPrograms, MissingCloudinaryConfigError } from "@/lib/cloudinary";
import { getProgramAnalytics } from "@/lib/google-analytics";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const programs = await listPrograms();
    const metrics = await Promise.all(
      programs.map(async (program) => ({
        ...program,
        analytics: await getProgramAnalytics(program.slug),
      })),
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Metrics list error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "No se pudieron cargar las métricas") }, { status: 500 });
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof MissingCloudinaryConfigError ? "Falta configurar Cloudinary" : fallback;
}
