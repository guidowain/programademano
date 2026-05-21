"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MetricsProgram = {
  name: string;
  slug: string;
  coverUrl: string | null;
  pageCount: number;
  analytics: {
    configured: boolean;
    last30DaysViews: number;
    totalViews: number;
    last30DaysRecommendations: number;
    totalRecommendations: number;
    error?: string;
  };
};

export default function AdminMetricasPage() {
  const [programs, setPrograms] = useState<MetricsProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchMetrics() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/metricas", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudieron cargar las métricas");
        return;
      }

      setPrograms(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
  }, []);

  const analyticsError = programs.find((program) => program.analytics.error)?.analytics.error;

  return (
    <>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-title">Métricas</h1>
          <p className="admin-subtitle">Vista rápida por obra.</p>
        </div>
      </header>

      {loading ? <p className="admin-subtitle">Cargando...</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {!loading && !error && analyticsError ? <p className="admin-card-meta admin-metrics-note">{analyticsError}</p> : null}

      {!loading && !error && programs.length === 0 ? (
        <div className="admin-empty">Todavía no hay programas para medir.</div>
      ) : null}

      <div className="admin-metrics-grid">
        {programs.map((program) => (
          <article className="admin-metric-card" key={program.slug}>
            <Link href={`/admin/programas/${program.slug}`} className="admin-metric-cover" aria-label={`Editar ${program.name}`}>
              {program.coverUrl ? <img src={program.coverUrl} alt="" /> : <span>Sin imagen</span>}
            </Link>

            <div className="admin-metric-body">
              <div>
                <h2 className="admin-card-title">{program.name}</h2>
                <p className="admin-card-meta">/{program.slug}</p>
              </div>

              <div className="admin-metric-stats">
                <MetricStat label="Visitas 30 días" value={program.analytics.last30DaysViews} />
                <MetricStat label="Visitas total" value={program.analytics.totalViews} />
                <MetricStat label="Recos 30 días" value={program.analytics.last30DaysRecommendations} />
                <MetricStat label="Recos total" value={program.analytics.totalRecommendations} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function MetricStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-metric-stat">
      <span>{label}</span>
      <strong>{value.toLocaleString("es-AR")}</strong>
    </div>
  );
}
