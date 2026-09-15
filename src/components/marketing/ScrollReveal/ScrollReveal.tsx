import type { ReactNode } from "react"
import { useInView } from "../../../hooks/useInView"
import styles from "./ScrollReveal.module.css"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
}

// Thin wiring around the (TDD-tested) useInView hook: fades the wrapped
// block up as it scrolls into the viewport, matching the approved landing
// design's ".sr" sections. prefers-reduced-motion is handled in CSS
// (ScrollReveal.module.css), not here — this component only tracks
// visibility.
const ScrollReveal = ({ children, className }: ScrollRevealProps) => {
  const { ref, isInView } = useInView<HTMLDivElement>()
  const classes = [styles.reveal, isInView && styles.visible, className].filter(Boolean).join(" ")

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  )
}

export default ScrollReveal
