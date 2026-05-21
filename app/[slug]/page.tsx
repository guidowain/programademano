import { listProgramPages } from "@/lib/cloudinary";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProgramaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pages = await listProgramPages(slug);

  if (pages.length === 0) {
    notFound();
  }

  return (
    <main className="program-viewer">
      <div className="program-pages">
        {pages.map((page, index) => (
          <img
            key={page.assetId}
            src={page.url}
            alt={`Página ${index + 1}`}
            width={page.width}
            height={page.height}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
          />
        ))}
      </div>
    </main>
  );
}
