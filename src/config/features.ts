// Feature flags read from Vite env vars. Off by default so billing UI/RPC
// calls stay dark until M2's checkout flow and limit trigger are live
// (design §7 deploy order).
export const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === "true"
