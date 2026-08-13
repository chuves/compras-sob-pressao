import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { classifyAisle } from "./lib/aisle-classifier.ts";
import {
  CANONICAL_MERGES,
  EXCLUDE_ROWS,
  ROW_FIXES,
  DISPLAY_NAME_OVERRIDES,
} from "./lib/ingredient-corrections.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFT_PATH = path.resolve(__dirname, "../data/ingredients.draft.json");
const INGREDIENTS_OUT = path.resolve(__dirname, "../data/ingredients.json");
const VOCAB_OUT = path.resolve(__dirname, "../data/ingredientes-canonicos.json");

interface DraftRow {
  recipeSlug: string;
  recipeTitle: string;
  grupo: "principal" | "secundario";
  subgroup: string | null;
  rawBullet: string;
  itemText: string;
  quantity: number | null;
  unit: string | null;
  nameGuess: string;
  vocabGuess: string;
  canonicalIdGuess: string;
  alternativesNote: string | null;
  linkedRecipeAnchor: string | null;
  needsReview: boolean;
}

interface FinalRow {
  recipeSlug: string;
  grupo: "principal" | "secundario";
  subgroup: string | null;
  canonicalIngredientId: string;
  textoOriginal: string;
  quantidade: number | null;
  unidade: string | null;
  opcional: boolean;
  notaAlternativa: string | null;
  receitaRelacionadaSlug: string | null;
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isOptional(row: DraftRow): boolean {
  if (row.quantity === null) return true;
  if (/\bopcional/i.test(row.rawBullet)) return true;
  if (row.alternativesNote && /\bágua\b|\bagua\b/i.test(row.alternativesNote))
    return true;
  return false;
}

function main() {
  const draftRows: DraftRow[] = JSON.parse(readFileSync(DRAFT_PATH, "utf-8"));
  const excludeSet = new Set(
    EXCLUDE_ROWS.map((e) => `${e.recipeSlug}::${e.itemText}`),
  );

  const finalRows: FinalRow[] = [];
  for (const row of draftRows) {
    if (excludeSet.has(`${row.recipeSlug}::${row.itemText}`)) continue;

    const fix = ROW_FIXES.find(
      (f) =>
        f.recipeSlug === row.recipeSlug &&
        row.itemText.includes(f.itemTextMatch),
    );

    let canonicalId = fix?.canonicalId ?? row.canonicalIdGuess;
    canonicalId = CANONICAL_MERGES[canonicalId] ?? canonicalId;

    if (!canonicalId) {
      console.warn(
        `[aviso] linha sem canonicalId — recipe="${row.recipeTitle}" item="${row.itemText}"`,
      );
      continue;
    }

    finalRows.push({
      recipeSlug: row.recipeSlug,
      grupo: row.grupo,
      subgroup: row.subgroup,
      canonicalIngredientId: canonicalId,
      textoOriginal: row.itemText,
      quantidade: fix?.quantity !== undefined ? fix.quantity : row.quantity,
      unidade: fix?.unit !== undefined ? fix.unit : row.unit,
      opcional: isOptional(row),
      notaAlternativa: row.alternativesNote,
      receitaRelacionadaSlug: row.linkedRecipeAnchor,
    });
  }

  // Build the canonical vocabulary from whatever ids survived, using the
  // most common vocabGuess text per id as the fallback display name.
  const nameFrequency = new Map<string, Map<string, number>>();
  for (const row of draftRows) {
    let canonicalId = row.canonicalIdGuess;
    const fix = ROW_FIXES.find(
      (f) =>
        f.recipeSlug === row.recipeSlug &&
        row.itemText.includes(f.itemTextMatch),
    );
    if (fix?.canonicalId) canonicalId = fix.canonicalId;
    canonicalId = CANONICAL_MERGES[canonicalId] ?? canonicalId;
    if (!canonicalId) continue;
    if (!nameFrequency.has(canonicalId)) nameFrequency.set(canonicalId, new Map());
    const freq = nameFrequency.get(canonicalId)!;
    const name = row.vocabGuess || row.nameGuess;
    freq.set(name, (freq.get(name) ?? 0) + 1);
  }

  const usedIds = new Set(finalRows.map((r) => r.canonicalIngredientId));
  const vocab = [...usedIds].map((id) => {
    let displayName = DISPLAY_NAME_OVERRIDES[id];
    if (!displayName) {
      const freq = nameFrequency.get(id);
      const best = freq
        ? [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
        : id.replace(/_/g, " ");
      displayName = titleCase(best || id.replace(/_/g, " "));
    }
    return {
      id,
      nome: displayName,
      categoriaCorredor: classifyAisle(displayName),
    };
  });
  vocab.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  writeFileSync(INGREDIENTS_OUT, JSON.stringify(finalRows, null, 2) + "\n", "utf-8");
  writeFileSync(VOCAB_OUT, JSON.stringify(vocab, null, 2) + "\n", "utf-8");

  console.log(`ingredients.json: ${finalRows.length} linhas`);
  console.log(`ingredientes-canonicos.json: ${vocab.length} ingredientes distintos`);

  const outrosCount = vocab.filter((v) => v.categoriaCorredor === "outros").length;
  console.log(`categoria "outros" (não classificados): ${outrosCount}`);
}

main();
