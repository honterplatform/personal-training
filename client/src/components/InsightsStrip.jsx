import { useState } from "react";
import { useStore } from "../lib/store.jsx";

const CATEGORY_ORDER = ["warnings", "current", "patterns"];
const CATEGORY_LABEL = {
  current:  "now",
  patterns: "pattern",
  warnings: "watch",
};

export default function InsightsStrip() {
  const { insights } = useStore();
  const [expanded, setExpanded] = useState(false);

  const all = CATEGORY_ORDER.flatMap((cat) =>
    (insights[cat] || []).map((text) => ({ cat, text }))
  );
  if (all.length === 0) return null;

  const visible = expanded ? all : all.slice(0, 2);
  const hidden = all.length - visible.length;

  return (
    <section className="insights-strip">
      <ul className="insights-list">
        {visible.map((it, i) => (
          <li key={i} className={`insight-row ${it.cat}`}>
            <span className="insight-tag">{CATEGORY_LABEL[it.cat]}</span>
            <span className="insight-text">{it.text}</span>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button className="insights-more" onClick={() => setExpanded(true)}>
          + {hidden} more
        </button>
      )}
      {expanded && all.length > 2 && (
        <button className="insights-more" onClick={() => setExpanded(false)}>
          show less
        </button>
      )}
    </section>
  );
}
