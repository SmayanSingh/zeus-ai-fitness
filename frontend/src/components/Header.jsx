import { supabase } from "../supabase";
import { useEffect } from "react";

export default function Header({ user, profile }) {
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    }
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  // 🔁 Restore theme on load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    }
  }, []);

  if (!user) return null;

  const displayName =
    profile?.display_name ||
    user.email?.split("@")[0] ||
    "Athlete";

  return (
    <div className="header">
      <div className="header-user">
        {/* USERNAME */}
        <span className="header-username">
          {displayName}
        </span>

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* 🌙 DARK MODE */}
          <button
            type="button"
            className="btn-logout"
            onClick={toggleTheme}
            title="Toggle dark mode"
          >
            🌙
          </button>

          {/* LOGOUT */}
          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}