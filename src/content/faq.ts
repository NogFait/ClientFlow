export interface FaqItem {
  question: string
  answer: string
}

// Shared FAQ copy — landing page's #faq section and the dedicated /pricing
// page render the same accordion from this single source (design source:
// scratchpad design/Main.dc.html — questions only; answers 2-4 authored here
// to match the product's real Free-limit/cancellation/currency behavior).
export const FAQ_ITEMS: FaqItem[] = [
  {
    // Sets the expectation "CRM" can raise (pipeline, leads) straight — the
    // audit's positioning note. Honest anti-pitch, and a rich-result line.
    question: "¿Es un CRM de ventas?",
    answer:
      "No. ClientFlow no tiene leads, pipeline ni automatizaciones de marketing. Es para el trabajo que ya tenés: quién es tu cliente, qué le debés entregar y cuánto te falta cobrar.",
  },
  {
    question: "¿Necesito tarjeta para empezar?",
    answer: "No. Creás la cuenta con tu email y usás el plan Free todo el tiempo que quieras.",
  },
  {
    question: "¿Qué pasa cuando supero los 3 clientes?",
    answer:
      "No perdés nada. Podés seguir viendo, editando y usando lo que ya cargaste, pero no vas a poder crear un cuarto cliente hasta pasar a Pro.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. Cancelás cuando quieras desde tu cuenta y mantenés el acceso Pro hasta el final del período que ya pagaste.",
  },
  {
    question: "¿En qué moneda pago?",
    answer: "Los precios están en dólares (USD). El cobro lo procesa Polar, con tarjeta internacional.",
  },
]
