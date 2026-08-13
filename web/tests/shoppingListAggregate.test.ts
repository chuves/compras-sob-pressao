import { describe, expect, it } from "vitest";
import {
  aggregateShoppingList,
  formatQuantities,
  type AggregateDeps,
} from "../src/lib/shoppingListAggregate";
import type { IngredientRow, CanonicalIngredient } from "../src/types/ingredient";

function row(partial: Partial<IngredientRow> & Pick<IngredientRow, "recipeSlug" | "canonicalIngredientId">): IngredientRow {
  return {
    grupo: "principal",
    subgroup: null,
    textoOriginal: "",
    quantidade: null,
    unidade: null,
    opcional: false,
    notaAlternativa: null,
    receitaRelacionadaSlug: null,
    ...partial,
  };
}

const CANONICAL: CanonicalIngredient[] = [
  { id: "farinha_de_trigo", nome: "Farinha de trigo", categoriaCorredor: "mercearia" },
  { id: "leite_condensado", nome: "Leite condensado", categoriaCorredor: "mercearia" },
  { id: "sal", nome: "Sal", categoriaCorredor: "temperos_e_especiarias" },
];

const INGREDIENT_ROWS: IngredientRow[] = [
  row({
    recipeSlug: "receita-a",
    canonicalIngredientId: "farinha_de_trigo",
    quantidade: 2,
    unidade: "xicara",
    textoOriginal: "2 xícaras de farinha de trigo",
  }),
  row({
    recipeSlug: "receita-a",
    canonicalIngredientId: "leite_condensado",
    grupo: "secundario",
    quantidade: 1,
    unidade: "lata",
    textoOriginal: "1 lata de leite condensado",
  }),
  row({
    recipeSlug: "receita-a",
    canonicalIngredientId: "sal",
    grupo: "secundario",
    quantidade: null,
    unidade: null,
    opcional: true,
    textoOriginal: "sal a gosto",
  }),
  row({
    recipeSlug: "receita-b",
    canonicalIngredientId: "farinha_de_trigo",
    quantidade: 240,
    unidade: "g",
    textoOriginal: "240 g de farinha de trigo",
  }),
  row({
    recipeSlug: "receita-b",
    canonicalIngredientId: "leite_condensado",
    grupo: "secundario",
    quantidade: 1,
    unidade: "lata",
    textoOriginal: "1 lata de leite condensado",
  }),
];

const DEPS: AggregateDeps = {
  recipesBySlug: new Map([
    ["receita-a", { title: "Receita A" }],
    ["receita-b", { title: "Receita B" }],
  ]),
  ingredientRowsByRecipeSlug: new Map([
    ["receita-a", INGREDIENT_ROWS.filter((r) => r.recipeSlug === "receita-a")],
    ["receita-b", INGREDIENT_ROWS.filter((r) => r.recipeSlug === "receita-b")],
  ]),
  canonicalById: new Map(CANONICAL.map((c) => [c.id, c])),
  unitConversion: { xicara: { ml: 240 }, colher_cha: { ml: 5 }, colher_sopa: { ml: 15 } },
  ingredientDensity: { farinha_de_trigo: 0.5 },
};

describe("aggregateShoppingList", () => {
  it("soma quantidades em gramas de duas receitas (uma via densidade, outra em gramas direto)", () => {
    const result = aggregateShoppingList(
      [
        { recipeSlug: "receita-a", multiplicador: 1 },
        { recipeSlug: "receita-b", multiplicador: 1 },
      ],
      DEPS,
    );
    const farinha = result.find((l) => l.canonicalIngredientId === "farinha_de_trigo")!;
    // receita-a: 2 xícaras * 240ml * 0.5 g/ml = 240g; receita-b: 240g direto -> 480g
    expect(farinha.gramas).toBe(480);
    expect(farinha.porUnidade).toEqual({});
  });

  it("mantém gramas e unidades contadas em buckets separados, nunca misturados", () => {
    const result = aggregateShoppingList(
      [
        { recipeSlug: "receita-a", multiplicador: 1 },
        { recipeSlug: "receita-b", multiplicador: 1 },
      ],
      DEPS,
    );
    const leite = result.find((l) => l.canonicalIngredientId === "leite_condensado")!;
    expect(leite.gramas).toBeNull();
    expect(leite.porUnidade.lata).toBe(2);
  });

  it("escala quantidades pelo multiplicador de porções (fracionário)", () => {
    const result = aggregateShoppingList(
      [{ recipeSlug: "receita-a", multiplicador: 0.5 }],
      DEPS,
    );
    const farinha = result.find((l) => l.canonicalIngredientId === "farinha_de_trigo")!;
    // 2 xícaras * 0.5 multiplicador = 1 xícara -> 240ml * 0.5 g/ml = 120g
    expect(farinha.gramas).toBe(120);
  });

  it("arredonda itens contados fracionários para cima na exibição", () => {
    const result = aggregateShoppingList(
      [
        { recipeSlug: "receita-a", multiplicador: 1 },
        { recipeSlug: "receita-b", multiplicador: 0.5 },
      ],
      DEPS,
    );
    const leite = result.find((l) => l.canonicalIngredientId === "leite_condensado")!;
    expect(leite.porUnidade.lata).toBe(1.5);
    expect(formatQuantities(leite)).toEqual(["2 latas"]);
  });

  it("marca opcional só quando TODAS as contribuições são opcionais", () => {
    const result = aggregateShoppingList(
      [{ recipeSlug: "receita-a", multiplicador: 1 }],
      DEPS,
    );
    const sal = result.find((l) => l.canonicalIngredientId === "sal")!;
    expect(sal.opcional).toBe(true);
    expect(sal.temItemSemQuantidade).toBe(true);
    expect(formatQuantities(sal)).toEqual(["a gosto"]);

    const farinha = result.find((l) => l.canonicalIngredientId === "farinha_de_trigo")!;
    expect(farinha.opcional).toBe(false);
  });

  it("formata gramas com arredondamento de exibição em ≈g / ≈kg", () => {
    const result = aggregateShoppingList(
      [
        { recipeSlug: "receita-a", multiplicador: 1 },
        { recipeSlug: "receita-b", multiplicador: 1 },
      ],
      DEPS,
    );
    const farinha = result.find((l) => l.canonicalIngredientId === "farinha_de_trigo")!;
    expect(formatQuantities(farinha)).toEqual(["≈480 g"]);
  });

  it("registra as contribuições de cada receita para exibir a origem do total", () => {
    const result = aggregateShoppingList(
      [
        { recipeSlug: "receita-a", multiplicador: 2 },
        { recipeSlug: "receita-b", multiplicador: 1 },
      ],
      DEPS,
    );
    const farinha = result.find((l) => l.canonicalIngredientId === "farinha_de_trigo")!;
    expect(farinha.contribuicoes).toHaveLength(2);
    expect(farinha.contribuicoes[0]).toMatchObject({
      recipeSlug: "receita-a",
      recipeTitle: "Receita A",
      quantidadeEscalada: 4,
      multiplicador: 2,
    });
  });
});
