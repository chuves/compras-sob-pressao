import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  loadRecipeBlocks,
  extractSection,
  extractBullets,
  extractNumbered,
  joinWrapped,
  githubAnchorSlug,
  appSlug,
  type RecipeBlock,
} from "./lib/markdown.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MD_PATH = path.resolve(__dirname, "../../receitas_ppp01p.md");
const OUT_PATH = path.resolve(__dirname, "../data/recipes.json");

interface SourceLink {
  label: string;
  url: string;
}

interface Recipe {
  slug: string;
  githubAnchor: string;
  title: string;
  category: "salgado" | "doce";
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

/**
 * The PPP01P/Pressão/Porções fields are one markdown paragraph using "\"
 * (backslash) line breaks, and each field's own text can itself wrap onto
 * unlabeled continuation lines. Join the whole paragraph, strip the "\"
 * hard-break markers, then split on the field labels.
 */
function extractHeaderFields(bodyLines: string[]): {
  ppp01pPrograma: string | null;
  pressao: string | null;
  porcoes: string | null;
} {
  const startIdx = bodyLines.findIndex((l) => l.includes("**PPP01P:**"));
  if (startIdx === -1)
    return { ppp01pPrograma: null, pressao: null, porcoes: null };

  const paragraph: string[] = [];
  for (const line of bodyLines.slice(startIdx)) {
    if (line.trim().length === 0) break;
    paragraph.push(line.trim().replace(/\\$/, ""));
  }
  const blob = paragraph.join(" ").replace(/\s+/g, " ").trim();

  const fields: Record<string, string> = {};
  const re = /\*\*(PPP01P|Pressão|Porções):\*\*\s*(.*?)(?=\s*\*\*(?:PPP01P|Pressão|Porções):\*\*|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blob))) {
    fields[m[1]] = m[2].trim();
  }

  return {
    ppp01pPrograma: fields["PPP01P"] || null,
    pressao: fields["Pressão"] || null,
    porcoes: fields["Porções"] || null,
  };
}

/** Extracts the italic "*Difficulty • porções • tempos*" line, which can wrap across several lines. */
function extractSubtitle(bodyLines: string[]): string {
  const startIdx = bodyLines.findIndex((l) => /^\*[^*]/.test(l.trim()));
  if (startIdx === -1) return "";
  const chunk: string[] = [];
  for (const line of bodyLines.slice(startIdx)) {
    chunk.push(line);
    if (line.trim().endsWith("*")) break;
    if (line.trim().length === 0) break;
  }
  return joinWrapped(chunk).replace(/^\*+|\*+$/g, "").trim();
}

/** Splits a "### " section's lines into paragraphs (blank-line separated), each joined/unwrapped. */
function extractParagraphs(sectionLines: string[] | null): string[] {
  if (!sectionLines) return [];
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of sectionLines) {
    if (line.trim().length === 0) {
      if (current.length) paragraphs.push(joinWrapped(current));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) paragraphs.push(joinWrapped(current));
  return paragraphs;
}

/** Cuts a section's lines off before the "**Fonte auditada:**" footer / horizontal rule. */
function truncateBeforeFooter(lines: string[] | null): string[] | null {
  if (!lines) return null;
  const footerIdx = lines.findIndex(
    (l) => l.includes("**Fonte auditada:**") || /^-{5,}$/.test(l.trim()),
  );
  return footerIdx === -1 ? lines : lines.slice(0, footerIdx);
}

function extractInternalLinkAnchors(text: string): string[] {
  const anchors: string[] = [];
  const re = /\]\(#([a-z0-9\p{L}-]+)\)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) anchors.push(m[1]);
  return anchors;
}

function extractSourceLinks(bodyLines: string[]): {
  fonteAuditada: string | null;
  receitaOriginal: SourceLink[];
} {
  const startIdx = bodyLines.findIndex((l) =>
    l.includes("**Fonte auditada:**"),
  );
  if (startIdx === -1) return { fonteAuditada: null, receitaOriginal: [] };

  const tailLines = bodyLines
    .slice(startIdx)
    .filter((l) => !/^-{5,}$/.test(l.trim()) && l.trim().length > 0);
  const blob = tailLines.join(" ").replace(/\s+/g, " ").trim();

  const fonteMatch = blob.match(
    /\*\*Fonte auditada:\*\*\s*(.*?)\s*\*\*Receita original/,
  );
  const fonteAuditada = fonteMatch ? fonteMatch[1].trim() : null;

  const receitaOriginal: SourceLink[] = [];
  const re = /\*\*Receita original(?:\s*\(([^)]*)\))?:\*\*\s*(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blob))) {
    receitaOriginal.push({ label: m[1] ?? "", url: m[2] });
  }

  return { fonteAuditada, receitaOriginal };
}

