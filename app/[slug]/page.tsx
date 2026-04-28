import PdfViewer from "./PdfViewer";

export default async function ProgramaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pdfPath = `/programas/${slug}.pdf`;

  return <PdfViewer src={pdfPath} />;
}
