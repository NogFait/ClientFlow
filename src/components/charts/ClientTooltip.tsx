"use client"

import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

interface TooltipContextType {
  isOpen: boolean
  open: (e: React.MouseEvent) => void
  close: () => void
  pos: { x: number; y: number }
}

const TooltipContext = createContext<TooltipContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  pos: { x: 0, y: 0 },
})

export function ClientTooltip({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const open = (e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY })
    setIsOpen(true)
  }
  const close = () => setIsOpen(false)

  return (
    <TooltipContext.Provider value={{ isOpen, open, close, pos }}>
      {children}
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children }: { children: ReactNode }) {
  const { open, close } = useContext(TooltipContext)

  return (
    <span
      onMouseEnter={open}
      onMouseMove={open}
      onMouseLeave={close}
      style={{ display: "inline-block" }}
    >
      {children}
    </span>
  )
}

export function TooltipContent({ children }: { children: ReactNode }) {
  const { isOpen, pos } = useContext(TooltipContext)

  if (!isOpen) return null

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x + 10,
        top: pos.y - 10,
        zIndex: 9999,
        background: "var(--color-neutral-900)",
        color: "var(--color-text-inverse)",
        padding: "4px 8px",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-lg)",
        fontSize: "var(--font-size-xs)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  )
}
