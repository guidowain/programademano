import { getGoogleOAuthAccessToken } from "./google-auth";

const GA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const TOTAL_START_DATE = "2026-01-01";

type RunReportResponse = {
  rows?: Array<{
    metricValues?: Array<{ value?: string }>;
  }>;
  totals?: Array<{
    metricValues?: Array<{ value?: string }>;
  }>;
};

export type ProgramAnalytics = {
  configured: boolean;
  last30DaysViews: number;
  totalViews: number;
  last30DaysRecommendations: number;
  totalRecommendations: number;
  error?: string;
};

const EMPTY_ANALYTICS: ProgramAnalytics = {
  configured: false,
  last30DaysViews: 0,
  totalViews: 0,
  last30DaysRecommendations: 0,
  totalRecommendations: 0,
};

export async function getProgramAnalytics(slug: string): Promise<ProgramAnalytics> {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || "";
  const configured = Boolean(
    propertyId &&
    process.env.GOOGLE_ANALYTICS_CLIENT_ID &&
    process.env.GOOGLE_ANALYTICS_CLIENT_SECRET &&
    process.env.GOOGLE_ANALYTICS_REFRESH_TOKEN,
  );

  if (!configured) {
    return {
      ...EMPTY_ANALYTICS,
      error: "Analytics sin configurar.",
    };
  }

  try {
    const [last30DaysViews, totalViews, last30DaysRecommendations, totalRecommendations] = await Promise.all([
      getProgramViews(propertyId, slug, "30daysAgo"),
      getProgramViews(propertyId, slug, TOTAL_START_DATE),
      getProgramRecommendations(propertyId, slug, "30daysAgo"),
      getProgramRecommendations(propertyId, slug, TOTAL_START_DATE),
    ]);

    return {
      configured: true,
      last30DaysViews,
      totalViews,
      last30DaysRecommendations,
      totalRecommendations,
    };
  } catch (error) {
    return {
      ...EMPTY_ANALYTICS,
      configured: true,
      error: error instanceof Error ? error.message : "No se pudo leer Analytics.",
    };
  }
}

async function getProgramViews(propertyId: string, slug: string, startDate: string) {
  const report = await runReport(propertyId, {
    dateRanges: [{ startDate, endDate: "today" }],
    metrics: [{ name: "screenPageViews" }],
    dimensionFilter: programPathFilter(slug),
  });

  return getFirstMetricValue(report);
}

async function getProgramRecommendations(propertyId: string, slug: string, startDate: string) {
  const report = await runReport(propertyId, {
    dateRanges: [{ startDate, endDate: "today" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          programPathFilter(slug),
          {
            filter: {
              fieldName: "eventName",
              stringFilter: {
                matchType: "EXACT",
                value: "click_recommend_whatsapp",
              },
            },
          },
        ],
      },
    },
  });

  return getFirstMetricValue(report);
}

function programPathFilter(slug: string) {
  return {
    filter: {
      fieldName: "pagePath",
      stringFilter: {
        matchType: "EXACT",
        value: `/${slug}`,
      },
    },
  };
}

async function runReport(propertyId: string, body: Record<string, unknown>): Promise<RunReportResponse> {
  const accessToken = await getAnalyticsAccessToken();
  const response = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Google Analytics no aceptó la consulta.");
  }

  return data;
}

async function getAnalyticsAccessToken() {
  const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ANALYTICS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Faltan credenciales de Google Analytics.");
  }

  return getGoogleOAuthAccessToken({
    clientId,
    clientSecret,
    refreshToken,
    cacheKey: "programa-de-mano-google-analytics",
  });
}

function getFirstMetricValue(report: RunReportResponse) {
  const metricValue = report.totals?.[0]?.metricValues?.[0]?.value ?? report.rows?.[0]?.metricValues?.[0]?.value;
  const parsed = Number(metricValue ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
