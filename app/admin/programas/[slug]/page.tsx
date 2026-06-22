"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProgramPage = {
  assetId: string;
  publicId: string;
  url: string;
  optimizedUrl: string;
  width: number;
  height: number;
  order: number;
};

type ProgramSource = "cloudinary" | "static";

type ProgramAnalytics = {
  configured: boolean;
  last30DaysViews: number;
  totalViews: number;
  last30DaysRecommendations: number;
  totalRecommendations: number;
  error?: string;
};

export default function EditProgramaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [programName, setProgramName] = useState("");
  const [programSlug, setProgramSlug] = useState(slug);
  const [ticketUrl, setTicketUrl] = useState("");
  const [programSource, setProgramSource] = useState<ProgramSource>("cloudinary");
  const [pages, setPages] = useState<ProgramPage[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [analytics, setAnalytics] = useState<ProgramAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [error, setError] = useState("");
  const fileCount = files?.length ?? 0;
  const uploadInputId = `program-upload-${slug}`;
  const fileSummary = fileCount === 0
    ? "Ninguna imagen seleccionada"
    : `${fileCount} ${fileCount === 1 ? "imagen seleccionada" : "imágenes seleccionadas"}`;
  const isStaticProgram = programSource === "static";

  async function fetchPages() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/programas/${slug}`, { cache: "no-store" });
      const data = await readResponseData(response);

      if (!response.ok) {
        setError(data.error || "No se pudo cargar el programa");
        return;
      }

      setPages(data.pages || []);
      setProgramName(data.name || "");
      setProgramSlug(data.slug || slug);
      setTicketUrl(data.ticketUrl || "");
      setProgramSource(data.source || "cloudinary");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    try {
      const response = await fetch(`/api/admin/programas/${slug}/analytics`, { cache: "no-store" });
      const data = await response.json();
      setAnalytics(data);
    } catch {
      setAnalytics({
        configured: false,
        last30DaysViews: 0,
        totalViews: 0,
        last30DaysRecommendations: 0,
        totalRecommendations: 0,
        error: "No se pudo cargar Analytics.",
      });
    }
  }

  async function handleSaveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingDetails(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/programas/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: programName, slug: programSlug.trim().toLowerCase(), ticketUrl }),
      });
      const data = await readResponseData(response);

      if (!response.ok) {
        setError(data.error || "No se pudo guardar el programa");
        return;
      }

      setProgramName(data.name || "");
      setProgramSlug(data.slug || programSlug);
      setTicketUrl(data.ticketUrl || "");
      setProgramSource(data.source || "cloudinary");
      setPages(data.pages || []);

      if (data.slug && data.slug !== slug) {
        router.replace(`/admin/programas/${data.slug}`);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSavingDetails(false);
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
      const data = await readResponseData(response);

      if (!response.ok) {
        setError(data.error || "No se pudieron subir las imágenes");
        return;
      }

      setFiles(null);
      setFileInputKey((key) => key + 1);
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
      const data = await readResponseData(response);
      alert(data.error || "No se pudo guardar el orden. Probá de nuevo.");
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
      const data = await readResponseData(response);
      alert(data.error || "No se pudo borrar la página");
      return;
    }

    fetchPages();
  }

  useEffect(() => {
    fetchPages();
    fetchAnalytics();
  }, [slug]);

  return (
    <>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-title">{programName || slug}</h1>
          <p className="admin-subtitle">/{programSlug}</p>
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

      <form className="admin-form admin-program-details" onSubmit={handleSaveDetails}>
        <label className="admin-field">
          <span className="admin-label">Nombre</span>
          <input
            className="admin-input"
            value={programName}
            onChange={(event) => setProgramName(event.target.value)}
            placeholder="Mi amiga y yo"
            disabled={isStaticProgram}
            required
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Slug</span>
          <input
            className="admin-input"
            value={programSlug}
            onChange={(event) => setProgramSlug(event.target.value.replace(/\s+/g, "-").toLowerCase())}
            placeholder="miamigayyo"
            pattern="[a-z0-9-]+"
            disabled={isStaticProgram}
            required
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Link entradas</span>
          <input
            className="admin-input"
            type="url"
            value={ticketUrl}
            onChange={(event) => setTicketUrl(event.target.value)}
            placeholder="https://..."
            disabled={isStaticProgram}
          />
        </label>
        <button type="submit" className="admin-button secondary" disabled={savingDetails || isStaticProgram}>
          {savingDetails ? "Guardando..." : "Guardar"}
        </button>
      </form>

      <section className="admin-analytics-strip" aria-label="Analytics">
        <AnalyticsStat label="Visitas 30 días" value={analytics?.last30DaysViews} />
        <AnalyticsStat label="Visitas total" value={analytics?.totalViews} />
        <AnalyticsStat label="Recos 30 días" value={analytics?.last30DaysRecommendations} />
        <AnalyticsStat label="Recos total" value={analytics?.totalRecommendations} />
      </section>
      {analytics?.error ? <p className="admin-card-meta admin-analytics-note">{analytics.error}</p> : null}

      {isStaticProgram ? (
        <p className="admin-card-meta admin-analytics-note">
          Este programa está alojado en GitHub. Para cambiar sus imágenes hay que actualizar el repo.
        </p>
      ) : (
        <form className="admin-upload" onSubmit={handleUpload}>
          <label className="admin-field">
            <span className="admin-label">Cargar imágenes</span>
            <input
              key={fileInputKey}
              id={uploadInputId}
              className="admin-file-input"
              type="file"
              accept="image/avif,image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => setFiles(event.target.files)}
            />
            <div className="admin-upload-panel">
              <div>
                <p className="admin-upload-title">{fileSummary}</p>
              </div>
              <div className="admin-upload-actions">
                <label htmlFor={uploadInputId} className="admin-button secondary">
                  Elegir imágenes
                </label>
                <button type="submit" className="admin-button admin-gradient" disabled={saving || fileCount === 0}>
                  {saving ? "Subiendo..." : "Subir imágenes"}
                </button>
              </div>
            </div>
          </label>
        </form>
      )}

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
                disabled={isStaticProgram || index === 0}
                aria-label={`Subir página ${index + 1}`}
                title="Subir"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-mini"
                onClick={() => handleMovePage(index, 1)}
                disabled={isStaticProgram || index === pages.length - 1}
                aria-label={`Bajar página ${index + 1}`}
                title="Bajar"
              >
                ↓
              </button>
            </div>
            <div className="admin-thumb" aria-hidden="true">
              <img src={page.optimizedUrl} alt="" />
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
              <button
                type="button"
                className="danger-x"
                onClick={() => handleDeletePage(page.assetId)}
                aria-label={`Eliminar página ${index + 1}`}
                disabled={isStaticProgram}
              >
                ×
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

async function readResponseData(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    if (response.status === 413) {
      return { error: "Las imágenes superan el límite de subida. Probá subir menos imágenes o archivos más livianos." };
    }

    return { error: text };
  }
}

function AnalyticsStat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="admin-analytics-stat">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString("es-AR") : "—"}</strong>
    </div>
  );
}
