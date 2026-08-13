import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  parseItem,
  splitBulletIntoItems,
  splitOrAlternatives,
} from "./lib/quantity.ts";
import {
  normalizeForVocabulary,
  slugifyId,
  stripMarkdownLinks,
} from "./lib/normalize.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_PATH = path.resolve(__dirname, "../data/recipes.json");
const DRAFT_OUT_PATH = path.resolve(__dirname, "../data/ingredients.draft.json");
const VOCAB_CANDIDATES_OUT_PATH = path.resolve(
  __dirname,
  "../data/vocab-candidates.json",
);

interface Recipe {
  slug: string;
  title: string;
  ingredientesPrincipais: string[];
  ingredientesSecundarios: string[];
}

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

function processBullets(
  bullets: string[],
  grupo: "principal" | "secundario",
  recipe: Recipe,
): DraftRow[] {
  const rows: DraftRow[] = [];
  for (const bullet of bullets) {
    const { subgroup, items } = splitBulletIntoItems(bullet);
    for (const rawItem of items) {
      if (/^opcionais?$/i.test(rawItem.trim())) continue;
      const { primary, alternativesNote } = splitOrAlternatives(rawItem);
      const linkMatch = primary.match(/\[[^\]]+\]\(#([^)]+)\)/);
      const linkedRecipeAnchor = linkMatch ? linkMatch[1] : null;
      const parsed = parseItem(stripMarkdownLinks(primary));
      const vocabGuess = normalizeForVocabulary(parsed.nameGuess);
      const needsReview =
        vocabGuess.length === 0 ||
        /\d/.test(vocabGuess) ||
        parsed.nameGuess.length > 60 ||
        /\bgosto\b/i.test(bullet) === false && parsed.quantity === null;

      rows.push({
        recipeSlug: recipe.slug,
        recipeTitle: recipe.title,
        grupo,
        subgroup,
        rawBullet: bullet,
        itemText: rawItem,
        quantity: parsed.quantity,
        unit: parsed.unit,
        nameGuess: parsed.nameGuess,
        vocabGuess,
        canonicalIdGuess: slugifyId(vocabGuess || parsed.nameGuess),
        alternativesNote,
        linkedRecipeAnchor,
        needsReview,
      });
    }
  }
  return rows;
}

function main() {
  const recipes: Recipe[] = JSON.parse(readFileSync(RECIPES_PATH, "utf-8"));

  const allRows: DraftRow[] = [];
  for (const recipe of recipes) {
    allRows.push(
      ...processBullets(recipe.ingredientesPrincipais, "principal", recipe),
    );
    allRows.push(
      ...processBullets(recipe.ingredientesSecundarios, "secundario", recipe),
    );
  }

  writeFileSync(DRAFT_OUT_PATH, JSON.stringify(allRows, null, 2) + "\n", "utf-8");

  const vocabMap = new Map<
    string,
    { canonicalIdGuess: string; count: number; examples: Set<string> }
  >();
  for (const row of allRows) {
    const key = row.canonicalIdGuess;
    if (!vocabMap.has(key)) {
      vocabMap.set(key, {
        canonicalIdGuess: key,
        count: 0,
        examples: new Set(),
      });
    }
    const entry = vocabMap.get(key)!;
    entry.count += 1;
    entry.examples.add(row.vocabGuess || row.nameGuess);
  }

  const vocabCandidates = [...vocabMap.values()]
    .map((v) => ({
      canonicalIdGuess: v.canonicalIdGuess,
      count: v.count,
      examples: [...v.examples].slice(0, 5),
    }))
    .sort((a, b) => b.count - a.count);

  writeFileSync(
    VOCAB_CANDIDATES_OUT_PATH,
    JSON.stringify(vocabCandidates, null, 2) + "\n",
    "utf-8",
  );

  const needingReview = allRows.filter((r) => r.needsReview).length;
  console.log(`Total de itens: ${allRows.length}`);
  console.log(`Candidatos de vocabulário distintos: ${vocabCandidates.length}`);
  console.log(`Itens sinalizados para revisão: ${needingReview}`);
}

main();
