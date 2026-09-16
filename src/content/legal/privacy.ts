import type { LegalDocument } from "./types"
import { CONTACT_EMAIL } from "../contact"

// DRAFT — see the notice rendered above these sections (LegalPage). Same
// placeholder/no-fabricated-claims rules as terms.ts.
export const PRIVACY_DOCUMENT: LegalDocument = {
  title: "Política de privacidad",
  lastUpdated: "Septiembre de 2026",
  sections: [
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
      heading: "Pagos",
      paragraphs: [
        "Los pagos del plan Pro los procesa Polar, que actúa como Merchant of Record. No vemos ni guardamos números de tarjeta ni otros datos de pago — esa información queda del lado de Polar.",
      ],
    },
    {
      heading: "Con quién compartimos datos",
      paragraphs: [
        "Compartimos datos únicamente con los proveedores que hacen funcionar el Servicio: Supabase (infraestructura y autenticación) y Polar (procesamiento de pagos). No vendemos ni compartimos tus datos con nadie más.",
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
