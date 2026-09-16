import { afterEach, describe, expect, it } from "vitest"
import { clearPendingPlan, readPendingPlan, storePendingPlan } from "./pendingPlan"

const STORAGE_KEY = "clientflow.pendingPlan"

afterEach(() => {
  sessionStorage.clear()
})

describe("pendingPlan", () => {
  it("stores a valid paid plan and reads it back", () => {
    storePendingPlan("pro_monthly")

    expect(readPendingPlan()).toBe("pro_monthly")
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("pro_monthly")
  })

  it("stores pro_yearly and reads it back (triangulation: different plan)", () => {
    storePendingPlan("pro_yearly")

    expect(readPendingPlan()).toBe("pro_yearly")
  })

  it("does not persist an invalid/free plan code", () => {
    storePendingPlan("free")
    storePendingPlan("not-a-real-plan")

    expect(readPendingPlan()).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("readPendingPlan returns null when nothing was stored", () => {
    expect(readPendingPlan()).toBeNull()
  })

  it("clearPendingPlan removes a previously stored plan", () => {
    storePendingPlan("pro_monthly")
    clearPendingPlan()

    expect(readPendingPlan()).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
