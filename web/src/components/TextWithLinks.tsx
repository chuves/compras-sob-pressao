import { Fragment } from "react";
import { Link } from "react-router-dom";
import { recipesByGithubAnchor } from "../data/loadStaticData";

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

const linkClass = "text-emerald-700 underline dark:text-emerald-400";

/** Renders freeform text that may contain markdown links: internal "#anchor"
 * links become in-app <Link>s to the related recipe, external URLs open in
 * a new tab. Plain text passes through unchanged. */
export function TextWithLinks({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [, label, target] = match;

    if (target.startsWith("#")) {
      const related = recipesByGithubAnchor.get(target.slice(1));
      parts.push(
        related ? (
          <Link key={key++} to={`/receita/${related.slug}`} className={linkClass}>
            {label}
          </Link>
        ) : (
          label
        ),
      );
    } else {
      parts.push(
        <a key={key++} href={target} target="_blank" rel="noreferrer" className={linkClass}>
          {label}
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <Fragment>{parts}</Fragment>;
}
