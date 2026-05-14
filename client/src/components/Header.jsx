import { GearIcon } from "./Icons.jsx";

export default function Header({ onOpenSettings }) {
  return (
    <div className="app-header">
      <div className="app-header-brand">
        <span className="brand-mark accent">LOG</span>
        <span className="app-header-divider" />
        <span className="app-header-tag">training<br />daily</span>
      </div>
      <button onClick={onOpenSettings} aria-label="Settings" className="gear-btn">
        <GearIcon size={17} />
      </button>
    </div>
  );
}
