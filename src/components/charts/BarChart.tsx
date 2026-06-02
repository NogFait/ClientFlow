import type { CSSProperties } from "react"
import { scaleBand, scaleLinear, max } from "d3"
import { ClientTooltip, TooltipContent, TooltipTrigger } from "./ClientTooltip"
import styles from "./BarChart.module.css"

interface BarChartProps {
  data: { key: string; value: number }[]
}

export const BarChart = ({ data }: BarChartProps) => {
  if (data.length === 0) return null

  const maxValue = max(data.map(d => d.value)) ?? 0

  const xScale = scaleBand()
    .domain(data.map(d => d.key))
    .range([0, 100])
    .padding(0.3)

  const yScale = scaleLinear()
    .domain([0, maxValue])
    .range([100, 0])

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div
      className={styles.chartContainer}
      style={{ "--marginTop": "0px", "--marginRight": "25px", "--marginBottom": "28px", "--marginLeft": "25px" } as CSSProperties}
    >
      <div className={styles.yAxis}>
        {yScale
          .ticks(6)
          .map(yScale.tickFormat(6, "d"))
          .map((value, i) => (
            <div key={i} className={styles.yAxisLabel} style={{ top: `${yScale(+value)}%` }}>
              {value}
            </div>
          ))}
      </div>

      <div className={styles.chartArea}>
        <svg viewBox="0 0 100 100" className={styles.chartSvg} preserveAspectRatio="none">
          {yScale
            .ticks(6)
            .map(yScale.tickFormat(6, "d"))
            .map((active, i) => (
              <g key={i} transform={`translate(0,${yScale(+active)})`}>
                <line x1={0} x2={100} className={styles.gridLine} />
              </g>
            ))}
        </svg>

        {data.map((entry, i) => {
          const xPos = xScale(entry.key)! + xScale.bandwidth() / 2
          return (
            <div
              key={i}
              className={styles.xLabel}
              style={{
                left: `${xPos}%`,
                top: "100%",
                transform: "translateX(-50%)",
              }}
            >
              {entry.key.length > 15 ? `${entry.key.slice(0, 15)}…` : entry.key}
            </div>
          )
        })}

        {data.map((d, i) => {
          const barWidth = xScale.bandwidth()
          const barHeight = yScale(0) - yScale(d.value)
          if (barHeight <= 0) return null

          return (
            <ClientTooltip key={i}>
              <TooltipTrigger>
                <div
                  className={styles.bar}
                  style={{
                    width: `${barWidth}%`,
                    height: `${barHeight}%`,
                    marginLeft: `${xScale(d.key)}%`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div style={{ fontWeight: 500 }}>{d.key}</div>
                <div>${fmt(d.value)}</div>
              </TooltipContent>
            </ClientTooltip>
          )
        })}
      </div>
    </div>
  )
}
