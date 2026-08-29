import { describe, expect, it } from "vitest";
import { formatLimit, getPlan, PLANS } from "./plans";

describe("plans catalog", () => {
  it("defines exactly the 4 plans free/starter/pro/business, prices increasing", () => {
    expect(PLANS.map((plan) => plan.id)).toEqual(["free", "starter", "pro", "business"]);
    for (let i = 1; i < PLANS.length; i++) {
      expect(PLANS[i].price).toBeGreaterThan(PLANS[i - 1].price);
    }
  });

  it("free plan has the tightest limits, business plan is unlimited", () => {
    const free = getPlan("free");
    const business = getPlan("business");
    expect(free.maxProducts).toBeLessThan(business.maxProducts);
    expect(Number.isFinite(business.maxProducts)).toBe(false);
  });

  it("falls back to the free plan for an unknown or missing plan id", () => {
    expect(getPlan("does-not-exist").id).toBe("free");
    expect(getPlan(null).id).toBe("free");
    expect(getPlan(undefined).id).toBe("free");
  });
});

describe("formatLimit", () => {
  it("shows the number for finite limits", () => {
    expect(formatLimit(10)).toBe("10");
  });

  it("shows 'Illimité' for Infinity", () => {
    expect(formatLimit(Infinity)).toBe("Illimité");
  });
});
