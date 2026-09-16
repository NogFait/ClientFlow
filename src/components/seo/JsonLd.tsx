import { useEffect } from "react"

interface JsonLdProps {
  data: object
}

// Injects a <script type="application/ld+json"> into <head> for the
// lifetime of the mount and removes it on unmount — same pattern as
// usePageMeta, kept separate because structured data isn't page-meta (no
// attribute to restore, just a script tag to add/remove).
const JsonLd = ({ data }: JsonLdProps) => {
  useEffect(() => {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [data])

  return null
}

export default JsonLd
