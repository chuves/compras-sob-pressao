/**
 * Hand-curated corrections layered on top of the auto-drafted ingredient
 * rows (scripts/draft-ingredients.ts). This is the "human review" step the
 * project plan calls for — the draft parser gets freeform Portuguese
 * quantities/units close, but not perfect, and merging near-duplicate
 * canonical ingredients (e.g. "tomates"/"tomates Roma"/"tomate") requires
 * judgment a regex shouldn't be trusted to make silently.
 */

/** canonicalIdGuess -> corrected canonical id. Applied before grouping. */
export const CANONICAL_MERGES: Record<string, string> = {
  // Salt variants -> one product you'd actually buy.
  sal_kosher: "sal",
  sal_fino: "sal",
  "sal_kosher_ou_sal_fino_equivalente": "sal",
  sal_se_demolhado: "sal",

  // Caldo de legumes caseiro variants (our own base recipe) all point to the same purchase decision.
  caldo_de_legumes_caseiro_sem_sal: "caldo_de_legumes_caseiro",
  caldo_de_legumes_caseiro_vegano: "caldo_de_legumes_caseiro",
  caldo_de_legumes_caseiro_ou_agua: "caldo_de_legumes_caseiro",
  caldo_de_legumes_caseiro_500_ml_de_agua: "caldo_de_legumes_caseiro",
  caldo_de_legumes_caseiro_ou_agua_para_grao_seco: "caldo_de_legumes_caseiro",
  agua_ou_caldo_de_legumes_caseiro: "caldo_de_legumes_caseiro",
  agua_caldo_ou_2_colheres_de_oleo_para_refogar: "caldo_de_legumes_caseiro",
  agua_caldo_para_a_opcao_mais_estavel_sob_pressao: "caldo_de_legumes_caseiro",
  "agua_caldo_de_legumes_caseiro_ou_caldo_de_cogumelos": "caldo_de_legumes_caseiro",
  brandy_whisky_vinho_tinto_ou_caldo_de_legumes_caseiro: "caldo_de_legumes_caseiro",
  oleo_ou_2_colheres_de_caldo_de_legumes_caseiro: "caldo_de_legumes_caseiro",

  // Black pepper (ground) — "pimenta" alone in these recipes always means black pepper.
  pimenta: "pimenta_do_reino",
  "pimenta-do-reino": "pimenta_do_reino",
  "pimenta-preta": "pimenta_do_reino",
  "pimenta-do-reino_em_grao": "pimenta_do_reino",
  "boa_pitada_de_pimenta-do-reino": "pimenta_do_reino",

  // Cumin seeds.
  sementes_de_cominho: "cominho",

  // Onion varieties -> same shopping item.
  cebola_amarela: "cebola",
  cebola_branca: "cebola",
  cebolas: "cebola",

  // Butter/margarine — treated as interchangeable for shopping purposes.
  manteiga_sem_sal: "manteiga",
  manteiga_ou_margarina: "manteiga",
  margarina_ou_manteiga: "manteiga",
  manteiga_margarina: "manteiga",

  // Milk.
  leite_integral: "leite",
  "leite_2_ou_integral_equivalente": "leite",

  // Lemon/lime — juice & zest come from the fruit itself in this cookbook's usage.
  suco_de_limao: "limao",
  suco_de_limao_fresco: "limao",
  raspas_de_limao: "limao",
  limao_lima: "limao",

  // Chili powder.
  chili: "chili_em_po",
  chili_blend: "chili_em_po",

  // Dried herbs bought as one product regardless of "seco" qualifier redundancy.
  tomilho_seco: "tomilho",
  oregano_seco: "oregano",

  // Tomatoes (fresh) — variety names collapse to one shopping item.
  tomates: "tomate",
  tomates_roma: "tomate",
  tomates_roma_campo: "tomate",
  tomates_italianos: "tomate",
  tomate_com_o_liquido: "tomate",

  // Soy sauce family.
  molho_de_soja_regular: "molho_de_soja",
  molho_de_soja_tamari: "molho_de_soja",
  tamari_ou_molho_de_soja: "molho_de_soja",

  // Olive oil.
  azeite_de_oliva: "azeite",
  azeite_extravirgem: "azeite",
  azeite_ou_oleo: "azeite",

  // Coriander (fresh) mentions with trailing qualifiers.
  coentro_fresco: "coentro",

  // Ginger, regardless of the cm/inch piece-size given.
  cm_de_gengibre: "gengibre",
  polegada_de_gengibre: "gengibre",
  "pedaco_de_gengibre_de": "gengibre",

  // Sugar.
  acucar_branco: "acucar",
  adocante_acucar: "acucar",

  // Cocoa/chocolate powder family used interchangeably per source recipes.
  cacau_em_po: "chocolate_em_po",
  cacau: "chocolate_em_po",

  // Vanilla.
  extrato_de_baunilha: "baunilha",

  // Water — every variant/qualifier collapses to one "água" entry, which the
  // shopping list treats as free/tap water and excludes from totals.
  agua_fria: "agua",
  agua_quente: "agua",
  agua_filtrada: "agua",
  agua_fervente: "agua",
  agua_fria_na_cuba: "agua",
  agua_fria_para_a_cuba: "agua",
  agua_adicional: "agua",
  agua_conforme_necessario: "agua",
  agua_salgada_para_hidratar: "agua",
  agua_100_ml_de_agua: "agua",
  agua_para_o_arroz: "agua",
  de_agua: "agua",
  "ou_1_4_xicara_de_agua": "agua",

  // Plural/variety produce names -> singular canonical.
  beterrabas: "beterraba",
  chalotas: "chalota",
  bananas: "banana",
  bananas_maduras: "banana",
  cenouras_em_pedacos: "cenoura",
  "cebolas_com_casca_externa_reservada_grosseiramente": "cebola",
  batatas_russet: "batata",
  "batata-doce": "batata_doce",
  mirtilos: "mirtilo",
  pimentoes_vermelhos: "pimentao",
  pimentao_vermelho: "pimentao",
  pimentao_verde: "pimentao",
  pimentao_amarelo: "pimentao",
  "pimentao_ou_outros_legumes": "pimentao",
  pimentas_serrano: "pimenta_serrano",
  pimentas_verdes_abertas: "pimenta_verde",
  gemas: "gema",
  cravos: "cravo",
  "cravos-da-india": "cravo",
  espaguete: "espaguete",
  "de_espaguete_integral_ou_de_grano_duro": "espaguete",
  chipotle_ancho: "chipotle",
  "kidney_beans_ou_15_xicara_cozidos": "feijao_kidney",

  // Flour / breadcrumbs / cashews — variant phrasing collapsed to one product.
  bem_cheia_de_farinha_de_trigo: "farinha_de_trigo",
  "opcional_32_g_de_farinha_se_pre-assar_a_base": "farinha_de_trigo",
  farinha: "farinha_de_trigo",
  farinha_de_rosca_tostada: "farinha_de_rosca",
  castanha_de_caju_crua: "castanha_de_caju",
  castanha_de_caju_torrada_sem_sal: "castanha_de_caju",

  // Creme de castanha caseiro (our own base recipe) variants.
  creme_de_castanha_caseiro_espesso: "creme_de_castanha_caseiro",
  "cream_cheese_vegano_ou_creme_de_castanha_caseiro": "creme_de_castanha_caseiro",
  "creme_de_castanha_caseiro_ou_1_2_xicara_de_creme_vegetal": "creme_de_castanha_caseiro",
  "mais_de_creme_de_castanha_caseiro_ou_creme_vegetal_opcional_depois_da_pressao":
    "creme_de_castanha_caseiro",
};

