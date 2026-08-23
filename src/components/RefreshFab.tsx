import { useHardRefresh } from "@/hooks/useHardRefresh";

export default function RefreshFab() {
  const { hardRefresh, clearing } = useHardRefresh();

  return (
    <button
      className="refresh-fab"
      onClick={() => void hardRefresh()}
      disabled={clearing}
      aria-label="Hard refresh and clear cached data"
      title="Hard refresh & clear cache"
    >
      <span className={`btn-refresh-icon ${clearing ? "spinning" : ""}`}>⟳</span>
      <span className="refresh-fab-label">{clearing ? "Clearing…" : "Refresh"}</span>
    </button>
  );
}
