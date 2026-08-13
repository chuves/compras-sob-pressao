export interface WeeklyListRecipe {
  recipeSlug: string;
  /** Scales ingredient quantities relative to the recipe's own porções. */
  multiplicador: number;
}

export interface SavedWeeklyList {
  id: string;
  label: string;
  weekStartDate: string; // ISO date (yyyy-mm-dd)
  createdAt: string; // ISO datetime
  recipes: WeeklyListRecipe[];
  /** canonicalIngredientId -> checked, for the shopping checklist. */
  checklist: Record<string, boolean>;
}
