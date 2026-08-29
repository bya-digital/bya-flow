import { describe, expect, it } from "vitest";
import { calculateGrowthScore, type GrowthScoreInputs } from "./calculateScore";

const baseInputs: GrowthScoreInputs = {
  currentRevenue: 0,
  previousRevenue: 0,
  currentAverageBasket: 0,
  previousAverageBasket: 0,
  conversionRate: null,
  totalCustomers: 0,
  activeCustomers: 0,
  ordersCount: 0,
  distinctOrderingCustomers: 0,
  cartsAbandoned: 0,
  cartsTotal: 0,
  activeProductsCount: 0,
  productsWithSalesCount: 0,
  campaignsSentRecently: 0,
};

describe("calculateGrowthScore", () => {
  it("scores exactly 50 ('faible') with a store that has zero activity", () => {
    // Chaque facteur retombe sur sa valeur neutre par défaut (50) faute de
    // donnée : aucun facteur n'est jamais fabriqué à partir de rien.
    const result = calculateGrowthScore(baseInputs);
    expect(result.score).toBe(50);
    expect(result.band).toBe("faible");
  });

  it("reproduces the exact score verified manually in Phase 10/11 testing (91, excellent)", () => {
    const result = calculateGrowthScore({
      ...baseInputs,
      currentRevenue: 87,
      currentAverageBasket: 29,
      conversionRate: 100,
      totalCustomers: 1,
      activeCustomers: 1,
      ordersCount: 3,
      distinctOrderingCustomers: 1,
      cartsTotal: 1,
      activeProductsCount: 1,
      productsWithSalesCount: 1,
      campaignsSentRecently: 1,
    });
    expect(result.score).toBe(91);
    expect(result.band).toBe("excellent");
  });

  it("reproduces the exact score after adding an unsold product (86, still excellent)", () => {
    const result = calculateGrowthScore({
      ...baseInputs,
      currentRevenue: 87,
      currentAverageBasket: 29,
      conversionRate: 100,
      totalCustomers: 1,
      activeCustomers: 1,
      ordersCount: 3,
      distinctOrderingCustomers: 1,
      cartsTotal: 1,
      activeProductsCount: 2,
      productsWithSalesCount: 1,
      campaignsSentRecently: 1,
    });
    expect(result.score).toBe(86);
    expect(result.band).toBe("excellent");
  });

  it("never goes below 0 or above 100 even with extreme inputs", () => {
    const worst = calculateGrowthScore({
      ...baseInputs,
      currentRevenue: 0,
      previousRevenue: 1000,
      currentAverageBasket: 0,
      previousAverageBasket: 1000,
      conversionRate: 0,
      totalCustomers: 10,
      activeCustomers: 0,
      cartsAbandoned: 10,
      cartsTotal: 10,
      activeProductsCount: 10,
      productsWithSalesCount: 0,
    });
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(100);
    expect(worst.band).toBe("critique");

    const best = calculateGrowthScore({
      ...baseInputs,
      currentRevenue: 1000,
      previousRevenue: 10,
      currentAverageBasket: 1000,
      previousAverageBasket: 10,
      conversionRate: 100,
      totalCustomers: 10,
      activeCustomers: 10,
      ordersCount: 30,
      distinctOrderingCustomers: 10,
      cartsTotal: 10,
      activeProductsCount: 10,
      productsWithSalesCount: 10,
      campaignsSentRecently: 5,
    });
    expect(best.score).toBeLessThanOrEqual(100);
    expect(best.band).toBe("excellent");
  });

  it("returns 8 weighted factors that sum to a weight of 1", () => {
    const result = calculateGrowthScore(baseInputs);
    expect(result.factors).toHaveLength(8);
    const totalWeight = result.factors.reduce((sum, factor) => sum + factor.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
  });
});
