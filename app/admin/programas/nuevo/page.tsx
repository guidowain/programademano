"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NuevoProgramaPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedSlug = slug.trim().toLowerCase();
    const normalizedName = name.trim();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/programas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, slug: normalizedSlug }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo crear el programa");
        return;
      }

      router.push(`/admin/programas/${data.slug}`);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-title">Nuevo programa</h1>
        </div>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label className="admin-field">
          <span className="admin-label">Nombre</span>
          <input
            className="admin-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mi amiga y yo"
            required
          />
        </label>

        <label className="admin-field">
          <span className="admin-label">Slug</span>
          <input
            className="admin-input"
            value={slug}
            onChange={(event) => setSlug(event.target.value.replace(/\s+/g, "-").toLowerCase())}
            placeholder="lacenadelostontos"
            pattern="[a-z0-9-]+"
            required
          />
        </label>

        {error ? <p className="admin-error">{error}</p> : null}

        <button type="submit" className="admin-button admin-gradient" disabled={loading}>
          {loading ? "Creando..." : "Crear programa"}
        </button>
      </form>
    </>
  );
}
