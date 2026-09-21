// Hands the browser a file to save. Blob + object URL + a click on a
// transient anchor — no library, works in every current browser.
export function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
