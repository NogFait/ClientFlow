# Blog posts

- Un archivo `.md` por post en esta carpeta. El nombre del archivo es el slug y la URL: `mi-post.md` → `/blog/mi-post` (kebab-case: minúsculas, dígitos y guiones).
- Frontmatter entre `---`: `title` (obligatorio), `description` (obligatorio, ≤160 caracteres — es la meta description), `date` (obligatorio, `YYYY-MM-DD`), `author` (opcional, default "Fausto Chirino"), `draft` (opcional, `true`/`false`), `tags` (opcional, `[a, b]`).
- Los títulos del cuerpo empiezan en `##`: la página pone el `<h1>` con el `title`.
- `draft: true` oculta el post del índice, del sitemap y del prerender (sigue visible en `pnpm dev` por su URL para previsualizarlo).
- Markdown GFM (tablas, listas, código). Nada de `<script>` ni HTML crudo.
- Publicar = commit + push a `main`: el build valida el frontmatter, prerenderiza `/blog/<slug>` y regenera `sitemap.xml`.
- Si un post está mal formado, `pnpm test` (y el build) fallan indicando el archivo y el error.
