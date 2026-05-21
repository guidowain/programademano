"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ProgramPage = {
  assetId: string;
  publicId: string;
  url: string;
  width: number;
  height: number;
  order: number;
};

export default function EditProgramaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pages, setPages] = useState<ProgramPage[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchPages() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/programas/${slug}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo cargar el programa");
        return;
      }

      setPages(data.pages || []);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/programas/${slug}/pages`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudieron subir las imágenes");
        return;
      }

      setFiles(null);
      await fetchPages();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function persistOrder(nextPages: ProgramPage[]) {
    const response = await fetch(`/api/admin/programas/${slug}/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetIds: nextPages.map((page) => page.assetId) }),
    });

    if (!response.ok) {
      fetchPages();
      alert("No se pudo guardar el orden. Probá de nuevo.");
    }
  }

  async function handleMovePage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= pages.length) return;

    const reordered = [...pages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    setPages(reordered);
    await persistOrder(reordered);
  }

  async function handleDeletePage(assetId: string) {
    if (!confirm("¿Eliminar esta página?")) return;

    const response = await fetch(`/api/admin/programas/${slug}/pages/${assetId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      alert("No se pudo borrar la página");
      return;
    }

    fetchPages();
  }

  useEffect(() => {
    fetchPages();
  }, [slug]);

  return (
    <>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-title">{slug}</h1>
          <p className="admin-subtitle">Subí páginas, borralas o reordenalas con las flechas.</p>
        </div>
        <div className="admin-actions">
          <Link href={`/${slug}`} target="_blank" className="admin-button secondary">
            Ver programa
          </Link>
          <Link href="/admin" className="admin-button secondary">
            Volver
          </Link>
        </div>
      </header>

      <form className="admin-upload" onSubmit={handleUpload}>
        <label className="admin-field">
          <span className="admin-label">Subir páginas</span>
          <input
            className="admin-file-input"
            type="file"
            accept="image/avif,image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => setFiles(event.target.files)}
          />
        </label>
        <button type="submit" className="admin-button admin-gradient" disabled={saving || !files?.length}>
          {saving ? "Subiendo..." : "Subir imágenes"}
        </button>
      </form>

      {loading ? <p className="admin-subtitle">Cargando...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && pages.length === 0 ? (
        <div className="admin-empty">Este programa todavía no tiene páginas.</div>
      ) : null}

      <div className="admin-card-list">
        {pages.map((page, index) => (
          <article className="admin-card" key={page.assetId}>
            <div className="admin-order-controls">
              <button
                type="button"
                className="icon-mini"
                onClick={() => handleMovePage(index, -1)}
                disabled={index === 0}
                aria-label={`Subir página ${index + 1}`}
                title="Subir"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-mini"
                onClick={() => handleMovePage(index, 1)}
                disabled={index === pages.length - 1}
                aria-label={`Bajar página ${index + 1}`}
                title="Bajar"
              >
                ↓
              </button>
            </div>
            <div className="admin-thumb" aria-hidden="true">
              <img src={page.url} alt="" />
            </div>
            <div className="admin-card-main">
              <h2 className="admin-card-title">Página {index + 1}</h2>
              <p className="admin-card-meta">
                {page.width}×{page.height} · {page.publicId}
              </p>
            </div>
            <div className="admin-actions">
              <a href={page.url} target="_blank" className="admin-button secondary">
                Ver imagen
              </a>
              <button type="button" className="danger-x" onClick={() => handleDeletePage(page.assetId)} aria-label={`Eliminar página ${index + 1}`}>
                ×
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
