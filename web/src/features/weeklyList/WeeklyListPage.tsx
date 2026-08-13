import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCurrentSelection } from "./useCurrentSelection";
import { recipesBySlug } from "../../data/loadStaticData";
import { aggregateShoppingList, formatQuantities } from "../../lib/shoppingListAggregate";
import { useHistory } from "../history/useHistory";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WeeklyListPage() {
  const { selection, removeRecipe, updateMultiplicador, clear } = useCurrentSelection();
  const { saveList } = useHistory();
  const navigate = useNavigate();

  const [label, setLabel] = useState(`Semana de ${new Date().toLocaleDateString("pt-BR")}`);
  const [weekStartDate, setWeekStartDate] = useState(todayIso());

  const recipesInSelection = selection
    .map((s) => ({ ...s, recipe: recipesBySlug.get(s.recipeSlug) }))
    .filter((s) => s.recipe);

  const preview = useMemo(() => aggregateShoppingList(selection), [selection]);

  function handleSave() {
    if (selection.length === 0) return;
    const id = saveList(label.trim() || "Minha lista", weekStartDate, selection);
    clear();
    navigate(`/lista/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Prévia da lista</h1>
      <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
        Escolha as receitas da semana e veja o que vai entrar na lista de compras antes de
        salvar.
      </p>

      {recipesInSelection.length === 0 ? (
        <p className="text-stone-500">
          Nenhuma receita selecionada ainda.{" "}
          <Link to="/" className="text-emerald-700 underline dark:text-emerald-400">
            Escolher receitas
          </Link>
          .
        </p>
      ) : (
        <>
          <ul className="mb-6 space-y-2">
            {recipesInSelection.map(({ recipeSlug, multiplicador, recipe }) => (
              <li
                key={recipeSlug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
              >
                <Link to={`/receita/${recipeSlug}`} className="font-medium hover:text-emerald-700 dark:hover:text-emerald-400">
                  {recipe!.title}
                </Link>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm text-stone-500">
                    <input
                      type="number"
                      min={0.25}
                      step={0.25}
                      value={multiplicador}
                      onChange={(e) =>
                        updateMultiplicador(recipeSlug, Math.max(0.25, Number(e.target.value) || 1))
                      }
                      className="w-16 rounded border border-stone-300 px-1.5 py-0.5 dark:border-stone-700 dark:bg-stone-900"
                    />
                    ×
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRecipe(recipeSlug)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    remover
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mb-6 rounded-lg border border-stone-200 p-4 dark:border-stone-800">
            <h2 className="mb-2 font-semibold">Salvar como lista</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nome da lista"
                className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
              />
              <input
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                className="rounded border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
              />
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Salvar e ver lista de compras
              </button>
            </div>
          </div>

          <h2 className="mb-2 font-semibold">Pré-visualização da lista de compras</h2>
          <ul className="divide-y divide-stone-200 text-sm dark:divide-stone-800">
            {preview.map((line) => (
              <li key={line.canonicalIngredientId} className="flex justify-between py-2">
                <span className={line.opcional ? "text-stone-400" : ""}>{line.nome}</span>
                <span className="text-stone-500">{formatQuantities(line).join(" + ")}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
