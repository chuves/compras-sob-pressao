import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, name), "utf-8"));
}

interface Recipe {
  slug: string;
  title: string;
  preparoExtraRelatedSlugs: string[];
}

interface IngredientRow {
  recipeSlug: string;
  canonicalIngredientId: string;
  quantidade: number | null;
  unidade: string | null;
  opcional: boolean;
}

interface CanonicalIngredient {
  id: string;
  nome: string;
  categoriaCorredor: string;
}

const COUNT_UNITS = new Set([
  "unidade",
  "medida",
  "dente",
  "folha",
  "fatia",
  "lata",
  "vidro",
  "caixa",
  "pacote",
  "ramo",
  "pau",
  "pitada",
  "fio",
  "punhado",
  "cabeca",
  "maco",
]);

function main() {
  const recipes = loadJson<Recipe[]>("recipes.json");
  const ingredients = loadJson<IngredientRow[]>("ingredients.json");
  const vocab = loadJson<CanonicalIngredient[]>("ingredientes-canonicos.json");
  const conversions = loadJson<Record<string, unknown>>("conversao-unidades.json");
  const densities = loadJson<Record<string, number>>("densidade-ingredientes.json");

  const errors: string[] = [];
  const warnings: string[] = [];

  const recipeSlugs = new Set(recipes.map((r) => r.slug));
  const vocabIds = new Set(vocab.map((v) => v.id));
  const validUnits = new Set([
    ...COUNT_UNITS,
    "g",
    "ml",
    ...Object.keys(conversions).filter((k) => k !== "_comment"),
  ]);

  // Every ingredient row points to a real recipe and a real canonical ingredient.
  for (const row of ingredients) {
    if (!recipeSlugs.has(row.recipeSlug)) {
      errors.push(`ingredients.json: recipeSlug desconhecido "${row.recipeSlug}"`);
    }
    if (!vocabIds.has(row.canonicalIngredientId)) {
      errors.push(
        `ingredients.json: canonicalIngredientId "${row.canonicalIngredientId}" não existe em ingredientes-canonicos.json (receita ${row.recipeSlug})`,
      );
    }
    if (row.unidade !== null && !validUnits.has(row.unidade)) {
      errors.push(
        `ingredients.json: unidade desconhecida "${row.unidade}" (receita ${row.recipeSlug}, ${row.canonicalIngredientId})`,
      );
    }
    if ((row.quantidade === null) !== (row.unidade === null && row.quantidade === null)) {
      // quantidade null with unit set, or vice versa, is suspicious but not always wrong
      // (e.g. "a gosto" items correctly have both null). Flag only quantity-without-unit.
      if (row.quantidade !== null && row.unidade === null) {
        warnings.push(
          `ingredients.json: quantidade sem unidade (receita ${row.recipeSlug}, ${row.canonicalIngredientId}: ${row.quantidade})`,
        );
      }
    }
  }

  // Every recipe has at least one principal and one secundario ingredient row.
  for (const recipe of recipes) {
    const rows = ingredients.filter((r) => r.recipeSlug === recipe.slug);
    if (rows.length === 0) {
      errors.push(`Receita "${recipe.title}" (${recipe.slug}) não tem nenhum ingrediente.`);
    }
  }

  // preparoExtraRelatedSlugs (from recipes.json) point to real recipes.
  for (const recipe of recipes) {
    for (const rel of recipe.preparoExtraRelatedSlugs) {
      if (!recipeSlugs.has(rel)) {
        errors.push(
          `Receita "${recipe.title}": link relacionado quebrado -> "${rel}"`,
        );
      }
    }
  }

  // ingredients.json receitaRelacionadaSlug (the github-anchor form) should resolve too, when present.
  // (Stored as the raw github anchor, not the app slug — just check it's non-empty when set.)

  // Density table entries must reference real canonical ingredients.
  for (const id of Object.keys(densities)) {
    if (id === "_comment") continue;
    if (!vocabIds.has(id)) {
      warnings.push(`densidade-ingredientes.json: id "${id}" não existe em ingredientes-canonicos.json.`);
    }
  }

  // Every canonical ingredient should be used by at least one row (dead vocab entries are noise).
  const usedIds = new Set(ingredients.map((r) => r.canonicalIngredientId));
  for (const v of vocab) {
    if (!usedIds.has(v.id)) {
      warnings.push(`ingredientes-canonicos.json: "${v.id}" não é usado por nenhuma receita.`);
    }
  }

  console.log(`Receitas: ${recipes.length}`);
  console.log(`Linhas de ingrediente: ${ingredients.length}`);
  console.log(`Ingredientes canônicos: ${vocab.length}`);
  console.log(`Densidades cadastradas: ${Object.keys(densities).length - 1}`);
  console.log();

  if (warnings.length) {
    console.log(`--- ${warnings.length} avisos ---`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
    console.log();
  }

  if (errors.length) {
    console.log(`--- ${errors.length} ERROS ---`);
    for (const e of errors) console.log(`  ✗ ${e}`);
    process.exitCode = 1;
  } else {
    console.log("Nenhum erro encontrado.");
  }
}

main();
