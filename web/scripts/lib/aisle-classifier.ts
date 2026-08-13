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

// JS's plain "\b" is ASCII-only and silently fails to match right before/after
// accented letters (e.g. "\bágua" never matches "Água") — build Unicode-aware
// word boundaries instead so every rule below actually works on Portuguese text.
function wb(alternation: string): RegExp {
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${alternation})(?![\\p{L}\\p{N}])`,
    "iu",
  );
}

const RULES: [RegExp, Aisle][] = [
  [wb("águas?|aguas?"), "agua_e_gelo"],

  // Fresh produce (check before "em pó"/dried variants win elsewhere).
  [
    wb(
      "cebolas?|alhos?|cenouras?|salsão|salsao|salsões|batatas?(-doces?)?|batatinhas?|pimentão|pimentões|pimentao|pimenta verde|pimentas verdes?|pimenta serrano|pimentas serrano|jalapeño|jalapenos?|chalotas?|gengibre|abóbora|abobora|abobrinhas?|couve-flor(es)?|brócolis|brocolis|espinafre|couves?|kale|mangas?|bananas?|maçãs?|macas?|limão|limões|limao|limoes|beterrabas?|milho|cocos?|erva-doce|funcho|abacates?|jacas?|mirtilos?",
    ),
    "hortifruti",
  ],
  [
    wb(
      "salsas?|coentro|manjericão|manjericao|cebolinhas?|tomilho fresco|sálvia fresca|salvia fresca|hortelã|hortela|folhas? de curry|alecrim( fresco)?|ervas( frescas?)?|estragão|estragao",
    ),
    "hortifruti",
  ],
  [wb("cogumelos?|shiitake|cremini|porcini|champignon"), "hortifruti"],

  // Dairy & eggs.
  [
    wb(
      "leites?|manteigas?|creme de leite|queijos?|cheddar|parmesão|parmesao|iogurtes?|cream cheese|sour cream|requeijão|requeijao|ovos?|gemas?|ghee",
    ),
    "laticinios_e_ovos",
  ],

  // Bakery.
  [wb("farinha de rosca|graham crackers|folhas? de lasanha|pão|pães?|pao|espaguetes?|penne|massas?|croutons?"), "padaria"],

  // Alcohol.
  [wb("vinhos?|sherry|brandy|whisky|licor"), "bebidas"],

  // Plant proteins / legumes / grains (pantry-adjacent but grouped for shopping clarity).
  [
    wb(
      "grão-de-bico|grao-de-bico|feijão\\S*|feijões|feijao\\S*|lentilhas?|ervilhas?|sojas?|pts|soy curls|tofu|proteína de soja|proteina de soja|toor dal|azuki|quinoa|arroz(es)?",
    ),
    "proteinas_vegetais",
  ],

  // Spices & dried herbs.
  [
    wb(
      "sal|pimentas?(-do-reino)?|cominhos?|coentro em pó|coentro em po|cúrcuma|curcuma|páprica|paprica|canelas?|noz-moscada|cravos?|louros?|orégano|oregano|tomilho|garam masala|currys?|chilis?|cayenne|assa-fétida|assa-fetida|ajwain|feno-grego|mostarda(s)?( em pó| em po)?|sementes? de mostarda|sementes? de cominho|kasuri methi|chenpi|allspice|cardamomo|taco seasoning|poultry seasoning|tempero italiano",
    ),
    "temperos_e_especiarias",
  ],

  // Pantry staples.
  [
    wb(
      "açúcar|acucar|farinhas?|amido|fermentos?|bicarbonato|óleos?|oleos?|azeites?|vinagres?|molho de soja|tamari|extrato de tomate|molhos? de tomate|polpa de tomate|tomates?|caldos?|leite de coco|leite condensado|chocolates?|cacau|baunilha|mel|jaggery|tamarindo|besan|coco em flocos|castanhas?|amendoim|canjica|levedura nutricional|coconut aminos|fish sauce|worcestershire|palmitos?|azeite de dendê|azeite de dende|geleia|maple syrup|paçocas?|pacocas?|granulado|molho picante|pestos?|creme vegetal|chipotle|adoçante|adocante|coberturas?|toppings?",
    ),
    "mercearia",
  ],
];

export function classifyAisle(displayName: string): Aisle {
  for (const [pattern, aisle] of RULES) {
    if (pattern.test(displayName)) return aisle;
  }
  return "outros";
}
