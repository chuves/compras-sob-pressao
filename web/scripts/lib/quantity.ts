/**
 * Best-effort extraction of {quantity, unit, name} from a single freeform
 * Portuguese ingredient phrase (already split into one "item" — no ";" or
 * " OU " left in it). This is a DRAFT step: output is meant for human
 * review, not blind trust — see scripts/draft-ingredients.ts.
 */

export type ParsedUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "oz"
  | "xicara"
  | "colher_sopa"
  | "colher_cha"
  | "unidade"
  | "medida"
  | "dente"
  | "folha"
  | "fatia"
  | "lata"
  | "vidro"
  | "caixa"
  | "pacote"
  | "ramo"
  | "pau"
  | "pitada"
  | "fio"
  | "punhado"
  | "cabeca"
  | "maco";

export interface ParsedItem {
  /** Original text, untouched. */
  rawText: string;
  quantity: number | null;
  unit: ParsedUnit | null;
  /** Best-effort ingredient name/phrase with the quantity+unit stripped off. */
  nameGuess: string;
}

const UNIT_PATTERNS: [RegExp, ParsedUnit][] = [
  [/^colher(?:es)?\s*\(sopa\)/i, "colher_sopa"],
  [/^colher(?:es)?\s*\(ch[áa]\)/i, "colher_cha"],
  [/^x[íi]caras?/i, "xicara"],
  [/^medidas?/i, "medida"],
  [/^dentes?/i, "dente"],
  [/^folhas?/i, "folha"],
  [/^fatias?/i, "fatia"],
  [/^latas?/i, "lata"],
  [/^vidros?/i, "vidro"],
  [/^caixas?|^caixinhas?/i, "caixa"],
  [/^pacotes?/i, "pacote"],
  [/^ramos?/i, "ramo"],
  [/^paus?/i, "pau"],
  [/^pitadas?/i, "pitada"],
  [/^fios?/i, "fio"],
  [/^punhados?/i, "punhado"],
  [/^cabe[çc]as?/i, "cabeca"],
  [/^ma[çc]os?/i, "maco"],
  [/^kg\b|^quilos?/i, "kg"],
  [/^g\b|^gramas?/i, "g"],
  [/^ml\b|^mililitros?/i, "ml"],
  [/^litros?|^l\b/i, "l"],
  [/^oz\b/i, "oz"],
];

// A single number token: "1 1/2" (mixed), "1/2" (fraction), or "2,5"/"2" (decimal/int).
const NUM_TOKEN = "(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?)";
const LEADING_NUMBER_RE = new RegExp(
  `^(${NUM_TOKEN})(?:\\s*-\\s*(${NUM_TOKEN}))?`,
);

function tokenToNumber(token: string): number {
  const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = token.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return Number(token.replace(",", "."));
}

/** Parses a leading number: "2", "1/2", "1 1/2", "2,5", or any of those as a "-" range (uses the upper bound). */
function parseLeadingNumber(rawText: string): { value: number; rest: string } | null {
  const text = rawText.replace(/^cerca\s+de\s+/i, "");
  const m = text.match(LEADING_NUMBER_RE);
  if (!m) return null;

  const value = tokenToNumber(m[2] ?? m[1]);
  return { value, rest: text.slice(m[0].length).trim() };
}

const TRAILING_NOISE = /\s*,\s*(opcional|opcionais|dividid[oa]s?)\s*$/i;
const LEADING_PREP_ARTICLES = /^d[aeo]s?\s+/i;

// For container units (lata, vidro, ...), the pack size is often spelled out
// right after, e.g. "1 lata de 425 g de feijão-preto" — strip that "425 g de"
// pack-size annotation so the name is just "feijão-preto".
const CONTAINER_UNITS = new Set(["lata", "vidro", "caixa", "pacote"]);
const PACK_SIZE_RE = new RegExp(
  `^\\(?${NUM_TOKEN}\\s*(g|kg|ml|l|oz)\\)?\\s+de\\s+`,
  "i",
);

