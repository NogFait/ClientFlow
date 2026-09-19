import { useTranslation } from "react-i18next"
import { getLegalDocument, type LegalKind } from "../content/legal/documents"
import type { LegalDocument } from "../content/legal/types"

export function useLegalDocument(kind: LegalKind): LegalDocument {
  const { t } = useTranslation("legal")
  return getLegalDocument(kind, t)
}
