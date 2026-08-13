import type { UnitConversion } from "../types/ingredient";

/**
 * Converts a quantity to grams when a reliable conversion exists:
 * - "g"/"kg"/"oz" convert directly (mass units, no density needed).
 * - Volume units (ml, l, xícara, colher...) convert via `unitConversionTable`
 *   to ml, then need a per-ingredient density (g/ml) from `densityTable` to
 *   become grams — without a registered density, returns null on purpose
 *   rather than guessing.
 * - Count units (unidade, lata, dente, ...) always return null: a "lata" has
 *   no universal gram weight.
 */
export function convertToGrams(
  canonicalIngredientId: string,
  quantidade: number,
  unidade: string,
  unitConversionTable: Record<string, UnitConversion>,
  densityTable: Record<string, number>,
): number | null {
  if (unidade === "g") return quantidade;
  if (unidade === "kg") return quantidade * 1000;
  if (unidade === "oz") return quantidade * 28.35;

  const toMl = unitConversionTable[unidade]?.ml;
  if (toMl !== undefined) {
    const density = densityTable[canonicalIngredientId];
    if (density !== undefined) return quantidade * toMl * density;
  }
  return null;
}
