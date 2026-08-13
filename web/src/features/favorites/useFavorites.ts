import { useCallback } from "react";
import { useLocalStorageState } from "../../lib/localStorageState";

const KEY = "receitas-ppp01p:favoritos";

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorageState<string[]>(KEY, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (slug: string) => {
      setFavorites((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
      );
    },
    [setFavorites],
  );

  return { favorites, isFavorite, toggleFavorite };
}
