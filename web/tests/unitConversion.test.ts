import { describe, expect, it } from "vitest";
import { convertToGrams } from "../src/lib/unitConversion";

const UNIT_TABLE = {
  colher_cha: { ml: 5 },
  colher_sopa: { ml: 15 },
  xicara: { ml: 240 },
  l: { ml: 1000 },
  kg: { g: 1000 },
  oz: { g: 28.35 },
};

const DENSITY = { farinha_de_trigo: 0.5, oleo: 0.92 };

describe("convertToGrams", () => {
  it("passes grams through unchanged", () => {
    expect(convertToGrams("qualquer", 230, "g", UNIT_TABLE, DENSITY)).toBe(230);
  });

  it("converts kg to grams", () => {
    expect(convertToGrams("qualquer", 1.5, "kg", UNIT_TABLE, DENSITY)).toBe(1500);
  });

  it("converts oz to grams", () => {
    expect(convertToGrams("qualquer", 2, "oz", UNIT_TABLE, DENSITY)).toBeCloseTo(56.7);
  });

  it("converts a volume unit to grams when a density is registered", () => {
    // 2 xícaras de farinha = 480ml * 0.5 g/ml = 240g
    expect(convertToGrams("farinha_de_trigo", 2, "xicara", UNIT_TABLE, DENSITY)).toBe(240);
  });

  it("converts colher (chá) using the registered density", () => {
    // 1 colher (chá) de óleo = 5ml * 0.92 g/ml = 4.6g
    expect(
      convertToGrams("oleo", 1, "colher_cha", UNIT_TABLE, DENSITY),
    ).toBeCloseTo(4.6);
  });

  it("returns null for a volume unit with no registered density", () => {
    expect(convertToGrams("sal_grosso_sem_densidade", 1, "xicara", UNIT_TABLE, DENSITY)).toBeNull();
  });

  it("returns null for count units regardless of ingredient", () => {
    expect(convertToGrams("leite_condensado", 1, "lata", UNIT_TABLE, DENSITY)).toBeNull();
    expect(convertToGrams("alho", 3, "dente", UNIT_TABLE, DENSITY)).toBeNull();
  });

  it("returns null for an unrecognized unit", () => {
    expect(convertToGrams("qualquer", 1, "algo_desconhecido", UNIT_TABLE, DENSITY)).toBeNull();
  });
});
