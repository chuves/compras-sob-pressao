import {
  canonicalById,
  ingredientDensity,
  ingredientRowsByRecipeSlug,
  recipesBySlug,
  unitConversion,
} from "../data/loadStaticData";
import type { Aisle, CanonicalIngredient, IngredientRow, UnitConversion } from "../types/ingredient";
import type { WeeklyListRecipe } from "../types/shopping";
import { convertToGrams } from "./unitConversion";

/** Units you can't buy a fraction of — summed quantities round UP for shopping. */
const DISCRETE_UNITS = new Set([
  "unidade",
  "dente",
  "folha",
  "fatia",
  "lata",
  "vidro",
  "caixa",
  "pacote",
  "ramo",
  "pau",
  "cabeca",
  "maco",
  "medida",
]);

export interface Contribution {
  recipeSlug: string;
  recipeTitle: string;
  textoOriginal: string;
  quantidadeEscalada: number | null;
  unidade: string | null;
  multiplicador: number;
}

export interface AggregatedLine {
  canonicalIngredientId: string;
  nome: string;
  categoriaCorredor: Aisle;
  /** true only when every contributing row is optional/to-taste. */
  opcional: boolean;
  /** Raw (unrounded) gram total, when at least part of the quantity converts to grams. */
  gramas: number | null;
  /** Raw (unrounded) totals for whatever didn't convert to grams, keyed by unit. */
  porUnidade: Record<string, number>;
  /** True when at least one contributing row has no quantity at all ("a gosto"). */
  temItemSemQuantidade: boolean;
  contribuicoes: Contribution[];
}

export interface AggregateDeps {
  recipesBySlug: ReadonlyMap<string, { title: string }>;
  ingredientRowsByRecipeSlug: ReadonlyMap<string, IngredientRow[]>;
  canonicalById: ReadonlyMap<string, CanonicalIngredient>;
  unitConversion: Record<string, UnitConversion>;
  ingredientDensity: Record<string, number>;
}

const REAL_DEPS: AggregateDeps = {
  recipesBySlug,
  ingredientRowsByRecipeSlug,
  canonicalById,
  unitConversion,
  ingredientDensity,
};

/**
 * Sums ingredient quantities across a set of selected recipes (each scaled
 * by its own servings multiplier), grouped by canonical ingredient. Grams
 * and non-gram-convertible units are kept in SEPARATE buckets on purpose —
 * never silently merged into a misleading single number.
 *
 * Accepts an optional `deps` override so tests can exercise this with small
 * fixture datasets instead of the full 733-row cookbook.
 */
export function aggregateShoppingList(
  selections: WeeklyListRecipe[],
  deps: AggregateDeps = REAL_DEPS,
): AggregatedLine[] {
  const lines = new Map<string, AggregatedLine>();

  for (const { recipeSlug, multiplicador } of selections) {
    const recipe = deps.recipesBySlug.get(recipeSlug);
    const rows = deps.ingredientRowsByRecipeSlug.get(recipeSlug) ?? [];

    for (const row of rows) {
      const canonical = deps.canonicalById.get(row.canonicalIngredientId);
      if (!canonical) continue; // defensive: data validated at build time, shouldn't happen

      let line = lines.get(row.canonicalIngredientId);
      if (!line) {
        line = {
          canonicalIngredientId: row.canonicalIngredientId,
          nome: canonical.nome,
          categoriaCorredor: canonical.categoriaCorredor,
          opcional: true,
          gramas: null,
          porUnidade: {},
          temItemSemQuantidade: false,
          contribuicoes: [],
        };
        lines.set(row.canonicalIngredientId, line);
      }

      if (!row.opcional) line.opcional = false;

      const quantidadeEscalada =
        row.quantidade === null ? null : row.quantidade * multiplicador;

      if (quantidadeEscalada === null || row.unidade === null) {
        line.temItemSemQuantidade = true;
      } else {
        const grams = convertToGrams(
          row.canonicalIngredientId,
          quantidadeEscalada,
          row.unidade,
          deps.unitConversion,
          deps.ingredientDensity,
        );
        if (grams !== null) {
          line.gramas = (line.gramas ?? 0) + grams;
        } else {
          line.porUnidade[row.unidade] =
            (line.porUnidade[row.unidade] ?? 0) + quantidadeEscalada;
        }
      }

      line.contribuicoes.push({
        recipeSlug,
        recipeTitle: recipe?.title ?? recipeSlug,
        textoOriginal: row.textoOriginal,
        quantidadeEscalada,
        unidade: row.unidade,
        multiplicador,
      });
    }
  }

  return [...lines.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Human-readable quantity strings for one aggregated line, e.g. ["≈450 g", "3 latas"]. */
export function formatQuantities(line: AggregatedLine): string[] {
  const parts: string[] = [];

  if (line.gramas !== null) {
    parts.push(
      line.gramas >= 1000
        ? `≈${(roundGrams(line.gramas) / 1000).toFixed(2)} kg`
        : `≈${roundGrams(line.gramas)} g`,
    );
  }

  for (const [unidade, quantidade] of Object.entries(line.porUnidade)) {
    const display = DISCRETE_UNITS.has(unidade)
      ? Math.ceil(quantidade - 1e-9)
      : Math.round(quantidade * 100) / 100;
    parts.push(`${formatNumber(display)} ${unitLabel(unidade, display)}`);
  }

  if (parts.length === 0) {
    parts.push(line.temItemSemQuantidade ? "a gosto" : "—");
  } else if (line.temItemSemQuantidade) {
    parts.push("+ a gosto");
  }

  return parts;
}

/**
 * Rounds a gram amount for display with precision that scales with
 * magnitude (whole grams for small spice amounts, nearest 5g/10g for
 * bulkier ingredients) — and never rounds a genuinely nonzero amount down
 * to a misleading "0 g".
 */
function roundGrams(grams: number): number {
  const step = grams < 50 ? 1 : grams < 500 ? 5 : 10;
  const rounded = Math.round(grams / step) * step;
  return rounded === 0 && grams > 0 ? Math.max(1, Math.round(grams)) : rounded;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

const UNIT_LABELS: Record<string, [string, string]> = {
  xicara: ["xícara", "xícaras"],
  colher_sopa: ["colher (sopa)", "colheres (sopa)"],
  colher_cha: ["colher (chá)", "colheres (chá)"],
  ml: ["ml", "ml"],
  l: ["litro", "litros"],
  unidade: ["unidade", "unidades"],
  medida: ["medida", "medidas"],
  dente: ["dente", "dentes"],
  folha: ["folha", "folhas"],
  fatia: ["fatia", "fatias"],
  lata: ["lata", "latas"],
  vidro: ["vidro", "vidros"],
  caixa: ["caixa", "caixas"],
  pacote: ["pacote", "pacotes"],
  ramo: ["ramo", "ramos"],
  pau: ["pau", "paus"],
  pitada: ["pitada", "pitadas"],
  fio: ["fio", "fios"],
  punhado: ["punhado", "punhados"],
  cabeca: ["cabeça", "cabeças"],
  maco: ["maço", "maços"],
};

function unitLabel(unidade: string, quantidade: number): string {
  const pair = UNIT_LABELS[unidade];
  if (!pair) return unidade;
  return quantidade === 1 ? pair[0] : pair[1];
}
