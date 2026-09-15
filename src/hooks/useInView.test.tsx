import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { useInView } from "./useInView"

type ObserverCallback = (entries: Array<{ isIntersecting: boolean; boundingClientRect?: { bottom: number } }>) => void

interface MockObserverInstance {
  callback: ObserverCallback
  options: IntersectionObserverInit | undefined
  observedNode: Element | null
  observe: (node: Element) => void
  unobserve: (node: Element) => void
  disconnect: () => void
}

let instances: MockObserverInstance[] = []

function installIntersectionObserver() {
  instances = []
  class FakeIntersectionObserver implements Partial<IntersectionObserver> {
    private instance: MockObserverInstance

    constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
      this.instance = {
        callback,
        options,
        observedNode: null,
        observe: (node: Element) => {
          this.instance.observedNode = node
        },
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }
      instances.push(this.instance)
    }
    observe(node: Element) {
      this.instance.observe(node)
    }
    unobserve(node: Element) {
      this.instance.unobserve(node)
    }
    disconnect() {
      this.instance.disconnect()
    }
  }
  window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver
}

function TestTarget({ threshold, once }: { threshold?: number; once?: boolean }) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold, once })
  return (
    <div ref={ref} data-testid="target">
      {isInView ? "visible" : "hidden"}
    </div>
  )
}

beforeEach(() => {
  installIntersectionObserver()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useInView", () => {
  it("starts as not-in-view, then flips to in-view once the observer reports an intersecting entry", () => {
    render(<TestTarget />)

    expect(screen.getByTestId("target")).toHaveTextContent("hidden")

    const observerInstance = instances[0]
    act(() => {
      observerInstance.callback([{ isIntersecting: true }])
    })

    expect(screen.getByTestId("target")).toHaveTextContent("visible")
  })

  it("reveals an element the scroll already jumped past (not intersecting, but above the viewport)", () => {
    // A fast wheel or an anchor jump (#precios) can move an element from
    // below the viewport to above it between two frames: it never
    // intersects, so without this rule it would stay hidden forever.
    render(<TestTarget />)
    const observerInstance = instances[0]
    act(() => {
      observerInstance.callback([{ isIntersecting: false, boundingClientRect: { bottom: -120 } }])
    })
    expect(screen.getByTestId("target")).toHaveTextContent("visible")
  })

  it("uses threshold 0.15 by default (triangulation: observer configuration)", () => {
    render(<TestTarget />)

    expect(instances[0].options).toEqual({ threshold: 0.15 })
  })

  it("unobserves the node once it becomes visible when once=true (default)", () => {
    render(<TestTarget />)

    const observerInstance = instances[0]
    const node = screen.getByTestId("target")
    act(() => {
      observerInstance.callback([{ isIntersecting: true }])
    })

    expect(observerInstance.unobserve).toHaveBeenCalledWith(node)
  })

  it("does not hide again on exit when once=false and leaving the viewport re-hides it (triangulation: different option)", () => {
    render(<TestTarget once={false} />)

    const observerInstance = instances[0]
    act(() => {
      observerInstance.callback([{ isIntersecting: true }])
    })
    expect(screen.getByTestId("target")).toHaveTextContent("visible")

    act(() => {
      observerInstance.callback([{ isIntersecting: false }])
    })
    expect(screen.getByTestId("target")).toHaveTextContent("hidden")
    expect(observerInstance.unobserve).not.toHaveBeenCalled()
  })
})
