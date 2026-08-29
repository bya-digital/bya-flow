import { describe, expect, it } from "vitest";
import { slugify } from "./utils";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("T-shirt BYA Flow")).toBe("t-shirt-bya-flow");
  });

  it("strips accents", () => {
    expect(slugify("Créez votre boutique à Genève")).toBe("creez-votre-boutique-a-geneve");
  });

  it("collapses repeated separators and trims leading/trailing hyphens", () => {
    expect(slugify("  Mug -- BYA Flow!!  ")).toBe("mug-bya-flow");
  });

  it("produces a stable, unique-ish slug for two different names sharing words", () => {
    expect(slugify("Mug BYA Flow")).not.toBe(slugify("Mug BYA Flow Deluxe"));
  });
});
