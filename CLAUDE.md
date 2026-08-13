# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Two things, joined:

1. `receitas_ppp01p.md` — a curated document of vegetarian/vegan recipes adapted for the **Philco PPP01P** electric pressure cooker. This is the canonical, human-readable source of every recipe.
2. `web/` — a Vite + React + TypeScript static web app (deployed to GitHub Pages) that lets you browse/search those recipes, build a weekly meal plan, and generate a consolidated shopping list. It does **not** parse the markdown at runtime — a data pipeline (`web/scripts/`) turns the markdown into structured JSON once, which the app then imports at build time.

## Editing the recipe book (`receitas_ppp01p.md`)

Recipes are sourced from external cooking sites (via WebFetch/WebSearch), then adapted to the PPP01P's specific programs and pressure-release options, and appended to `receitas_ppp01p.md` following the existing template exactly (see below).

`.claude/settings.local.json` pre-allows `WebFetch` for the specific recipe-site domains already used as sources (e.g. `www.pressurecookrecipes.com`, `minimalistbaker.com`, `rainbowplantlife.com`, `mygoodnesskitchen.com`, `www.tudogostoso.com.br`, etc.) plus `WebSearch`. When pulling a recipe from a new domain, add it to the `allow` list rather than relying on one-off prompts.

Key adaptation rules used throughout the document:
- Always state the PPP01P program name and time explicitly (e.g. `Cozinhar - 10 min`, `Arroz - 10 min`, or `Sem pressão` for stovetop/non-pressure recipes).
- Always state the pressure-release method (`Natural`, `Rápida`, `Natural 20 min`, or `Não se aplica`).
- Explicitly flag whether the PPP01P adaptation was actually tested on this model or just carried over from the source recipe's generic/Instant Pot instructions (e.g. "não testada neste modelo", "não é um teste específico deste modelo").
- Always preserve a link back to the original source recipe and note the source's rating/review count when available, so provenance and confidence are auditable.
- State a `**Porções:**` field explicitly (even if it's an estimate — say so, e.g. "estimativa do caderno; a fonte não informa rendimento"). The web app's shopping-list math depends on every recipe having this.
- When a recipe depends on another recipe in this book as a component (e.g. "Caldo de legumes caseiro", "Creme de castanha caseiro"), link it inline as `[Nome da receita](#anchor-slug)` — the anchor must match GitHub's heading-slug algorithm (lowercase, spaces→hyphens, accented letters kept). The web app's `parse-recipes.ts` resolves these links to real routes; broken anchors fail its validation.

### Document structure

`receitas_ppp01p.md` is organized into top-level sections by `#` headings: `# Salgados` (savory) and `# Doces` (sweets). Note that **`# Salgados` appears twice** (near the top of the file and again near the end) — it is not a single contiguous section, so when adding a new savory recipe, check both locations rather than assuming there's one savory block to append to.

Each individual recipe is a `##` heading followed by this fixed template — match it exactly for new entries:

```markdown
## Recipe name

*Difficulty • N porções • active time • total time*

**PPP01P:** Program name - time\
**Pressão:** Release method\
**Porções:** N (say if confirmed by the source or estimated)

### Adaptação PPP01P

Free-text note on how the source recipe's instructions were mapped to a PPP01P
program, and whether this specific adaptation has been tested on this model.
If it depends on another recipe in this book, add a line starting
"PREPARO EXTRA NECESSÁRIO:" linking to it.

### Ingredientes principais

-   The ingredients that define the dish (produce, proteins, grains) —
    these drive the shopping list.

### Ingredientes secundários

-   Seasonings, oils, pantry staples — everything else.

### Preparo

1.  Numbered steps, written for the PPP01P (cuba/panela terms, when to
    close the lid, which program/pressure to use, how to release).

### Observações da fonte

Notes carried over from the original source (substitutions, storage tips,
caveats about testing on Instant Pot vs. genuine multicooker, etc.)

**Fonte auditada:** Site name - rating/review count **Receita
original:** https://...

------------------------------------------------------------------------
```

A horizontal rule (`------------------------------------------------------------------------`) separates recipes.

## The web app (`web/`)

### Data pipeline — run this after editing the markdown

The app reads structured JSON, not the markdown, so any recipe edit needs a rebuild:

```bash
cd web
npm run build-data   # parse-recipes -> draft-ingredients -> build-ingredients -> validate-data
```

- `scripts/parse-recipes.ts` — mechanically parses every `##` recipe into `data/recipes.json` (title, category, porções, PPP01P program, preparo steps, source links, internal cross-links). Reliable because the markdown template is strict; re-run freely.
- `scripts/draft-ingredients.ts` — best-effort regex extraction of `{quantity, unit, name}` from each ingredient bullet into `data/ingredients.draft.json` (gitignored, diagnostic only) plus `data/vocab-candidates.json` (frequency-sorted distinct ingredient names).
- `scripts/lib/ingredient-corrections.ts` — **hand-curated** merges/exclusions/fixes layered on top of the draft (e.g. "sal kosher" → "sal", dropping footnote fragments the splitter mis-parsed as ingredients). When you add a recipe with an ingredient that's a variant of an existing one, add a merge entry here rather than letting a near-duplicate canonical ingredient appear in the shopping list.
- `scripts/build-ingredients.ts` — applies the corrections and writes the real output: `data/ingredients.json` (one row per recipe ingredient, with a canonical ID) and `data/ingredientes-canonicos.json` (the controlled vocabulary: id, display name, aisle category).
- `scripts/validate-data.ts` — cross-checks every file for broken references, unknown units, and unused vocabulary entries. `npm run build-data` fails loudly if this reports errors.
- `data/conversao-unidades.json` / `data/densidade-ingredientes.json` — hand-authored unit→ml and ingredient→g/ml density tables. Only ingredients listed here get their volume measurements (xícara, colher...) converted to grams in the shopping list; everything else is summed as counted units on purpose (see `src/lib/shoppingListAggregate.ts` — grams and counted units are never silently merged).

### App structure

- `src/data/loadStaticData.ts` — imports the `data/*.json` files and builds lookup maps (by slug, by canonical ingredient id, etc.). Everything else reads through this module, never the JSON files directly.
- `src/lib/shoppingListAggregate.ts` — the correctness-critical aggregation logic (sums quantities across selected recipes, grams vs. counted-unit buckets, rounding rules). Covered by `tests/`; run `npm test` after touching it.
- `src/features/*` — one folder per screen (recipes, weeklyList, shoppingList, history, favorites), each with its own `useLocalStorageState`-backed hook. There is no backend — the weekly selection, saved shopping lists, checklist state, and favorites all live in the browser's localStorage only (no cross-device sync by design).
- Routing uses `HashRouter` (see `src/router.tsx`) specifically so GitHub Pages doesn't need a SPA-fallback trick.

### Commands

```bash
npm run dev            # local dev server
npm test                # vitest
npm run build           # tsc -b && vite build (also what CI runs)
npm run build-data      # regenerate data/*.json from receitas_ppp01p.md
```

Deployment is automatic via `.github/workflows/deploy.yml` on push to `main` (GitHub Pages, Actions-based deploy — no manual steps).
