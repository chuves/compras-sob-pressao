import type { Recipe } from "../types/recipe";
import { canonicalIngredients, recipeSlugsByCanonicalId } from "../data/loadStaticData";

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** True if `recipe` doesn't warn that its PPP01P adaptation was untested on this model. */
export function isRecipeTested(recipe: Recipe): boolean {
  const text = recipe.adaptacao.join(" ");
  return !/n[ãa]o\s+testad|n[ãa]o\s+[ée]\s+um\s+teste/i.test(text);
}

/**
 * Filters recipes by a free-text query matching the title, subtitle, or any
 * ingredient name used in the recipe (accent/case-insensitive).
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = normalizeText(query);
  if (!q) return recipes;

  const matchingIngredientSlugs = new Set<string>();
  for (const ing of canonicalIngredients) {
    if (normalizeText(ing.nome).includes(q)) {
      for (const slug of recipeSlugsByCanonicalId.get(ing.id) ?? []) {
        matchingIngredientSlugs.add(slug);
      }
    }
  }

  return recipes.filter((r) => {
    if (normalizeText(r.title).includes(q)) return true;
    if (normalizeText(r.subtitle).includes(q)) return true;
    return matchingIngredientSlugs.has(r.slug);
  });
}
