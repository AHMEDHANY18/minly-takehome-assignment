import { Link } from "react-router-dom";

const HASHTAG_RE = /(#[\p{L}\d_]+)/gu;

/**
 * Renders text with #hashtag tokens linkified to /hashtag/:tag.
 */
export default function HashtagText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(HASHTAG_RE);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("#") && part.length > 1 ? (
          <Link
            key={`${part}-${i}`}
            to={`/hashtag/${encodeURIComponent(part.slice(1).toLowerCase())}`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
