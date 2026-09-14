import { describe, expect, it } from "vitest"
import { InvalidSignatureError } from "./BillingProvider"

describe("InvalidSignatureError", () => {
  it("is a real Error with a distinguishable name", () => {
    const err = new InvalidSignatureError("bad signature")

    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("InvalidSignatureError")
    expect(err.message).toBe("bad signature")
  })
})
