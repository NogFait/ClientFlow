import type { LegalDocument } from "./types"
import { CONTACT_EMAIL } from "../contact"

// Plain-language terms. Every statement here describes what the product
// actually does today (verified against the codebase); no compliance claims
// (GDPR/ISO/etc.) are made because none have been certified. A lawyer's
// review is still recommended before scaling — keep the text honest rather
// than impressive.
export const TERMS_DOCUMENT: LegalDocument = {
  title: "Términos de servicio",
  lastUpdated: "Septiembre de 2026",
  sections: [
    {
      heading: "Quiénes somos",
      paragraphs: [
        "ClientFlow es desarrollado y operado por Fausto Chirino, con domicilio en Mendoza, Argentina. Estos términos regulan el uso de la aplicación web ClientFlow (el \"Servicio\"). Al crear una cuenta, aceptás estos términos.",
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
        `Si querés eliminar tu cuenta y tus datos, escribinos a ${CONTACT_EMAIL}. Todavía no ofrecemos autoservicio para esto dentro de la app.`,
      ],
    },
    {
      heading: "Cambios a estos términos",
      paragraphs: [
        "Podemos actualizar estos términos en el futuro. Si hacemos un cambio importante, te avisamos por email o dentro de la aplicación.",
      ],
    },
    {
      heading: "Uso aceptable",
      paragraphs: [
        "Podés usar ClientFlow para gestionar tu propio trabajo. No está permitido usarlo para actividades ilegales, para cargar datos de terceros sin tener derecho a hacerlo, ni para intentar acceder a cuentas o datos que no sean tuyos.",
      ],
    },
    {
      heading: "Disponibilidad y responsabilidad",
      paragraphs: [
        "ClientFlow es un producto en evolución mantenido por una sola persona. Hacemos lo posible para que esté disponible y funcione bien, pero no garantizamos disponibilidad ininterrumpida ni ausencia de errores. El Servicio se ofrece \"tal cual\"; no somos responsables por pérdidas derivadas de su uso, más allá de lo que la ley exija.",
        "Sos responsable de la exactitud de los datos que cargás y de conservar tus propios respaldos de la información que consideres crítica.",
      ],
    },
    {
      heading: "Ley aplicable",
      paragraphs: [
        "Estos términos se rigen por las leyes de la República Argentina. Ante cualquier conflicto, las partes se someten a los tribunales ordinarios de la Provincia de Mendoza, Argentina.",
      ],
    },
  ],
}
