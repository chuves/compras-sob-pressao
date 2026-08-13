export type Categoria = "salgado" | "doce";

export interface SourceLink {
  label: string;
  url: string;
}

export interface Recipe {
  slug: string;
  githubAnchor: string;
  title: string;
  category: Categoria;
  subtitle: string;
  ppp01pPrograma: string | null;
  pressao: string | null;
  porcoes: string | null;
  adaptacao: string[];
  preparoExtraRelatedSlugs: string[];
  ingredientesPrincipais: string[];
  ingredientesSecundarios: string[];
  preparo: string[];
  observacoes: string[];
  fonteAuditada: string | null;
  receitaOriginal: SourceLink[];
}
