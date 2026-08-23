import ompularLogo from "@/assets/ompular-mark.png";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useHardRefresh } from "@/hooks/useHardRefresh";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount, toast, dismissToast } = useNotifications();
  const navigate = useNavigate();
  const { canInstall, isInstalled, install } = usePWAInstall();
  const { hardRefresh, clearing } = useHardRefresh();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    void navigate({ to: "/" });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {toast && (
        <div
          className="notif-toast"
          onClick={() => {
            dismissToast();
            void navigate({ to: "/dm/$userId", params: { userId: toast.senderId } });
          }}
        >
          <div className="notif-toast-avatar">{toast.senderName[0]?.toUpperCase()}</div>
          <div className="notif-toast-body">
            <div className="notif-toast-name">💬 {toast.senderName}</div>
            <div className="notif-toast-preview">{toast.preview}</div>
          </div>
          <button
            className="notif-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
          >
            ✕
          </button>
        </div>
      )}

      <nav className="navbar">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <img src={ompularLogo} alt="Ompular" className="navbar-logo-img" />
          <span className="navbar-brand-name">ompular</span>
        </Link>

        <div className="navbar-links navbar-links-desktop">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/chat">AI Chat</Link>
              <Link to="/matches">Matches</Link>

              <Link to="/matches" className="notif-bell" title="Messages">
                <span className="notif-bell-icon">💬</span>
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </Link>

              <span className="navbar-user">👤 {user?.name}</span>

              {canInstall && (
                <button className="btn-install" onClick={install} title="Install Ompular app">
                  <span className="btn-install-icon">⬇</span>
                  Install App
                </button>
              )}
              {isInstalled && <span className="installed-badge">✓ Installed</span>}

              <button
                className="btn-refresh"
                onClick={() => void hardRefresh()}
                disabled={clearing}
                title="Clear cached data and reload"
              >
                <span className={`btn-refresh-icon ${clearing ? "spinning" : ""}`}>⟳</span>
                {clearing ? "Clearing…" : "Refresh"}
              </button>

              <button className="btn-outline-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : null}
        </div>

        <div className="navbar-mobile-right">
          {isAuthenticated && unreadCount > 0 && (
            <Link to="/matches" className="notif-bell" title="Messages" onClick={closeMenu}>
              <span className="notif-bell-icon">💬</span>
              <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </Link>
          )}

          {isAuthenticated && (
            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          )}
        </div>
      </nav>

      {isAuthenticated && menuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={closeMenu} />
          <div className="mobile-menu">
            <Link to="/dashboard" onClick={closeMenu}>
              📊 Dashboard
            </Link>
            <Link to="/chat" onClick={closeMenu}>
              🤖 AI Chat
            </Link>
            <Link to="/matches" onClick={closeMenu}>
              🔍 Matches
              {unreadCount > 0 && <span className="mobile-badge">{unreadCount}</span>}
            </Link>
            <div className="mobile-menu-divider" />
            <span className="mobile-menu-user">👤 {user?.name}</span>
            {canInstall && (
              <button
                className="mobile-menu-install"
                onClick={() => {
                  void install();
                  closeMenu();
                }}
              >
                ⬇ Install App
              </button>
            )}
            {isInstalled && (
              <span className="installed-badge" style={{ justifyContent: "center" }}>
                ✓ Installed
              </span>
            )}
            <button
              className="mobile-menu-install"
              onClick={() => {
                closeMenu();
                void hardRefresh();
              }}
              disabled={clearing}
            >
              ⟳ {clearing ? "Clearing…" : "Hard Refresh & Clear Cache"}
            </button>
            <button className="mobile-menu-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      )}
    </>
  );
}