function parseRecipe(
  block: RecipeBlock,
  anchorToSlug: Map<string, string>,
): Recipe {
  const { title, category, bodyLines } = block;
  const slug = appSlug(title);
  const githubAnchor = githubAnchorSlug(title);

  const subtitle = extractSubtitle(bodyLines);
  const { ppp01pPrograma, pressao, porcoes } = extractHeaderFields(bodyLines);

  const adaptacaoLines = extractSection(bodyLines, "Adaptação PPP01P");
  const adaptacao = extractParagraphs(adaptacaoLines);
  const preparoExtraRelatedSlugs = Array.from(
    new Set(
      adaptacao
        .flatMap((p) => extractInternalLinkAnchors(p))
        .map((anchor) => anchorToSlug.get(anchor) ?? anchor),
    ),
  );

  const principaisLines = extractSection(bodyLines, "Ingredientes principais");
  const secundariosLines = extractSection(
    bodyLines,
    "Ingredientes secundários",
  );
  const preparoLines = extractSection(bodyLines, "Preparo");
  const observacoesLines = truncateBeforeFooter(
    extractSection(bodyLines, "Observações da fonte"),
  );

  const { fonteAuditada, receitaOriginal } = extractSourceLinks(bodyLines);

  return {
    slug,
    githubAnchor,
    title,
    category,
    subtitle,
    ppp01pPrograma,
    pressao,
    porcoes,
    adaptacao,
    preparoExtraRelatedSlugs,
    ingredientesPrincipais: extractBullets(principaisLines ?? []),
    ingredientesSecundarios: extractBullets(secundariosLines ?? []),
    preparo: extractNumbered(preparoLines ?? []),
    observacoes: extractParagraphs(observacoesLines),
    fonteAuditada,
    receitaOriginal,
  };
}

function main() {
  const blocks = loadRecipeBlocks(MD_PATH);
  console.log(`Encontradas ${blocks.length} receitas.`);

  const anchorToSlug = new Map<string, string>();
  for (const b of blocks) {
    anchorToSlug.set(githubAnchorSlug(b.title), appSlug(b.title));
  }

  const recipes = blocks.map((b) => parseRecipe(b, anchorToSlug));

  // Sanity checks
  const slugCounts = new Map<string, number>();
  for (const r of recipes) {
    slugCounts.set(r.slug, (slugCounts.get(r.slug) ?? 0) + 1);
  }
  const dupes = [...slugCounts.entries()].filter(([, n]) => n > 1);
  if (dupes.length) {
    console.error("Slugs duplicados:", dupes);
    process.exitCode = 1;
  }

  for (const r of recipes) {
    const problems: string[] = [];
    if (!r.ppp01pPrograma) problems.push("sem PPP01P");
    if (!r.pressao) problems.push("sem Pressão");
    if (!r.porcoes) problems.push("sem Porções");
    if (r.ingredientesPrincipais.length === 0)
      problems.push("sem ingredientes principais");
    if (r.ingredientesSecundarios.length === 0)
      problems.push("sem ingredientes secundários");
    if (r.preparo.length === 0) problems.push("sem preparo");
    if (!r.fonteAuditada) problems.push("sem fonte auditada");
    if (r.receitaOriginal.length === 0) problems.push("sem receita original");
    for (const relSlug of r.preparoExtraRelatedSlugs) {
      if (!recipes.some((rr) => rr.slug === relSlug)) {
        problems.push(`link interno quebrado: ${relSlug}`);
      }
    }
    if (problems.length) {
      console.warn(`[aviso] "${r.title}": ${problems.join(", ")}`);
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify(recipes, null, 2) + "\n", "utf-8");
  console.log(`Escrito ${OUT_PATH} (${recipes.length} receitas).`);
}

main();
