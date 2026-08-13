import { Link, useNavigate } from "react-router-dom";
import { useHistory } from "./useHistory";
import { useCurrentSelection } from "../weeklyList/useCurrentSelection";
import { recipesBySlug } from "../../data/loadStaticData";
import { aggregateShoppingList } from "../../lib/shoppingListAggregate";

export function HistoryPage() {
  const { lists, deleteList } = useHistory();
  const { loadSelection } = useCurrentSelection();
  const navigate = useNavigate();

  const sorted = [...lists].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Listas prontas</h1>

      {sorted.length === 0 && (
        <p className="text-stone-500">Nenhuma lista salva ainda.</p>
      )}

      <ul className="space-y-3">
        {sorted.map((list) => {
          const lines = aggregateShoppingList(list.recipes);
          const checkedCount = lines.filter((l) => list.checklist[l.canonicalIngredientId]).length;
          const recipeTitles = list.recipes
            .map((r) => recipesBySlug.get(r.recipeSlug)?.title)
            .filter(Boolean)
            .join(", ");

          return (
            <li
              key={list.id}
              className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/lista/${list.id}`}
                    className="font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    {list.label}
                  </Link>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {new Date(list.weekStartDate + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                    {recipeTitles} · {checkedCount}/{lines.length} itens marcados
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      loadSelection(list.recipes);
                      navigate("/semana");
                    }}
                    className="text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    usar de novo
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteList(list.id)}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    excluir
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
