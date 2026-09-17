import type { LegalDocument } from "./types"
import { CONTACT_EMAIL } from "../contact"

// Plain-language privacy policy. Same rule as terms.ts: only what the
// product verifiably does today. The "Cómo protegemos tus datos" section
// mirrors the security audit of 2026-09-16 (RLS, TLS, headers) — update it
// if that changes.
export const PRIVACY_DOCUMENT: LegalDocument = {
  title: "Política de privacidad",
  lastUpdated: "Septiembre de 2026",
  sections: [
    {
      heading: "Responsable",
      paragraphs: [
        `El responsable del tratamiento de los datos es Fausto Chirino, Mendoza, Argentina. Cualquier consulta sobre esta política podés enviarla a ${CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: "Qué datos guardamos",
      paragraphs: [
        "Tu email, para identificar tu cuenta.",
        "Los datos que vos cargás en la aplicación: clientes, proyectos, tareas y pagos. Todo eso lo ingresás vos — ClientFlow no lo obtiene de ninguna otra fuente.",
      ],
    },
    {
      heading: "Dónde se alojan tus datos",
      paragraphs: [
        "Usamos Supabase como infraestructura de base de datos y autenticación. Los servidores de Supabase para este proyecto están alojados en Estados Unidos.",
      ],
    },
    {
      heading: "Cómo protegemos tus datos",
      paragraphs: [
        "Cada usuario solo puede acceder a sus propios datos: el aislamiento se aplica en la base de datos (políticas de seguridad a nivel de fila en PostgreSQL), no solo en la interfaz, y está cubierto por pruebas automáticas.",
        "Toda la comunicación entre tu navegador y ClientFlow viaja cifrada (HTTPS). Las contraseñas nunca se guardan en texto plano: Supabase Auth las almacena con hash.",
        "Las claves y credenciales del sistema no forman parte del código público de la aplicación y están restringidas al servidor.",
      ],
    },
    {
      heading: "Pagos",
      paragraphs: [
        "Los pagos del plan Pro los procesa Polar, que actúa como Merchant of Record. No vemos ni guardamos números de tarjeta ni otros datos de pago — esa información queda del lado de Polar.",
      ],
    },
    {
      heading: "Analítica",
      paragraphs: [
        "Usamos Vercel Web Analytics para medir visitas de forma agregada (páginas vistas, país, dispositivo). No usa cookies ni identifica a personas individuales.",
      ],
    },
    {
      heading: "Con quién compartimos datos",
      paragraphs: [
        "Compartimos datos únicamente con los proveedores que hacen funcionar el Servicio: Supabase (base de datos y autenticación), Vercel (alojamiento de la aplicación y analítica) y Polar (procesamiento de pagos). No vendemos ni compartimos tus datos con nadie más.",
      ],
    },
    {
      heading: "Cuánto tiempo guardamos tus datos",
      paragraphs: [
        "Guardamos tus datos mientras tu cuenta esté activa. Podés pedir la eliminación de tu cuenta y tus datos en cualquier momento (ver \"Tus derechos\" más abajo).",
      ],
    },
    {
      heading: "Tus derechos",
      paragraphs: [
        `Podés pedirnos acceder, corregir o eliminar tus datos escribiendo a ${CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: "Cambios a esta política",
      paragraphs: [
        "Podemos actualizar esta política en el futuro. Si hacemos un cambio importante, te avisamos por email o dentro de la aplicación.",
      ],
    },
  ],
}
