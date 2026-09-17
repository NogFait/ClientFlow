import type { ReactNode } from "react"
import { useInView } from "../../../hooks/useInView"
import styles from "./ScrollReveal.module.css"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
}

// Thin wiring around the (TDD-tested) useInView hook: fades the wrapped
// block up as it scrolls into the viewport, matching the approved landing
// design's ".sr" sections. `once: false` so the reveal replays on every
// pass (a block that leaves through the BOTTOM re-hides; one scrolled past
// the top stays visible — see useInView). prefers-reduced-motion is handled
// in CSS (ScrollReveal.module.css), not here.
const ScrollReveal = ({ children, className }: ScrollRevealProps) => {
  const { ref, isInView } = useInView<HTMLDivElement>({ once: false })
  const classes = [styles.reveal, isInView && styles.visible, className].filter(Boolean).join(" ")

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  )
}

export default ScrollReveal
