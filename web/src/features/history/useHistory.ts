import { useCallback } from "react";
import { useLocalStorageState } from "../../lib/localStorageState";
import type { SavedWeeklyList, WeeklyListRecipe } from "../../types/shopping";

const KEY = "receitas-ppp01p:historico";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useHistory() {
  const [lists, setLists] = useLocalStorageState<SavedWeeklyList[]>(KEY, []);

  const saveList = useCallback(
    (label: string, weekStartDate: string, recipes: WeeklyListRecipe[]) => {
      const newList: SavedWeeklyList = {
        id: makeId(),
        label,
        weekStartDate,
        createdAt: new Date().toISOString(),
        recipes,
        checklist: {},
      };
      setLists((prev) => [newList, ...prev]);
      return newList.id;
    },
    [setLists],
  );

  const getList = useCallback((id: string) => lists.find((l) => l.id === id), [lists]);

  const setChecked = useCallback(
    (id: string, canonicalIngredientId: string, checked: boolean) => {
      setLists((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, checklist: { ...l.checklist, [canonicalIngredientId]: checked } }
            : l,
        ),
      );
    },
    [setLists],
  );

  const deleteList = useCallback(
    (id: string) => setLists((prev) => prev.filter((l) => l.id !== id)),
    [setLists],
  );

  return { lists, saveList, getList, setChecked, deleteList };
}