// Collapses "N1 unit1 / N2 unit2 de X" (two equivalent quantity specs, e.g.
// "14 g / 3 dentes de alho") down to just "N1 unit1 de X", since the first
// number is already in the more shopping-list-friendly unit in this dataset.
const DUAL_UNIT_RE = new RegExp(
  `^(${NUM_TOKEN}\\s*(?:g|kg|ml|l)\\b)\\s*\\/\\s*${NUM_TOKEN}\\s*[^/]*?\\s+de\\s+`,
  "i",
);

export function parseItem(rawText: string): ParsedItem {
  let text = rawText.trim().replace(TRAILING_NOISE, "");
  const dualUnitMatch = text.match(DUAL_UNIT_RE);
  if (dualUnitMatch) {
    text = `${dualUnitMatch[1]} de ${text.slice(dualUnitMatch[0].length)}`;
  }

  const numberMatch = parseLeadingNumber(text);
  if (!numberMatch) {
    return { rawText, quantity: null, unit: null, nameGuess: text };
  }

  const quantity = numberMatch.value;
  let rest = numberMatch.rest;

  for (const [pattern, unit] of UNIT_PATTERNS) {
    if (pattern.test(rest)) {
      rest = rest.replace(pattern, "").trim().replace(LEADING_PREP_ARTICLES, "");
      if (CONTAINER_UNITS.has(unit)) {
        rest = rest.replace(PACK_SIZE_RE, "");
      }
      return { rawText, quantity, unit, nameGuess: rest };
    }
  }

  // No recognized unit word: "3 tomates", "2 ovos" -> implicit "unidade".
  // But bare grams/ml sometimes appear without a space, e.g. "230g" (rare) — already
  // covered by UNIT_PATTERNS above via "^g\b" after the number.
  rest = rest.replace(LEADING_PREP_ARTICLES, "");
  return { rawText, quantity, unit: "unidade", nameGuess: rest };
}

/**
 * Splits a raw ingredient bullet into one or more item strings.
 * Handles: "LABEL: a; b; c" sub-grouped bullets, and bare (no leading
 * quantity) comma/"e"-joined lists like "sal, pimenta e azeite".
 */
/** Splits on a delimiter, but never inside ( ) or [ ]( ) markdown link parens. */
function splitOutsideParens(text: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

export function splitBulletIntoItems(bullet: string): {
  subgroup: string | null;
  items: string[];
} {
  const labelMatch = bullet.match(/^([A-ZÇÁÉÍÓÚÂÊÔÃÕ0-9][A-ZÇÁÉÍÓÚÂÊÔÃÕ0-9 ]{1,30}):\s*(.+)$/);
  const subgroup = labelMatch ? labelMatch[1].trim() : null;
  const body = labelMatch ? labelMatch[2] : bullet;

  const semicolonParts = splitOutsideParens(body, ";");
  if (semicolonParts.length > 1) {
    return {
      subgroup,
      items: semicolonParts.map((s) => s.trim()).filter(Boolean),
    };
  }

  const hasLeadingNumber = /^\d/.test(body.trim());
  const hasAnyDigit = /\d/.test(body);
  if (!hasLeadingNumber && !hasAnyDigit && (body.includes(",") || / e /.test(body))) {
    const parts = splitOutsideParens(body.replace(/\s+e\s+/g, ", "), ",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 1) return { subgroup, items: parts };
  }

  return { subgroup, items: [body.trim()] };
}

/** Splits " OU " alternatives, returning the primary (first) choice plus the rest as a note. */
export function splitOrAlternatives(item: string): {
  primary: string;
  alternativesNote: string | null;
} {
  // Case-SENSITIVE on purpose: the source document capitalizes "OU" specifically
  // to mark a real ingredient alternative; lowercase "ou" is just normal Portuguese
  // prose ("1/4 xícara ou mais de...") and must not trigger a split.
  const parts = item.split(/\s+OU\s+/);
  if (parts.length === 1) return { primary: item, alternativesNote: null };
  return {
    primary: parts[0].trim(),
    alternativesNote: `alternativa: ${parts.slice(1).join(" OU ").trim()}`,
  };
}
