"use client";

import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

type Props = {
  name: string;
  slug: string;
};

export default function ProgramViewTracker({ name, slug }: Props) {
  useEffect(() => {
    trackEvent("view_program", { program_slug: slug, program_name: name });
  }, [name, slug]);

  return null;
}
