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

  const recommendation = getRecommendation(program.name, program.ticketUrl);

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
      {recommendation ? (
        <footer className="program-recommend">
          <ProgramRecommendButton
            fallbackHref={recommendation.fallbackHref}
            message={recommendation.message}
            name={program.name}
            slug={program.slug}
          />
        </footer>
      ) : null}
    </main>
  );
}

function getRecommendation(name: string, ticketUrl: string) {
  if (!ticketUrl) return null;

  const message = `Te recomiendo ir a ver "${name}" ${ticketUrl}`;
  return {
    message,
    fallbackHref: `https://wa.me/?text=${encodeURIComponent(message)}`,
  };
}