/**
 * Exact (recipeSlug, itemText) matches that are noise, not real ingredients
 * — reference tables, conditional notes, or fragments split out from a
 * neighboring item by the automatic splitter. Excluded entirely.
 */
export const EXCLUDE_ROWS: Array<{ recipeSlug: string; itemText: string }> = [
  // Beterraba básica: a circumference->time lookup table was written as
  // bullets in the source markdown, not real ingredients.
  ...[
    "12,7 cm: 11-15 min",
    "14,0 cm: 14-18 min",
    "15,2 cm: 17-21 min",
    "16,5 cm: 18-23 min",
    "17,8 cm: 20-25 min",
    "19,1 cm: 24-28 min",
    "20,3 cm: 27-31 min",
    "21,6 cm: 30-34 min",
    "22,9 cm: 32-36 min",
  ].map((itemText) => ({ recipeSlug: "beterraba-basica", itemText })),
  { recipeSlug: "beterraba-basica", itemText: "TEMPOS por circunferência:" },

  // Grão-de-bico básico: conditional salt note, superseded by a corrected row below.
  { recipeSlug: "grao-de-bico-basico", itemText: "9 g se sem molho" },

  // Chili de lentilha vermelha: "+1/2 cup" is an add-more note on the water/broth
  // row just before it, not a separate ingredient.
  {
    recipeSlug: "chili-de-lentilha-vermelha-e-feijao",
    itemText: "+1/2 xícara se os tomates estiverem pouco suculentos",
  },

  // Arroz branco básico: "original: 50g bacon - omitir" / adaptation note fragments
  // that ended up inside an ingredient bullet's alternatives text.
  { recipeSlug: "feijao-basico-do-dia-a-dia", itemText: "original: 50 g de bacon - omitir" },
  {
    recipeSlug: "feijao-basico-do-dia-a-dia",
    itemText: "adaptação: 1 fio de azeite para o refogado",
  },

  // Equipment / cookware mentioned inline, not purchasable ingredients.
  { recipeSlug: "beterraba-basica", itemText: "cesto ou suporte de vapor" },
  { recipeSlug: "flan-creme-caramel", itemText: "papel-alumínio e suporte/grade" },
  {
    recipeSlug: "flan-creme-caramel",
    itemText: "6 ramequins de cerca de 177 ml, aproximadamente 7,6 x 3,8 cm",
  },
  { recipeSlug: "lava-cake-petit-gateau", itemText: "4 ramequins de 170 ml / 6 oz" },
  { recipeSlug: "flan-creme-caramel", itemText: "suporte/grade" },

  // Footnote fragments split off from the preceding quantity by ";" — not
  // separate ingredients, just qualifiers on the item right before them.
  { recipeSlug: "apple-butter-creme-concentrado-de-maca", itemText: "opcional" },
  { recipeSlug: "sopa-doce-chinesa-de-feijao-azuki", itemText: "se necessário" },
  {
    recipeSlug: "ervilha-seca-partida-basica-para-hamburguer",
    itemText: "somente ao final",
  },
  { recipeSlug: "chana-masala", itemText: "3/4 xícara para enlatado" },
  { recipeSlug: "kitchari-de-arroz-basmati-e-lentilha", itemText: "2,5 para mais caldoso" },
  {
    recipeSlug: "curry-de-proteina-de-soja-grossa-e-couve-flor",
    itemText: "2 para molho mais líquido",
  },
  {
    recipeSlug: "sopa-vegana-de-feijao-preto",
    itemText: "use 3 xícaras se quiser mais líquida",
  },
];

