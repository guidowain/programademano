"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsEventName = "view_program" | "click_recommend_whatsapp";
type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: AnalyticsEventName, params?: AnalyticsEventParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", name, params);
}

export {};
