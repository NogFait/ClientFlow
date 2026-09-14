// Webhook signature verification needs the exact original bytes, so
// api/billing/webhook.ts disables Vercel's default JSON body parsing
// (`export const config = { api: { bodyParser: false } }`) and reads the
// request as a raw stream instead. Concatenating as Buffers (not strings)
// before the final utf8 decode avoids corrupting multi-byte characters that
// happen to be split across chunk boundaries.
export interface RawBodySource {
  [Symbol.asyncIterator](): AsyncIterator<string | Buffer>
}

export async function readRawBody(req: RawBodySource): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}
