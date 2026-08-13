import recipesJson from "../../data/recipes.json";
import ingredientsJson from "../../data/ingredients.json";
import canonicalJson from "../../data/ingredientes-canonicos.json";
import unitConversionJson from "../../data/conversao-unidades.json";
import densityJson from "../../data/densidade-ingredientes.json";
import type { Recipe } from "../types/recipe";
import type {
  CanonicalIngredient,
  IngredientRow,
  UnitConversion,
} from "../types/ingredient";

export const recipes = recipesJson as Recipe[];
export const ingredientRows = ingredientsJson as IngredientRow[];
export const canonicalIngredients = canonicalJson as CanonicalIngredient[];

const { _comment: _unitComment, ...unitConversionRest } = unitConversionJson as Record<
  string,
  unknown
>;
export const unitConversion = unitConversionRest as Record<string, UnitConversion>;

const { _comment: _densityComment, ...densityRest } = densityJson as Record<
  string,
  unknown
>;
export const ingredientDensity = densityRest as Record<string, number>;

export const recipesBySlug: ReadonlyMap<string, Recipe> = new Map(
  recipes.map((r) => [r.slug, r]),
);

export const recipesByGithubAnchor: ReadonlyMap<string, Recipe> = new Map(
  recipes.map((r) => [r.githubAnchor, r]),
);

export const canonicalById: ReadonlyMap<string, CanonicalIngredient> = new Map(
  canonicalIngredients.map((c) => [c.id, c]),
);

export const ingredientRowsByRecipeSlug: ReadonlyMap<string, IngredientRow[]> = (() => {
  const map = new Map<string, IngredientRow[]>();
  for (const row of ingredientRows) {
    const list = map.get(row.recipeSlug);
    if (list) list.push(row);
    else map.set(row.recipeSlug, [row]);
  }
  return map;
})();

/** Recipe slugs that use a given canonical ingredient — powers "search by ingredient". */
export const recipeSlugsByCanonicalId: ReadonlyMap<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const row of ingredientRows) {
    let set = map.get(row.canonicalIngredientId);
    if (!set) {
      set = new Set();
      map.set(row.canonicalIngredientId, set);
    }
    set.add(row.recipeSlug);
  }
  return map;
})();

export function getIngredientsForRecipe(slug: string): IngredientRow[] {
  return ingredientRowsByRecipeSlug.get(slug) ?? [];
}
