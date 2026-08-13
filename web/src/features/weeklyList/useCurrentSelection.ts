import { useCallback } from "react";
import { useLocalStorageState } from "../../lib/localStorageState";
import type { WeeklyListRecipe } from "../../types/shopping";

const KEY = "receitas-ppp01p:semana-atual";

export function useCurrentSelection() {
  const [selection, setSelection] = useLocalStorageState<WeeklyListRecipe[]>(KEY, []);

  const isSelected = useCallback(
    (slug: string) => selection.some((s) => s.recipeSlug === slug),
    [selection],
  );

  const getMultiplicador = useCallback(
    (slug: string) => selection.find((s) => s.recipeSlug === slug)?.multiplicador ?? 1,
    [selection],
  );

  const addRecipe = useCallback(
    (recipeSlug: string, multiplicador = 1) => {
      setSelection((prev) =>
        prev.some((s) => s.recipeSlug === recipeSlug)
          ? prev
          : [...prev, { recipeSlug, multiplicador }],
      );
    },
    [setSelection],
  );

  const removeRecipe = useCallback(
    (recipeSlug: string) => {
      setSelection((prev) => prev.filter((s) => s.recipeSlug !== recipeSlug));
    },
    [setSelection],
  );

  const updateMultiplicador = useCallback(
    (recipeSlug: string, multiplicador: number) => {
      setSelection((prev) =>
        prev.map((s) => (s.recipeSlug === recipeSlug ? { ...s, multiplicador } : s)),
      );
    },
    [setSelection],
  );

  const toggleRecipe = useCallback(
    (recipeSlug: string) => {
      setSelection((prev) =>
        prev.some((s) => s.recipeSlug === recipeSlug)
          ? prev.filter((s) => s.recipeSlug !== recipeSlug)
          : [...prev, { recipeSlug, multiplicador: 1 }],
      );
    },
    [setSelection],
  );

  const clear = useCallback(() => setSelection([]), [setSelection]);

  const loadSelection = useCallback(
    (recipes: WeeklyListRecipe[]) => setSelection(recipes),
    [setSelection],
  );

  return {
    selection,
    isSelected,
    getMultiplicador,
    addRecipe,
    removeRecipe,
    updateMultiplicador,
    toggleRecipe,
    clear,
    loadSelection,
  };
}
