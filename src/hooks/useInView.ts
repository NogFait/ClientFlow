import { useEffect, useRef, useState } from "react"

interface UseInViewOptions {
  threshold?: number
  once?: boolean
}

interface UseInViewResult<T extends Element> {
  ref: React.RefObject<T | null>
  isInView: boolean
}

// Scroll-reveal primitive: observes when the element the returned `ref` is
// attached to enters the viewport. Defaults match the approved landing
// design (threshold 0.15, once:true — reveal, don't re-hide on scroll back
// up). Falls back to "always in view" when IntersectionObserver isn't
// available (older browsers, non-DOM test environments without a mock).
export function useInView<T extends Element>(options: UseInViewOptions = {}): UseInViewResult<T> {
  const { threshold = 0.15, once = true } = options
  const ref = useRef<T | null>(null)
  // Environments without IntersectionObserver (older browsers) start
  // "already visible" via the initializer, not a synchronous setState in the
  // effect below (React Compiler's set-state-in-effect rule forbids that).
  const [isInView, setIsInView] = useState(() => typeof IntersectionObserver === "undefined")

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        // A fast wheel or an anchor jump can move the element from below the
        // viewport to above it between two frames — it never intersects. Treat
        // "already scrolled past" as revealed so nothing stays hidden forever.
        const scrolledPast = (entry.boundingClientRect?.bottom ?? 0) < 0
        if (entry.isIntersecting || scrolledPast) {
          setIsInView(true)
          if (once) observer.unobserve(node)
        } else if (!once) {
          setIsInView(false)
        }
      },
      { threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, once])

  return { ref, isInView }
}
