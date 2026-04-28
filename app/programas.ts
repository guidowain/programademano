export const PROGRAMAS = {
  lacenadelostontos: [
    { src: "/programas/lacenadelostontos/page-001.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-002.webp", width: 1080, height: 3039 },
    { src: "/programas/lacenadelostontos/page-003.webp", width: 1080, height: 5402 },
    { src: "/programas/lacenadelostontos/page-004.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-005.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-006.webp", width: 1080, height: 990 },
    { src: "/programas/lacenadelostontos/page-007.webp", width: 1080, height: 3594 },
    { src: "/programas/lacenadelostontos/page-008.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-009.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-010.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-011.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-012.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-013.webp", width: 1080, height: 1920 },
    { src: "/programas/lacenadelostontos/page-014.webp", width: 1080, height: 1920 },
  ],
  miamigayyo: [
    { src: "/programas/miamigayyo/page-001.webp", width: 1080, height: 1920 },
    { src: "/programas/miamigayyo/page-002.webp", width: 1080, height: 3105 },
  ],
} as const;

export type ProgramaSlug = keyof typeof PROGRAMAS;
