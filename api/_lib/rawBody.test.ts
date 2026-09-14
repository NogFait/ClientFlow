import { describe, expect, it } from "vitest"
import { readRawBody } from "./rawBody.js"

function fakeStream(chunks: Array<string | Buffer>) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk
    },
  }
}

describe("readRawBody", () => {
  it("concatenates Buffer chunks into the exact original string", async () => {
    const body = JSON.stringify({ type: "subscription.active", data: { id: "sub_1" } })
    const stream = fakeStream([Buffer.from(body.slice(0, 5)), Buffer.from(body.slice(5))])

    const result = await readRawBody(stream)

    expect(result).toBe(body)
  })

  it("also handles string chunks (not just Buffers)", async () => {
    const stream = fakeStream(["hello ", "world"])

    expect(await readRawBody(stream)).toBe("hello world")
  })

  it("returns an empty string for a body with no chunks", async () => {
    const stream = fakeStream([])

    expect(await readRawBody(stream)).toBe("")
  })

  it("preserves multi-byte UTF-8 characters split across chunk boundaries", async () => {
    // "é" is 2 bytes in UTF-8 (0xC3 0xA9) — split the two bytes into separate chunks.
    const full = Buffer.from("café", "utf8")
    const stream = fakeStream([full.subarray(0, 3), full.subarray(3)])

    expect(await readRawBody(stream)).toBe("café")
  })
})
