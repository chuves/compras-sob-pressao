export type Grupo = "principal" | "secundario";

export type Aisle =
  | "hortifruti"
  | "laticinios_e_ovos"
  | "mercearia"
  | "temperos_e_especiarias"
  | "padaria"
  | "bebidas"
  | "proteinas_vegetais"
  | "agua_e_gelo"
  | "outros";

export const AISLE_LABELS: Record<Aisle, string> = {
  hortifruti: "Hortifrúti",
  laticinios_e_ovos: "Laticínios e ovos",
  mercearia: "Mercearia",
  temperos_e_especiarias: "Temperos e especiarias",
  padaria: "Padaria",
  bebidas: "Bebidas",
  proteinas_vegetais: "Grãos e proteínas vegetais",
  agua_e_gelo: "Água",
  outros: "Outros",
};

export interface IngredientRow {
  recipeSlug: string;
  grupo: Grupo;
  subgroup: string | null;
  canonicalIngredientId: string;
  textoOriginal: string;
  quantidade: number | null;
  unidade: string | null;
  opcional: boolean;
  notaAlternativa: string | null;
  receitaRelacionadaSlug: string | null;
}

export interface CanonicalIngredient {
  id: string;
  nome: string;
  categoriaCorredor: Aisle;
}

export interface UnitConversion {
  ml?: number;
  g?: number;
}
