"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProgramSummary = {
  name: string;
  slug: string;
  pageCount: number;
  coverUrl: string | null;
};

export default function AdminProgramasPage() {
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchPrograms() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/programas", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudieron cargar los programas");
        return;
      }

      setPrograms(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`¿Eliminar el programa "${slug}" y todas sus páginas?`)) return;

    const response = await fetch(`/api/admin/programas/${slug}`, { method: "DELETE" });
    if (!response.ok) {
      alert("No se pudo borrar el programa");
      return;
    }

    fetchPrograms();
  }

  useEffect(() => {
    fetchPrograms();
  }, []);

  return (
    <>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-title">Programas</h1>
          <p className="admin-subtitle">Gestioná las imágenes que se publican en cada URL.</p>
        </div>
        <Link href="/admin/programas/nuevo" className="admin-button admin-gradient">
          + Nuevo programa
        </Link>
      </header>

      {loading ? <p className="admin-subtitle">Cargando...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error && programs.length === 0 ? (
        <div className="admin-empty">Todavía no hay programas en Cloudinary.</div>
      ) : null}

      <div className="admin-card-list">
        {programs.map((program) => (
          <article className="admin-card" key={program.slug}>
            <div className="admin-thumb" aria-hidden="true">
              {program.coverUrl ? <img src={program.coverUrl} alt="" /> : null}
            </div>
            <div className="admin-card-main">
              <h2 className="admin-card-title">{program.name}</h2>
              <p className="admin-card-meta">
                /{program.slug} · {program.pageCount} {program.pageCount === 1 ? "página" : "páginas"}
              </p>
            </div>
            <div className="admin-actions">
              <Link href={`/${program.slug}`} target="_blank" className="admin-button secondary">
                Ver
              </Link>
              <Link href={`/admin/programas/${program.slug}`} className="admin-button secondary">
                Editar
              </Link>
              <button type="button" className="danger-x" onClick={() => handleDelete(program.slug)} aria-label={`Eliminar ${program.slug}`}>
                ×
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
