import { useEffect } from "react"

// Sets document.title for the lifetime of the mounted page. No external
// head-management library needed for a handful of static public pages.
export function useDocumentTitle(title: string, description?: string): void {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    let metaDescription: HTMLMetaElement | null = null
    let previousDescription: string | null = null
    if (description) {
      metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement("meta")
        metaDescription.setAttribute("name", "description")
        document.head.appendChild(metaDescription)
      }
      previousDescription = metaDescription.getAttribute("content")
      metaDescription.setAttribute("content", description)
    }

    return () => {
      document.title = previousTitle
      if (metaDescription && previousDescription !== null) {
        metaDescription.setAttribute("content", previousDescription)
      }
    }
  }, [title, description])
}
