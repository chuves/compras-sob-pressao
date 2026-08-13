import { readFileSync } from "node:fs";

export interface RecipeBlock {
  title: string;
  category: "salgado" | "doce";
  /** Raw lines between the "## Title" heading and the next "## "/"# " heading. */
  bodyLines: string[];
}

/**
 * Splits receitas_ppp01p.md into per-recipe blocks, tracking which top-level
 * "# Salgados" / "# Doces" section each "## Recipe" heading falls under.
 * "# Salgados" appears twice (non-contiguous) — both map to "salgado".
 */
export function loadRecipeBlocks(mdPath: string): RecipeBlock[] {
  const raw = readFileSync(mdPath, "utf-8");
  const lines = raw.split(/\r?\n/);

  const blocks: RecipeBlock[] = [];
  let currentCategory: "salgado" | "doce" | null = null;
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentTitle && currentCategory) {
      blocks.push({
        title: currentTitle,
        category: currentCategory,
        bodyLines: currentLines,
      });
    }
    currentTitle = null;
    currentLines = [];
  };

  for (const line of lines) {
    const topHeading = line.match(/^# (.+)$/);
    if (topHeading) {
      flush();
      const name = topHeading[1].trim();
      currentCategory = name === "Salgados" ? "salgado" : "doce";
      continue;
    }
    const recipeHeading = line.match(/^## (.+)$/);
    if (recipeHeading) {
      flush();
      currentTitle = recipeHeading[1].trim();
      continue;
    }
    if (currentTitle) currentLines.push(line);
  }
  flush();

  return blocks;
}

/** Joins hard-wrapped lines into a single paragraph, collapsing internal whitespace. */
export function joinWrapped(lines: string[]): string {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts a "### Heading" subsection's raw lines (excluding the heading itself),
 * stopping at the next "### " heading or end of block.
 */
export function extractSection(
  bodyLines: string[],
  headingName: string,
): string[] | null {
  const startIdx = bodyLines.findIndex(
    (l) => l.trim() === `### ${headingName}`,
  );
  if (startIdx === -1) return null;
  const rest = bodyLines.slice(startIdx + 1);
  const endIdx = rest.findIndex((l) => /^### /.test(l.trim()));
  return endIdx === -1 ? rest : rest.slice(0, endIdx);
}

/**
 * Splits a bullet-list section into individual bullet strings, joining
 * hard-wrapped continuation lines (indented, not starting with "-").
 */
export function extractBullets(sectionLines: string[]): string[] {
  const bullets: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) bullets.push(joinWrapped(current));
    current = [];
  };

  for (const line of sectionLines) {
    if (/^-\s+/.test(line)) {
      flush();
      current.push(line.replace(/^-\s+/, ""));
    } else if (line.trim().length > 0) {
      current.push(line);
    } else {
      flush();
    }
  }
  flush();
  return bullets;
}

/** Splits a numbered-list section (Preparo) into individual step strings. */
export function extractNumbered(sectionLines: string[]): string[] {
  const steps: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) steps.push(joinWrapped(current));
    current = [];
  };

  for (const line of sectionLines) {
    if (/^\d+\.\s+/.test(line)) {
      flush();
      current.push(line.replace(/^\d+\.\s+/, ""));
    } else if (line.trim().length > 0) {
      current.push(line);
    } else {
      flush();
    }
  }
  flush();
  return steps;
}

/**
 * Generates the same heading-anchor slug GitHub-flavored Markdown produces,
 * so [text](#anchor) links in the source document can be resolved to titles.
 * Lowercases, strips ASCII punctuation (keeps unicode letters/digits/spaces/hyphens),
 * then turns spaces into hyphens.
 */
export function githubAnchorSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N} -]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** ASCII, URL-friendly app slug (accents stripped) — used for internal recipe ids/routes. */
export function appSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
