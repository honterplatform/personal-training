import { GearIcon, ChartIcon } from "./Icons.jsx";

export default function Header({ onOpenSettings, onOpenReview }) {
  return (
    <div className="app-header">
      <div className="app-header-brand">
        <span className="brand-mark accent">LOG</span>
        <span className="app-header-divider" />
        <span className="app-header-tag">training<br />daily</span>
      </div>
      <div className="app-header-actions">
        {onOpenReview && (
          <button onClick={onOpenReview} aria-label="Weekly review" className="header-btn">
            <ChartIcon size={17} />
            <span>week</span>
          </button>
        )}
        <button onClick={onOpenSettings} aria-label="Settings" className="gear-btn">
          <GearIcon size={17} />
        </button>
      </div>
    </div>
  );
}
