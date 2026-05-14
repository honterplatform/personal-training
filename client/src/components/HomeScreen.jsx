import { useStore } from "../lib/store.jsx";

export default function HomeScreen() {
  const { user, trackers, weekEntries, signOut } = useStore();

  return (
    <div className="app-shell">
      <div className="shell-inner">
        <div className="placeholder-home">
          <div className="brand-mark accent">LOG</div>
          <div className="placeholder-tag">signed in · full UI coming next phase</div>

          <section className="placeholder-card">
            <div className="placeholder-label">account</div>
            <div>{user?.email}</div>
            {user?.displayName ? <div>{user.displayName}</div> : null}
          </section>

          <section className="placeholder-card">
            <div className="placeholder-label">demographics</div>
            <div>weight: {fmt(user?.demographics?.weightKg)} kg</div>
            <div>height: {fmt(user?.demographics?.heightCm)} cm</div>
            <div>sex: {user?.demographics?.sex ?? "—"}</div>
            <div>age: {user?.demographics?.age ?? "—"}</div>
            <div>fitness: {user?.demographics?.fitnessLevel ?? "—"}</div>
          </section>

          <section className="placeholder-card">
            <div className="placeholder-label">this week</div>
            <div>trackers: {trackers.length}</div>
            <div>entries this week: {weekEntries.length}</div>
            <div>
              kcal burned: {weekEntries.reduce((s, e) => s + (e.caloriesBurned ?? 0), 0)}
            </div>
          </section>

          <button onClick={signOut} className="logout-btn">
            log out
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(n) {
  if (n == null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
