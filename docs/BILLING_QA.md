# QA manual de billing (sandbox Polar)

Estado: **checklist escrito, ejecución pendiente del usuario**. Esta sesión no
puede disparar renovaciones fallidas ni tocar el dashboard de Polar — es
trabajo manual del dueño de la cuenta. Este documento es la guía paso a paso
para hacerlo y saber qué mirar en cada capa (Polar, Postgres, UI).

Requisitos antes de empezar:
- `VITE_BILLING_ENABLED=true` en el entorno donde estés probando.
- Deploy con el webhook de Polar sandbox registrado (`POLAR_WEBHOOK_SECRET`
  cargado) — ver el checklist de deploy en `README.md`.
- Una cuenta de prueba en plan Pro (mensual o anual) contratado en sandbox.
- Acceso al dashboard de Polar sandbox (`https://sandbox.polar.sh`) y a la
  base de datos (SQL editor de Supabase o `psql` contra el proyecto linkeado).

Convención de esta guía: cada paso dice qué hacer, qué esperar en Postgres
(`subscriptions`, `billing_events`), qué esperar en la UI (`/settings/billing`,
copy exacto de `BillingSettings.tsx`), y qué evento de Polar dispara el cambio.

---

## 1. Cancelar vía portal (cancelación programada)

**Acción**: en `/settings/billing`, botón "Gestionar suscripción" → portal de
Polar → cancelar la suscripción (Polar por defecto la marca para cancelar al
fin del período, no de forma inmediata).

**Evento de Polar esperado**: `subscription.updated` con
`cancel_at_period_end: true` (la suscripción sigue `active` en Polar, solo
queda flageada).

**`subscriptions` esperado**:
- `status = 'active'` (sigue activa, NO pasa a `canceled` todavía — ver el
  reducer `applySubscriptionEvent`, caso `"active"` con
  `cancelAtPeriodEnd: true`)
- `cancel_at_period_end = true`
- `current_period_end` sin cambios (la fecha de fin del período actual)
- `grace_until = null`

**`billing_events` esperado**: una fila nueva, `type` conteniendo
`subscription.updated` (o el nombre exacto que emita Polar), `processed_at`
seteado (no null — significa que se aplicó, no que se ignoró).

**UI esperada** (`/settings/billing`): línea de estado
`"Termina el {fecha} — podés reactivarlo cuando quieras"` (formato es-AR,
`formatDateEsAr`), y aparece el botón **"Reactivar suscripción"** además de
"Gestionar suscripción".

---

## 2. Reactivar (deshacer la cancelación programada)

**Acción**: clickear "Reactivar suscripción" (te lleva al portal de Polar
igual que "Gestionar") → dentro del portal, deshacer la cancelación
programada.

**Evento de Polar esperado**: otro `subscription.updated`, esta vez con
`cancel_at_period_end: false`.

**`subscriptions` esperado**:
- `status = 'active'`
- `cancel_at_period_end = false`
- `current_period_end` sin cambios

**UI esperada**: la línea de estado vuelve a
`"Activo · se renueva el {fecha}"`, el botón "Reactivar suscripción"
desaparece (solo queda "Gestionar suscripción").

**Chequeo de orden**: si por algún motivo el evento de reactivación llega
CON UNA MARCA DE TIEMPO anterior al de cancelación (no debería pasar en un
flujo manual normal, pero es la garantía que protege al reducer), no debe
aplicarse — confirmalo revisando que `updated_at` en `subscriptions` avanzó
y no retrocedió.

---

## 3. Simular `past_due` en sandbox

**Esto es lo menos determinista de las tres pruebas** — Polar no documenta
públicamente (al momento de escribir esto) un botón "marcar como past_due"
de un click en el dashboard sandbox. Dos caminos posibles, probá el primero:

**Camino A — tarjeta de prueba que falla en la renovación**: Polar sandbox
soporta tarjetas de prueba de Stripe/su procesador subyacente para simular
fallos. Buscá en el dashboard de Polar sandbox, al crear o editar el método
de pago de la suscripción de prueba, una opción de tarjeta que "falla en
renovación" o similar (revisá la documentación de Polar vigente al momento
de la prueba — puede haber cambiado). Si configurás esa tarjeta ANTES de que
el período se renueve, la renovación debería fallar y Polar debería emitir
un evento de suscripción en `past_due`.

**Camino B — dashboard admin de Polar**: si el dashboard de Polar sandbox
expone una acción manual tipo "marcar como past_due" o "simular pago
fallido" sobre una suscripción existente, usá esa. **No tengo confirmación
de que este botón exista** en la versión actual de Polar — si no lo
encontrás, quedate con el Camino A o contactá soporte de Polar.

Si ninguno de los dos funciona, documentá acá qué encontraste (o no) para
que quede como referencia para la próxima vez.

**Evento de Polar esperado**: `subscription.updated` (o un evento específico
como `subscription.past_due` según la versión del SDK) con
`status: "past_due"`.

**`subscriptions` esperado**:
- `status = 'past_due'`
- `grace_until` = fecha de ahora + 7 días (`GRACE_PERIOD_MS` en
  `src/features/billing/domain/subscription.ts`) — **la primera vez**. Si el
  webhook se reintenta o llega duplicado, `grace_until` NO debe correrse
  hacia adelante (es un `coalesce`, no un reset) — probalo reenviando el
  mismo evento desde el dashboard de Polar (o dejando que Polar reintente) y
  confirmando que `grace_until` quedó exactamente igual.

**`billing_events` esperado**: nueva fila, `processed_at` seteado.

**UI esperada**: `"Pago pendiente · acceso Pro hasta {fecha de grace_until}"`
— el usuario sigue viendo su plan Pro y sus límites de Pro (`isPro()` sigue
devolviendo true mientras `status !== 'canceled'`), pero con el aviso de
pago pendiente. El botón "Reactivar suscripción" NO debería aparecer acá
(ese botón es específico del caso `cancel_at_period_end`, no de `past_due`)
— confirmá que solo aparece "Gestionar suscripción".

**Después de esto**: dentro del portal de Polar, actualizá el método de
pago a uno válido y forzá/esperá el reintento de cobro. Evento esperado:
`subscription.updated` con `status: "active"` de nuevo, `grace_until` vuelve
a `null` en `subscriptions` (ver el reducer, caso `"active"` siempre limpia
`graceUntil`).

---

## 4. Registro de auditoría (`billing_events`)

Para cada uno de los tres pasos de arriba, verificá en `billing_events`:

```sql
select provider, provider_event_id, type, processed_at, error
from billing_events
order by received_at desc
limit 10;
```

- Cada evento real de Polar aparece una sola vez (`provider_event_id` es
  `UNIQUE` junto con `provider` — un reintento de Polar con el mismo id no
  duplica la fila).
- `processed_at` no nulo en los eventos que sí cambiaron algo.
- `error` nulo salvo que hayas provocado un fallo a propósito (por ejemplo,
  un usuario no resoluble) — en ese caso el evento igual queda auditado.

## 5. Qué reportar si algo no coincide

Si alguno de estos pasos da un resultado distinto al esperado acá, no lo
"arregles" ajustando la expectativa de este documento — es una señal de que
el reducer (`applySubscriptionEvent`), el webhook handler
(`api/billing/webhook.ts`) o el mapeo de estado del adaptador
(`api/_lib/polar/PolarBillingProvider.ts`) tienen un caso real no cubierto
por los tests unitarios. Anotá el evento crudo de Polar (payload completo,
visible en su dashboard) y el estado resultante en `subscriptions` para
poder escribir un test de regresión antes de tocar el código.
