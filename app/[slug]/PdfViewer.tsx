"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

type PdfViewerProps = {
  src: string;
};

const MAX_PDF_WIDTH = 700;

export default function PdfViewer({ src }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumbers, setPageNumbers] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: {
      destroy: () => void;
      promise: Promise<PDFDocumentProxy>;
    } | null = null;

    async function loadPdf() {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();

      loadingTask = pdfjs.getDocument(src);
      const loadedPdf = await loadingTask.promise;

      if (cancelled) {
        loadedPdf.destroy();
        return;
      }

      setPdf(loadedPdf);
      setPageNumbers(
        Array.from({ length: loadedPdf.numPages }, (_, index) => index + 1),
      );
    }

    loadPdf();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [src]);

  return (
    <main
      ref={containerRef}
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#2b2b2b",
        overflowX: "hidden",
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
        {pdf &&
          pageNumbers.map((pageNumber) => (
            <PdfPage
              key={pageNumber}
              containerRef={containerRef}
              pageNumber={pageNumber}
              pdf={pdf}
            />
          ))}
      </div>
    </main>
  );
}

function PdfPage({
  containerRef,
  pageNumber,
  pdf,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageNumber: number;
  pdf: PDFDocumentProxy;
}) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let resizeFrame = 0;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null =
      null;
    let renderQueue = Promise.resolve();

    async function renderPage() {
      const pageElement = pageRef.current;
      const container = containerRef.current;

      if (!pageElement || !container) {
        return;
      }

      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewportWidth = Math.min(
        container.clientWidth,
        baseViewport.width,
        MAX_PDF_WIDTH,
      );
      const scale = viewportWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const pixelRatio = window.devicePixelRatio || 1;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context || cancelled) {
        return;
      }

      if (renderTask) {
        renderTask.cancel();

        try {
          await renderTask.promise;
        } catch {
          // The previous render was intentionally cancelled before repainting.
        }
      }

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.display = "block";
      canvas.style.margin = "0";
      canvas.style.padding = "0";
      canvas.style.background = "white";
      canvas.style.maxWidth = "100vw";

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      renderTask = page.render({
        canvasContext: context,
        viewport,
      });

      try {
        await renderTask.promise;
      } catch (error) {
        if (!cancelled) {
          throw error;
        }
      }

      if (!cancelled) {
        pageElement.replaceChildren(canvas);
      }
    }

    function scheduleRender() {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        renderQueue = renderQueue.then(renderPage).catch(() => undefined);
      });
    }

    scheduleRender();
    window.addEventListener("resize", scheduleRender);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", scheduleRender);

      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      renderTask?.cancel();
    };
  }, [containerRef, pageNumber, pdf]);

  return <div ref={pageRef} style={{ lineHeight: 0, margin: 0, padding: 0 }} />;
}
