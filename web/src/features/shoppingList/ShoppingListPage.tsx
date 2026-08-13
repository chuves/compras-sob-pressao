import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useHistory } from "../history/useHistory";
import { recipesBySlug } from "../../data/loadStaticData";
import { aggregateShoppingList, formatQuantities } from "../../lib/shoppingListAggregate";
import { AISLE_LABELS, type Aisle } from "../../types/ingredient";

const AISLE_ORDER: Aisle[] = [
  "hortifruti",
  "laticinios_e_ovos",
  "padaria",
  "proteinas_vegetais",
  "mercearia",
  "temperos_e_especiarias",
  "bebidas",
  "agua_e_gelo",
  "outros",
];

export function ShoppingListPage() {
  const { listId } = useParams<{ listId: string }>();
  const { getList, setChecked, deleteList } = useHistory();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const list = listId ? getList(listId) : undefined;

  const lines = useMemo(
    () => (list ? aggregateShoppingList(list.recipes) : []),
    [list],
  );

  const byAisle = useMemo(() => {
    const map = new Map<Aisle, typeof lines>();
    for (const line of lines) {
      const arr = map.get(line.categoriaCorredor);
      if (arr) arr.push(line);
      else map.set(line.categoriaCorredor, [line]);
    }
    return map;
  }, [lines]);

  if (!list) {
    return (
      <div>
        <p>Lista não encontrada.</p>
        <Link to="/historico" className="text-emerald-700 underline dark:text-emerald-400">
          Ver histórico
        </Link>
      </div>
    );
  }

  const recipeTitles = list.recipes
    .map((r) => recipesBySlug.get(r.recipeSlug)?.title)
    .filter(Boolean);

  async function handleCopy() {
    const text = AISLE_ORDER.filter((a) => byAisle.has(a))
      .map((aisle) => {
        const items = byAisle
          .get(aisle)!
          .map((line) => `- ${line.nome}: ${formatQuantities(line).join(" + ")}`)
          .join("\n");
        return `${AISLE_LABELS[aisle]}\n${items}`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(`${list!.label}\n\n${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — user can still select/copy the printed list manually.
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{list.label}</h1>
        <div className="flex gap-2 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200"
          >
            {copied ? "Copiado!" : "Copiar lista"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200"
          >
            Imprimir
          </button>
        </div>
      </div>
      <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
        {new Date(list.weekStartDate + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
        {recipeTitles.join(", ")}
      </p>

      {AISLE_ORDER.filter((a) => byAisle.has(a)).map((aisle) => (
        <section key={aisle} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
            {AISLE_LABELS[aisle]}
          </h2>
          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {byAisle.get(aisle)!.map((line) => {
              const checked = !!list.checklist[line.canonicalIngredientId];
              return (
                <li key={line.canonicalIngredientId} className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(list.id, line.canonicalIngredientId, e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-stone-300 print:hidden"
                  />
                  <span
                    className={`flex-1 ${checked ? "text-stone-400 line-through" : ""} ${
                      line.opcional ? "italic text-stone-500" : ""
                    }`}
                    title={line.contribuicoes
                      .map((c) => `${c.recipeTitle}: ${c.textoOriginal}`)
                      .join("\n")}
                  >
                    {line.nome}
                    {line.opcional && <span className="ml-1 text-xs">(opcional)</span>}
                  </span>
                  <span className="shrink-0 text-sm text-stone-500">
                    {formatQuantities(line).join(" + ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <button
        type="button"
        onClick={() => {
          deleteList(list.id);
          navigate("/historico");
        }}
        className="mt-4 text-sm text-red-600 hover:underline print:hidden dark:text-red-400"
      >
        Excluir esta lista
      </button>
    </div>
  );
}
