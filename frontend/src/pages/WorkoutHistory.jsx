import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function WorkoutHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openSplit, setOpenSplit] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPRs, setShowPRs] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);

    const { data } = await supabase
      .from("workouts")
      .select("*")
      .order("created_at", { ascending: false });

    setHistory(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  /* =========================
     PERSONAL RECORDS
  ========================= */
  function calculatePRs(workouts) {
    const prs = {};

    workouts.forEach((session) => {
      session.workout?.workout?.forEach((exercise) => {
        const name = exercise.exercise;

        if (Array.isArray(exercise.sets)) {
          exercise.sets.forEach((set) => {
            const weight = Number(set.weight) || 0;

            if (!prs[name] || weight > prs[name].weight) {
              prs[name] = {
                exercise: name,
                weight,
                reps: set.reps,
              };
            }
          });
        }
      });
    });

    return prs;
  }

  const prs = calculatePRs(history);

  /* =========================
     EXPORT CSV
  ========================= */
  function exportToCSV() {
    if (!history.length) {
      alert("No workout history to export");
      return;
    }

    const rows = [
      ["Date", "Split", "Exercise", "Set", "Reps", "Weight (kg)"],
    ];

    history.forEach((h) => {
      const date = new Date(h.created_at).toLocaleDateString("en-IN");
      const split = h.workout?.day || "";

      h.workout?.workout?.forEach((ex) => {
        if (Array.isArray(ex.sets)) {
          ex.sets.forEach((set, index) => {
            rows.push([
              date,
              split,
              ex.exercise,
              index + 1,
              set.reps ?? "",
              set.weight ?? "",
            ]);
          });
        }
      });
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "zeus-fitness-workout-history.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  /* =========================
     GROUP BY SPLIT
  ========================= */
  const groupedBySplit = history.reduce((acc, item) => {
    const split = item.workout?.day?.toLowerCase() || "other";
    if (!acc[split]) acc[split] = [];
    acc[split].push(item);
    return acc;
  }, {});

  /* =========================
     UI STATES
  ========================= */
  if (loading) {
    return (
      <div className="card">
        <p className="text-muted">Loading workout history…</p>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="card">
        <p className="text-muted">No workouts recorded yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* =========================
          PERSONAL RECORDS
      ========================= */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowPRs(!showPRs)}
        >
          <div className="card-title">🏆 Personal Records</div>
          <span>{showPRs ? "▲" : "▼"}</span>
        </div>

        {showPRs && (
          <div style={{ marginTop: 12 }}>
            {Object.keys(prs).length === 0 && (
              <p className="text-muted">No PRs yet. Start lifting 🚀</p>
            )}

            {Object.values(prs).map((pr) => (
              <div key={pr.exercise} className="exercise-card">
                <strong>{pr.exercise}</strong>
                <div className="text-muted">
                  {pr.weight} kg × {pr.reps} reps
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================
          WORKOUT HISTORY
      ========================= */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="card-title">Workout History</div>
          <span>{showHistory ? "▲" : "▼"}</span>
        </div>

        {showHistory && (
          <>
            <button
              className="btn-primary"
              style={{ marginTop: 10 }}
              onClick={exportToCSV}
            >
              Export CSV
            </button>

            <div style={{ marginTop: 12 }}>
              {Object.entries(groupedBySplit).map(([split, workouts]) => {
                const isOpen = openSplit === split;

                return (
                  <div key={split} className="exercise-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setOpenSplit(isOpen ? null : split)
                      }
                    >
                      <strong>{split}</strong>
                      <span>{isOpen ? "▲" : "▼"}</span>
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: 10 }}>
                        {workouts.map((w) => (
                          <div key={w.id} style={{ marginBottom: 12 }}>
                            <div className="history-date">
                              {new Date(w.created_at).toLocaleDateString(
                                "en-IN",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </div>

                            <ul>
                              {w.workout?.workout?.map((ex, i) => (
                                <li key={i}>
                                  <strong>{ex.exercise}</strong>
                                  {Array.isArray(ex.sets) && (
                                    <ul>
                                      {ex.sets.map((s, j) => (
                                        <li key={j}>
                                          {s.reps} reps @ {s.weight} kg
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}