/** Per-row quantity/unit fixes the auto-parser couldn't get right. */
export const ROW_FIXES: Array<{
  recipeSlug: string;
  itemTextMatch: string;
  quantity?: number | null;
  unit?: string | null;
  canonicalId?: string;
}> = [
  {
    recipeSlug: "grao-de-bico-basico",
    itemTextMatch: "6 g de sal se demolhado",
    quantity: 9,
    unit: "g",
    canonicalId: "sal",
  },
  // "1/2 de cominho" / "1/4 de assa-fétida" omit the unit word, inheriting
  // "colher (chá)" from the previous item in the same semicolon-separated list.
  { recipeSlug: "dal-dhokli", itemTextMatch: "1/2 de cominho", unit: "colher_cha" },
  {
    recipeSlug: "dal-dhokli",
    itemTextMatch: "1/4 de assa-fétida",
    unit: "colher_cha",
  },
];

/** Curated display names for the higher-traffic canonical ingredients (rest fall back to a title-cased guess). */
export const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  sal: "Sal",
  alho: "Alho",
  cebola: "Cebola",
  acucar: "Açúcar",
  agua: "Água",
  ovos: "Ovos",
  louro: "Louro (folha)",
  oleo: "Óleo",
  cenoura: "Cenoura",
  azeite: "Azeite",
  manteiga: "Manteiga",
  alho_em_po: "Alho em pó",
  tomate: "Tomate",
  curcuma: "Cúrcuma",
  coentro_em_po: "Coentro em pó",
  garam_masala: "Garam masala",
  agua_fria: "Água fria",
  canela: "Canela em pau",
  canela_em_po: "Canela em pó",
  baunilha: "Baunilha (extrato)",
  leite_condensado: "Leite condensado",
  molho_de_soja: "Molho de soja",
  salsao: "Salsão",
  cominho: "Cominho",
  oregano: "Orégano",
  creme_de_leite: "Creme de leite",
  limao: "Limão",
  extrato_de_tomate: "Extrato de tomate",
  cogumelos: "Cogumelos",
  farinha_de_trigo: "Farinha de trigo",
  "noz-moscada": "Noz-moscada",
  leite: "Leite",
  cebola_em_po: "Cebola em pó",
  pimenta_verde: "Pimenta verde/chili fresco",
  cayenne: "Pimenta caiena",
  caldo_de_legumes_caseiro: "Caldo de legumes caseiro",
  paprica: "Páprica",
  gengibre: "Gengibre",
  batata: "Batata",
  tomilho: "Tomilho",
  chili_em_po: "Chili em pó",
  coentro: "Coentro (folhas frescas)",
  pimenta_do_reino: "Pimenta-do-reino",
};
