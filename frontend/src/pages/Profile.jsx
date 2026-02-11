import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Profile({ user, profile, setProfile }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Sync name when profile loads
  useEffect(() => {
    if (profile?.display_name) {
      setName(profile.display_name);
    }
  }, [profile]);

  async function saveName() {
    if (!name.trim() || saving) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    // Instant UI update
    setProfile((prev) => ({
      ...prev,
      display_name: name.trim(),
    }));

    setSaving(false);
    setEditing(false);
  }

  return (
    <>
      {/* =========================
          PROFILE
      ========================= */}
      <div className="card">
        <div className="card-title">Profile</div>

        {/* VIEW MODE */}
        {!editing && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <strong style={{ fontSize: 16 }}>
              {profile?.display_name || "—"}
            </strong>

            <button
              type="button"
              className="btn-edit"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          </div>
        )}

        {/* EDIT MODE */}
        {editing && (
          <div style={{ marginTop: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              style={{ marginBottom: 8 }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-primary"
                onClick={saveName}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  setName(profile?.display_name || "");
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </button>

            </div>

          </div>

        )}
        <p className="text-muted" style={{ marginTop: 8 }}>
          👤 Member since:{" "}
          <strong>
            {new Date(user.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </strong>
        </p>
      </div>

      {/* =========================
          STATS
      ========================= */}
      <div className="card">
        <div className="card-title">Your Stats</div>


        <p className="text-muted" style={{ marginTop: 6 }}>
          🚧 Stats coming soon
        </p>

        <p className="text-muted" style={{ fontSize: 14 }}>
          We’re working on accurate tracking and insights.
        </p>
      </div>
    </>
  );
}