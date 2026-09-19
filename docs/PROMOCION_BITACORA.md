# Bitácora de promoción

Notas internas, no se publican. Materia prima para un futuro artículo del blog.

## Cómo usar esto

Una entrada por acción de promoción. Anotar el mismo día, con números reales
sacados de Vercel Analytics (Visitantes, Referrers, UTM) y de Supabase
(usuarios registrados). Sin adjetivos: lo que se hizo, lo que pasó, lo que
sorprendió. De acá sale el artículo "qué pasó cuando promocioné mi SaaS".

Fuentes:

- Visitas y origen: Vercel → client-flow → Analytics (filtrar por UTM / Referrers).
- Registros: cantidad de usuarios en Supabase Auth ese día vs. el anterior.
- Búsquedas: Search Console → Rendimiento (recién a partir de la segunda semana).

## Plantilla

### YYYY-MM-DD · Canal · Qué publiqué

- Link / UTM:
- Hora de publicación:
- A las 2 h: impresiones · reacciones · comentarios · visitas al sitio
- A las 24 h: impresiones · reacciones · comentarios · visitas · registros nuevos
- A los 7 días: idem
- Qué me sorprendió:
- Qué haría distinto:

## Entradas

### 2026-09-16 · Lanzamiento técnico

- Sitio en producción con dominio propio, blog con 2 artículos, Search Console y
  Bing configurados, indexación pedida para /, /pricing y el artículo de cobros.
- Visitas antes de cualquier promoción: 0 (línea de base).
- Registros antes de cualquier promoción: (anotar el número de Supabase Auth).

### 2026-09-17 · LinkedIn · Post de lanzamiento (perfil personal, 111 seguidores)

- Link / UTM: https://clientflow.lat?utm_source=linkedin&utm_medium=social&utm_campaign=lanzamiento (acortado por LinkedIn a lnkd.in/dt5tn_pg).
- Hora de publicación: miércoles 17, mañana (AR).
- A las 48 h (medido el 19/09): 160 impresiones · 69 miembros alcanzados (52 % red propia / 48 % fuera) · 2 reacciones · 0 comentarios · 0 compartidos · 0 guardados · 3 clics al link · 0 visitas al perfil · 0 seguidores nuevos.
- Sitio (Vercel, 7 días): 68 visitantes / 380 vistas, pero contaminado por pruebas propias (rutas /dashboard, /payments, /projects son mías). Referrers LinkedIn: 3 (linkedin.com, lnkd.in, app Android) — coincide con los 3 clics. Google: 13 (búsquedas de marca propias + indexación). UTM no disponible en el plan Hobby de Vercel.
- Registros nuevos atribuibles al post: 0 (los altas del 17–19 fueron cuentas de prueba).
- Público que lo vio: 46 % "sin experiencia", 36 % sector desarrollo de software, 25 % Buenos Aires, cargo más común "programador full stack".
- Qué me sorprendió: rindió por debajo de los posts de certificados de cursos (200 impresiones, 2–3 reacciones, 1–2 comentarios) con el mismo perfil. El público alcanzado son estudiantes y programadores, no freelancers con clientes. Cero comentarios = el algoritmo no lo movió fuera del primer círculo.
- Qué haría distinto: link en el primer comentario, no en el cuerpo. Pedir 3–4 comentarios en la primera hora a gente cercana. Hablar del PROBLEMA (cobros, clientes que no pagan) sin link, varias veces por semana, antes de pedir el registro. Ir a donde están los freelancers (comunidades, no mi feed de devs).
