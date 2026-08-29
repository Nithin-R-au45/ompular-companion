import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Ompular" },
      { name: "description", content: "Ompular admin dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAuthenticated, loading } = useAuth();
  const { isAdmin, adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, age, bio, interests, is_verified, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: authLogs } = useQuery({
    queryKey: ["admin-auth-logs"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auth_event_logs")
        .select("id, event_type, outcome, email, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (loading || adminLoading) {
    return (
      <div className="page-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!isAdmin) {
    return (
      <div className="page-center">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1>🔒 Access Denied</h1>
          <p>This area is restricted to admins.</p>
          <Link to="/dashboard" className="btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toDateString();
  const joinedToday = profiles?.filter((p) => new Date(p.created_at).toDateString() === today).length ?? 0;
  const failedLogins = authLogs?.filter((l) => l.outcome === "failure").length ?? 0;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Manage users and monitor auth activity</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{profiles?.length ?? 0}</div>
          <div className="admin-stat-label">Total Users</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{joinedToday}</div>
          <div className="admin-stat-label">Joined Today</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{failedLogins}</div>
          <div className="admin-stat-label">Recent Auth Failures</div>
        </div>
      </div>

      <section className="admin-section">
        <h2>👥 Users</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Age</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((p) => (
                <tr key={p.id}>
                  <td>{p.name || "—"}</td>
                  <td>{p.email}</td>
                  <td>{p.age || "—"}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>📋 Recent Auth Events</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Outcome</th>
                <th>Email</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {authLogs?.map((l) => (
                <tr key={l.id} className={l.outcome === "failure" ? "admin-row-failure" : ""}>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                  <td>{l.event_type}</td>
                  <td>{l.outcome === "failure" ? "❌ failure" : "✅ success"}</td>
                  <td>{l.email ?? "—"}</td>
                  <td>{l.error_message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
