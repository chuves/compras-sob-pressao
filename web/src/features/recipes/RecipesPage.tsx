import { useMemo, useState } from "react";
import { recipes } from "../../data/loadStaticData";
import { RecipeCard } from "../../components/RecipeCard";
import { FlashMessage } from "../../components/FlashMessage";
import { isRecipeTested, searchRecipes } from "../../lib/search";

type CategoriaFiltro = "todos" | "salgado" | "doce";

export function RecipesPage() {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<CategoriaFiltro>("todos");
  const [somenteTestadas, setSomenteTestadas] = useState(false);

  const filtered = useMemo(() => {
    let list = searchRecipes(recipes, query);
    if (categoria !== "todos") list = list.filter((r) => r.category === categoria);
    if (somenteTestadas) list = list.filter(isRecipeTested);
    return list;
  }, [query, categoria, somenteTestadas]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Receitas</h1>

      <FlashMessage />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou ingrediente (ex: grão-de-bico, cúrcuma...)"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-stone-700 dark:bg-stone-900"
        />
        <div className="flex shrink-0 gap-2">
          {(["todos", "salgado", "doce"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                categoria === c
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {c === "todos" ? "Todos" : c === "salgado" ? "Salgados" : "Doces"}
            </button>
          ))}
        </div>
      </div>

      <label className="mb-4 flex w-fit items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
        <input
          type="checkbox"
          checked={somenteTestadas}
          onChange={(e) => setSomenteTestadas(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300"
        />
        Só receitas testadas nesse modelo (PPP01P)
      </label>

      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        {filtered.length} receita{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <RecipeCard key={r.slug} recipe={r} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-stone-500">Nenhuma receita encontrada.</p>
      )}
    </div>
  );
}
