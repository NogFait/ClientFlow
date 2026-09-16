import { useEffect, useRef, useState, useSyncExternalStore } from "react"

interface UseInViewOptions {
  threshold?: number
  once?: boolean
}

interface UseInViewResult<T extends Element> {
  ref: React.RefObject<T | null>
  isInView: boolean
}

// Capability check as an external store rather than a useState initializer:
// the public pages are prerendered under Node (no IntersectionObserver), so
// the server snapshot must say "not missing" — otherwise the server HTML
// would carry the reveal class while the hydrating client (a browser with
// IO) wouldn't, and React would report a mismatch. useSyncExternalStore
// hydrates with the server snapshot, then re-renders with the client one,
// so an old browser without IO still ends up "always visible" one commit
// later — without a synchronous setState in an effect (React Compiler rule).
const subscribeNoop = () => () => {}
const lacksIntersectionObserver = () => typeof IntersectionObserver === "undefined"
const serverHasIntersectionObserver = () => false

// Scroll-reveal primitive: observes when the element the returned `ref` is
// attached to enters the viewport. Defaults match the approved landing
// design (threshold 0.15, once:true — reveal, don't re-hide on scroll back
// up). Falls back to "always in view" when IntersectionObserver isn't
// available (older browsers, non-DOM test environments without a mock).
export function useInView<T extends Element>(options: UseInViewOptions = {}): UseInViewResult<T> {
  const { threshold = 0.15, once = true } = options
  const ref = useRef<T | null>(null)
  const [observedInView, setObservedInView] = useState(false)
  const noObserver = useSyncExternalStore(subscribeNoop, lacksIntersectionObserver, serverHasIntersectionObserver)

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
          setObservedInView(true)
          if (once) observer.unobserve(node)
        } else if (!once) {
          setObservedInView(false)
        }
      },
      { threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, once])

  return { ref, isInView: observedInView || noObserver }
}
