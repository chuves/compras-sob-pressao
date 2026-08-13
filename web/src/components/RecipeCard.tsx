import { Link } from "react-router-dom";
import type { Recipe } from "../types/recipe";
import { useFavorites } from "../features/favorites/useFavorites";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(recipe.slug);

  return (
    <div className="group relative flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
      <button
        type="button"
        onClick={() => toggleFavorite(recipe.slug)}
        aria-pressed={fav}
        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="absolute right-3 top-3 text-lg leading-none"
      >
        {fav ? "★" : "☆"}
      </button>
      <Link to={`/receita/${recipe.slug}`} className="pr-6">
        <span
          className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            recipe.category === "salgado"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              : "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300"
          }`}
        >
          {recipe.category === "salgado" ? "Salgado" : "Doce"}
        </span>
        <h3 className="font-semibold leading-snug text-stone-900 group-hover:text-emerald-700 dark:text-stone-100 dark:group-hover:text-emerald-400">
          {recipe.title}
        </h3>
        {recipe.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
            {recipe.subtitle}
          </p>
        )}
        {recipe.ppp01pPrograma && (
          <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            {recipe.ppp01pPrograma}
          </p>
        )}
      </Link>
    </div>
  );
}
