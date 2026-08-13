/**
 * Strips pure prep-state words/phrases (chopping, grating, size adjectives)
 * that don't change what product you'd buy at the store, WITHOUT stripping
 * words that genuinely change the product ("em pó", "seco", "fresco",
 * "integral", "cru", "cozido", "light", "sem sal", "defumado" etc. are kept
 * on purpose — "cebola" and "cebola em pó" must stay distinct ingredients).
 */

const STRIP_WORDS = [
  "picad[oa]s?",
  "fatiad[oa]s?",
  "triturad[oa]s?",
  "amassad[oa]s?",
  "descascad[oa]s?",
  "cortad[oa]s?",
  "quebrad[oa]s?",
  "ralad[oa]s?(\\s+na\\s+hora)?",
  "mo[íi]d[oa]s?(\\s+na\\s+hora)?",
  "lavad[oa]s?",
  "escorrid[oa]s?",
  "bem\\s+picad[oa]s?",
  "grande[s]?",
  "pequen[oa]s?",
  "m[ée]di[oa]s?",
  "extra\\s+grandes?",
  "temperatura\\s+ambiente",
  "em\\s+temperatura\\s+ambiente",
  "derretid[oa]s?",
  "levemente\\s+batidos?",
  "na\\s+hora",
];

const STRIP_PHRASES = [
  /\bem\s+cubos?(\s+(pequenos?|grandes?|de\s+[\d.,]+\s*cm))?\b/gi,
  /\bem\s+rodelas?\b/gi,
  /\bem\s+fatias?\b/gi,
  /\bem\s+quartos?\b/gi,
  /\bem\s+tiras?\b/gi,
  /\bao\s+meio\b/gi,
  /\bcortad[oa]s?\s+ao\s+meio\b/gi,
  /\bcerca\s+de\s+[\d.,/]+\s*(g|kg|ml|cm|l)\b/gi,
  /\([^)]*\)/g, // parenthetical asides, e.g. "(cerca de 40 g)"
  /\bpara\s+finalizar\b/gi,
  /\bpara\s+servir\b/gi,
  /\ba\s+gosto\b/gi,
  /\bopcionais?\b/gi,
];

export function normalizeForVocabulary(nameGuess: string): string {
  let s = nameGuess;
  for (const phrase of STRIP_PHRASES) s = s.replace(phrase, " ");

  const wordPattern = new RegExp(`\\b(${STRIP_WORDS.join("|")})\\b`, "gi");
  s = s.replace(wordPattern, " ");

  s = s
    .replace(/\//g, " ") // leftover slashes from "picado/triturado", "soja/tamari" etc.
    .replace(/\s+/g, " ")
    .replace(/^[,.\s]+|[,.\s]+$/g, "")
    .trim();

  // Trailing/leading dangling conjunctions left over after word-stripping,
  // e.g. "grão-de-bico cozido e" (from "... cozido e escorrido"), or
  // "alho ou" (from "alho amassado ou triturado" once both preps are stripped).
  s = s
    .replace(/\s+(e|ou)\s*$/i, "")
    .replace(/^\s*(e|ou)\s+/i, "")
    .trim();

  // A leading "de/da/do" can be exposed only after stripping a parenthetical
  // pack-size aside, e.g. "(250 g) de espaguete" -> "de espaguete" -> "espaguete".
  s = s.replace(/^d[aeo]s?\s+/i, "").trim();

  return s;
}

/** Converts markdown link syntax `[label](url)` to just `label`. */
export function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function slugifyId(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}
