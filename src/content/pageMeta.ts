import { DEFAULT_DESCRIPTION, SITE_NAME } from "./site"

// Single source of truth for the <head> of every public, indexable route.
// Consumed twice — by usePageMeta at runtime (client-side navigation) and by
// scripts/prerender.mjs at build time (the static HTML crawlers receive) —
// so the two can never drift apart. Pure module: no DOM, no React, safe to
// import from Node.
export type PublicPath = "/" | "/pricing" | "/terms" | "/privacy"

export interface PublicPageMeta {
  path: PublicPath
  title: string
  description: string
}

export const PUBLIC_PAGE_META: Record<PublicPath, PublicPageMeta> = {
  "/": {
    path: "/",
    title: `${SITE_NAME} — CRM para freelancers`,
    description: DEFAULT_DESCRIPTION,
  },
  "/pricing": {
    path: "/pricing",
    title: `Precios — ${SITE_NAME}`,
    description: "Un solo plan pago, sin letra chica. Empezá gratis y pagá cuando crezcas.",
  },
  // The legal drafts open with "[RAZÓN SOCIAL]"-style placeholders, so their
  // descriptions are written by hand (summarising the document) instead of
  // being lifted from the first paragraph.
  "/terms": {
    path: "/terms",
    title: `Términos de servicio — ${SITE_NAME}`,
    description:
      "Términos de servicio de ClientFlow, el CRM para freelancers: tu cuenta, planes Free y Pro, pagos vía Polar, cancelación y eliminación de datos.",
  },
  "/privacy": {
    path: "/privacy",
    title: `Política de privacidad — ${SITE_NAME}`,
    description:
      "Qué datos guarda ClientFlow (tu email y lo que cargás: clientes, proyectos, tareas y pagos), dónde se alojan y cómo pedir que los eliminemos.",
  },
}

// Ordered list of the routes above — the exact set scripts/prerender.mjs
// emits as static HTML and sitemap.xml advertises.
export const PUBLIC_PATHS = Object.keys(PUBLIC_PAGE_META) as PublicPath[]
