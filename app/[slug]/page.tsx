import { existsSync, readdirSync } from "fs";
import { notFound } from "next/navigation";
import { join } from "path";

const MAX_PAGE_WIDTH = 700;
const IMAGE_EXTENSIONS = new Set([".avif", ".webp", ".png", ".jpg", ".jpeg"]);
const PROGRAMAS_DIRECTORY = join(process.cwd(), "public", "programas");

export function generateStaticParams() {
  if (!existsSync(PROGRAMAS_DIRECTORY)) {
    return [];
  }

  return readdirSync(PROGRAMAS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ slug: entry.name }));
}

export default async function ProgramaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pages = getProgramPages(slug);

  if (pages.length === 0) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#2b2b2b",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          lineHeight: 0,
        }}
      >
        {pages.map((page, index) => (
          <img
            key={page}
            src={page}
            alt={`Pagina ${index + 1}`}
            loading={index === 0 ? "eager" : "lazy"}
            style={{
              display: "block",
              width: "100%",
              maxWidth: MAX_PAGE_WIDTH,
              height: "auto",
              margin: 0,
              padding: 0,
            }}
          />
        ))}
      </div>
    </main>
  );
}

function getProgramPages(slug: string) {
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return [];
  }

  const programDirectory = join(PROGRAMAS_DIRECTORY, slug);

  if (!existsSync(programDirectory)) {
    return [];
  }

  return readdirSync(programDirectory)
    .filter((fileName) => {
      const extension = getExtension(fileName);
      const pageNumber = getPageNumber(fileName);

      return pageNumber !== null && IMAGE_EXTENSIONS.has(extension);
    })
    .sort((first, second) => getPageNumber(first)! - getPageNumber(second)!)
    .map((fileName) => `/programas/${slug}/${fileName}`);
}

function getPageNumber(fileName: string) {
  const match = fileName.match(/^(\d+)\.(avif|webp|png|jpe?g)$/i);

  return match ? Number(match[1]) : null;
}

function getExtension(fileName: string) {
  const match = fileName.match(/\.[^.]+$/);

  return match ? match[0].toLowerCase() : "";
}
