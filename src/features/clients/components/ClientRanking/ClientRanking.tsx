import { useTranslation } from "react-i18next"
import { Trophy } from "lucide-react"
import { formatCurrency } from "../../../../utils/currency"
import type { ClientRankRow } from "../../domain/clientRanking"
import styles from "./ClientRanking.module.css"

interface ClientRankingProps {
  year: number
  rows: ClientRankRow[]
}

const TOP = 5

// Pro card on the Clients page. Presentational: the page computes the rows
// (rankClients) and gates it with <ProFeature>.
const ClientRanking = ({ year, rows }: ClientRankingProps) => {
  const { t } = useTranslation("app")
  const top = rows.filter((r) => r.collected > 0 || r.pending > 0).slice(0, TOP)
  const max = Math.max(1, ...top.map((r) => r.collected))

  return (
    <section className={styles.card} aria-labelledby="client-ranking-title">
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Trophy size={16} />
        </span>
        <div>
          <h3 id="client-ranking-title" className={styles.title}>{t("clients.ranking.title")}</h3>
          <p className={styles.subtitle}>
            {t("clients.ranking.description")} <span className={styles.year}>{year}</span>
          </p>
        </div>
      </div>

      {top.length === 0 ? (
        <p className={styles.empty}>{t("clients.ranking.empty")}</p>
      ) : (
        <ol className={styles.list}>
          {top.map((row, index) => (
            <li key={row.clientId} className={styles.item}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.body}>
                <div className={styles.line}>
                  <span className={styles.name}>{row.name}</span>
                  <span className={styles.collected}>{formatCurrency(row.collected)}</span>
                </div>
                <div className={styles.bar}>
                  <span className={styles.barFill} style={{ width: `${Math.round((row.collected / max) * 100)}%` }} />
                </div>
                <div className={styles.meta}>
                  <span>{t("clients.ranking.projects", { count: row.projects })}</span>
                  {row.pending > 0 && (
                    <span className={styles.pending}>
                      {t("clients.ranking.pending", { amount: formatCurrency(row.pending) })}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default ClientRanking
