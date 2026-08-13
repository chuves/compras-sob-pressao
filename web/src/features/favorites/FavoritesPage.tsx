import { Link } from "react-router-dom";
import { useFavorites } from "./useFavorites";
import { recipesBySlug } from "../../data/loadStaticData";
import { RecipeCard } from "../../components/RecipeCard";

export function FavoritesPage() {
  const { favorites } = useFavorites();
  const recipes = favorites
    .map((slug) => recipesBySlug.get(slug))
    .filter((r) => r !== undefined);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Favoritos</h1>
      {recipes.length === 0 ? (
        <p className="text-stone-500">
          Nenhuma receita favoritada ainda.{" "}
          <Link to="/" className="text-emerald-700 underline dark:text-emerald-400">
            Ver receitas
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard key={r.slug} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}
