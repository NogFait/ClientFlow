import type { LegalDocument } from "./types"

// DRAFT — see the notice rendered above these sections (LegalPage). Placeholders
// ([RAZÓN SOCIAL], [EMAIL DE CONTACTO], [JURISDICCIÓN]) need to be filled with
// real values before this goes live, and the whole document needs a lawyer's
// review — it is not a substitute for one. Content describes what the product
// actually does today; no compliance claims (GDPR/ISO/etc.) are made because
// none have been verified.
export const TERMS_DOCUMENT: LegalDocument = {
  title: "Términos de servicio",
  lastUpdated: "Septiembre de 2026",
  sections: [
    {
      heading: "Quiénes somos",
      paragraphs: [
        "ClientFlow es operado por [RAZÓN SOCIAL]. Estos términos regulan el uso de la aplicación web ClientFlow (el \"Servicio\").",
      ],
    },
    {
      heading: "Qué es ClientFlow",
      paragraphs: [
        "ClientFlow es un CRM pensado para freelancers: te permite cargar clientes, proyectos, tareas y pagos para llevar el seguimiento de tu trabajo en un solo lugar.",
      ],
    },
    {
      heading: "Tu cuenta",
      paragraphs: [
        "Creás una cuenta con tu email y una contraseña. La autenticación la maneja Supabase Auth. Sos responsable de mantener tus credenciales seguras y de toda la actividad que ocurra bajo tu cuenta.",
      ],
    },
    {
      heading: "Planes y pagos",
      paragraphs: [
        "ClientFlow ofrece un plan Free con límites de uso y un plan Pro (mensual o anual) sin esos límites.",
        "Los pagos del plan Pro los procesa Polar, que actúa como Merchant of Record: es Polar quien te factura y cobra, no nosotros. ClientFlow no almacena números de tarjeta ni otros datos de pago — eso queda enteramente del lado de Polar.",
      ],
    },
    {
      heading: "Cancelación",
      paragraphs: [
        "Podés cancelar tu suscripción Pro cuando quieras desde tu cuenta. Si cancelás, mantenés el acceso Pro hasta el final del período que ya pagaste; después tu cuenta vuelve automáticamente al plan Free (tus datos no se borran).",
      ],
    },
    {
      heading: "Eliminación de cuenta",
      paragraphs: [
        "Si querés eliminar tu cuenta y tus datos, escribinos a [EMAIL DE CONTACTO]. Todavía no ofrecemos autoservicio para esto dentro de la app.",
      ],
    },
    {
      heading: "Cambios a estos términos",
      paragraphs: [
        "Podemos actualizar estos términos en el futuro. Si hacemos un cambio importante, te avisamos por email o dentro de la aplicación.",
      ],
    },
    {
      heading: "Ley aplicable",
      paragraphs: ["Estos términos se rigen por las leyes de [JURISDICCIÓN]."],
    },
  ],
}
