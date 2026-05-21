import { getProgramDetails } from "@/lib/cloudinary";
import ProgramRecommendButton from "@/components/ProgramRecommendButton";
import ProgramViewTracker from "@/components/ProgramViewTracker";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProgramaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramDetails(slug);

  if (program.pages.length === 0) {
    notFound();
  }

  const recommendationUrl = getRecommendationUrl(program.name, program.ticketUrl);

  return (
    <main className="program-viewer">
      <ProgramViewTracker name={program.name} slug={program.slug} />
      <div className="program-pages">
        {program.pages.map((page, index) => (
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
      {recommendationUrl ? (
        <footer className="program-recommend">
          <ProgramRecommendButton href={recommendationUrl} name={program.name} slug={program.slug} />
        </footer>
      ) : null}
    </main>
  );
}

function getRecommendationUrl(name: string, ticketUrl: string) {
  if (!ticketUrl) return "";

  const message = `Te recomiendo ir a ver "${name}" ${ticketUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
