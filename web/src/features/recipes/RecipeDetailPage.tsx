import { Link, useNavigate, useParams } from "react-router-dom";
import { getIngredientsForRecipe, recipesBySlug } from "../../data/loadStaticData";
import { useFavorites } from "../favorites/useFavorites";
import { useCurrentSelection } from "../weeklyList/useCurrentSelection";
import type { IngredientRow } from "../../types/ingredient";
import { TextWithLinks } from "../../components/TextWithLinks";

function groupBySubgroup(rows: IngredientRow[]): [string | null, IngredientRow[]][] {
  const order: (string | null)[] = [];
  const map = new Map<string | null, IngredientRow[]>();
  for (const row of rows) {
    if (!map.has(row.subgroup)) {
      map.set(row.subgroup, []);
      order.push(row.subgroup);
    }
    map.get(row.subgroup)!.push(row);
  }
  return order.map((key) => [key, map.get(key)!]);
}

function IngredientList({ rows }: { rows: IngredientRow[] }) {
  const groups = groupBySubgroup(rows);
  return (
    <div className="space-y-3">
      {groups.map(([subgroup, groupRows]) => (
        <div key={subgroup ?? "_"}>
          {subgroup && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              {subgroup}
            </p>
          )}
          <ul className="space-y-1">
            {groupRows.map((row, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <TextWithLinks text={row.textoOriginal} />
                  {row.opcional && (
                    <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500 dark:bg-stone-800">
                      opcional
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const recipe = slug ? recipesBySlug.get(slug) : undefined;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isSelected, getMultiplicador, addRecipe, removeRecipe, updateMultiplicador } =
    useCurrentSelection();
  const navigate = useNavigate();

  if (!recipe) {
    return (
      <div>
        <p>Receita não encontrada.</p>
        <Link to="/" className="text-emerald-700 underline">
          Voltar para a lista de receitas
        </Link>
      </div>
    );
  }

  const ingredients = getIngredientsForRecipe(recipe.slug);
  const principais = ingredients.filter((r) => r.grupo === "principal");
  const secundarios = ingredients.filter((r) => r.grupo === "secundario");
  const selected = isSelected(recipe.slug);
  const multiplicador = getMultiplicador(recipe.slug);

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        ← Todas as receitas
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{recipe.title}</h1>
        <button
          type="button"
          onClick={() => toggleFavorite(recipe.slug)}
          className="shrink-0 text-2xl leading-none"
          aria-label="Favoritar"
        >
          {isFavorite(recipe.slug) ? "★" : "☆"}
        </button>
      </div>

      {recipe.subtitle && (
        <p className="mt-1 text-stone-500 dark:text-stone-400">{recipe.subtitle}</p>
      )}

      <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg bg-stone-100 p-4 text-sm sm:grid-cols-3 dark:bg-stone-900">
        <div>
          <dt className="font-medium text-stone-500 dark:text-stone-400">PPP01P</dt>
          <dd>{recipe.ppp01pPrograma ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500 dark:text-stone-400">Pressão</dt>
          <dd>{recipe.pressao ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500 dark:text-stone-400">Porções</dt>
          <dd>{recipe.porcoes ?? "—"}</dd>
        </div>
      </dl>

      {recipe.adaptacao.length > 0 && (
        <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium text-amber-800 dark:text-amber-300">Adaptação PPP01P</p>
          {recipe.adaptacao.map((p, i) => (
            <p key={i} className="text-stone-700 dark:text-stone-300">
              <TextWithLinks text={p} />
            </p>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="mb-2 text-sm font-medium">Adicionar à minha semana</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            Multiplicador
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={multiplicador}
              onChange={(e) =>
                updateMultiplicador(recipe.slug, Math.max(0.25, Number(e.target.value) || 1))
              }
              className="w-20 rounded border border-stone-300 px-2 py-1 dark:border-stone-700 dark:bg-stone-900"
            />
            <span className="text-stone-500">×</span>
          </label>
          <button
            type="button"
            onClick={() => {
              if (selected) {
                removeRecipe(recipe.slug);
                return;
              }
              addRecipe(recipe.slug, multiplicador);
              navigate("/", {
                state: { flashMessage: `"${recipe.title}" adicionada à sua semana com sucesso!` },
              });
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              selected
                ? "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {selected ? "Remover da semana" : "Adicionar à semana"}
          </button>
          {selected && (
            <Link to="/semana" className="text-sm text-emerald-700 underline dark:text-emerald-400">
              ver minha semana →
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold">Ingredientes principais</h2>
          <IngredientList rows={principais} />
        </div>
        <div>
          <h2 className="mb-2 font-semibold">Ingredientes secundários</h2>
          <IngredientList rows={secundarios} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-semibold">Preparo</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {recipe.preparo.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      {recipe.observacoes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold">Observações da fonte</h2>
          <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
            {recipe.observacoes.map((p, i) => (
              <p key={i}>
                <TextWithLinks text={p} />
              </p>
            ))}
          </div>
        </div>
      )}

      {recipe.receitaOriginal.length > 0 && (
        <div className="mt-6 border-t border-stone-200 pt-4 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
          <p>{recipe.fonteAuditada}</p>
          {recipe.receitaOriginal.map((link, i) => (
            <p key={i}>
              {link.label && <span>{link.label}: </span>}
              <a href={link.url} target="_blank" rel="noreferrer" className="text-emerald-700 underline dark:text-emerald-400">
                {link.url}
              </a>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
