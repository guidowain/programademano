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

              <MetricTable analytics={program.analytics} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function MetricTable({ analytics }: { analytics: MetricsProgram["analytics"] }) {
  return (
    <div className="admin-metric-table" aria-label="Métricas del programa">
      <span />
      <span>30 días</span>
      <span>Total</span>
      <strong>Visitas</strong>
      <b>{analytics.last30DaysViews.toLocaleString("es-AR")}</b>
      <b>{analytics.totalViews.toLocaleString("es-AR")}</b>
      <strong>Recomendaciones</strong>
      <b>{analytics.last30DaysRecommendations.toLocaleString("es-AR")}</b>
      <b>{analytics.totalRecommendations.toLocaleString("es-AR")}</b>
    </div>
  );
}
