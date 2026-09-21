import { afterEach, describe, expect, it, vi } from "vitest"
import { createResendSender } from "./resend.js"

const fetchMock = vi.fn()

afterEach(() => {
  fetchMock.mockReset()
})

describe("createResendSender", () => {
  it("POSTs the email to Resend with the API key and the ClientFlow sender", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "em_1" }) })
    const send = createResendSender({ apiKey: "re_test", from: "ClientFlow <resumen@clientflow.lat>", fetchImpl: fetchMock })

    const result = await send({ to: "tita@estudio.com", subject: "Hola", html: "<p>hi</p>", text: "hi" })

    expect(result).toEqual({ id: "em_1" })
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer re_test", "Content-Type": "application/json" },
      body: JSON.stringify({ from: "ClientFlow <resumen@clientflow.lat>", to: ["tita@estudio.com"], subject: "Hola", html: "<p>hi</p>", text: "hi" }),
    })
  })

  it("throws with Resend's status and message when the request is refused", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422, json: async () => ({ message: "Invalid `to`" }) })
    const send = createResendSender({ apiKey: "re_test", from: "x@y.z", fetchImpl: fetchMock })

    await expect(send({ to: "nope", subject: "s", html: "h", text: "t" })).rejects.toThrow("Resend 422: Invalid `to`")
  })
})
