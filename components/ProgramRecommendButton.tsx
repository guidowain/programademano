"use client";

import { trackEvent } from "@/lib/analytics";

type Props = {
  fallbackHref: string;
  message: string;
  name: string;
  slug: string;
};

export default function ProgramRecommendButton({ fallbackHref, message, name, slug }: Props) {
  async function handleClick() {
    trackEvent("click_recommend_whatsapp", { program_slug: slug, program_name: name });

    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: message,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    window.open(fallbackHref, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      className="program-recommend-button"
      onClick={handleClick}
    >
      <span>Recomendá</span>
      <strong>{name}</strong>
    </button>
  );
}
