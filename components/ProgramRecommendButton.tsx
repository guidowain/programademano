"use client";

import { trackEvent } from "@/lib/analytics";

type Props = {
  href: string;
  name: string;
  slug: string;
};

export default function ProgramRecommendButton({ href, name, slug }: Props) {
  return (
    <a
      href={href}
      className="program-recommend-button"
      target="_blank"
      rel="noreferrer"
      onClick={() => trackEvent("click_recommend_whatsapp", { program_slug: slug, program_name: name })}
    >
      <span>Recomendá</span>
      <strong>{name}</strong>
    </a>
  );
}
