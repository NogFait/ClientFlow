// Single source of truth for the site's public origin and default SEO copy.
// Used by usePageMeta (canonical/og/twitter tags), index.html's static
// JSON-LD, and the sitemap test — change the domain here, not in six places.
export const SITE_URL = "https://clientflow.lat"
export const SITE_NAME = "ClientFlow"
export const DEFAULT_DESCRIPTION =
  "Tus clientes, proyectos y cobros en un solo lugar. Gratis hasta 3 clientes, sin tarjeta."
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`
