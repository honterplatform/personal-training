import { GearIcon } from "./Icons.jsx";

export default function Header({ onOpenSettings }) {
  return (
    <div
      className="responsive-pad"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 18,
        paddingBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: -1,
            color: "#1a1716",
            paddingRight: 2,
          }}
        >
          LOG
        </div>
        <div style={{ width: 1, height: 22, background: "rgba(26,23,22,0.15)" }} />
        <div
          style={{
            fontSize: 9.5,
            color: "rgba(26,23,22,0.5)",
            fontFamily: "var(--mono)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          training<br />daily
        </div>
      </div>
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(26,23,22,0.06)",
          color: "rgba(26,23,22,0.6)",
        }}
      >
        <GearIcon size={17} />
      </button>
    </div>
  );
}
