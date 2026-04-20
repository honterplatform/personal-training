import { useState } from "react";
import ActivityRow from "./ActivityRow.jsx";
import ProteinRow from "./ProteinRow.jsx";

const ORDER = ["walk", "squash", "taekwondo", "strength", "protein"];

export default function Checklist({ date, entries, proteinGoal, onSave, onDelete }) {
  const [openRow, setOpenRow] = useState(null);
  const byActivity = Object.fromEntries(entries.map((e) => [e.activity, e]));

  return (
    <div>
      {ORDER.map((a) =>
        a === "protein" ? (
          <ProteinRow
            key={a}
            entry={byActivity[a]}
            goal={proteinGoal}
            open={openRow === a}
            onToggleOpen={() => setOpenRow(openRow === a ? null : a)}
            onSave={(body) => onSave(date, a, body)}
            onDelete={() => onDelete(date, a)}
          />
        ) : (
          <ActivityRow
            key={a}
            activity={a}
            entry={byActivity[a]}
            open={openRow === a}
            onToggleOpen={() => setOpenRow(openRow === a ? null : a)}
            onSave={(body) => onSave(date, a, body)}
            onDelete={() => onDelete(date, a)}
          />
        )
      )}
      <div
        style={{
          marginTop: 14,
          textAlign: "center",
          fontSize: 10,
          fontFamily: "var(--mono)",
          color: "rgba(26,23,22,0.3)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        · end of day ·
      </div>
    </div>
  );
}
