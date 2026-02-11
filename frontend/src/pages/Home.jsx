import { supabase } from "../supabase";
import { useEffect, useState } from "react";
import { calculateStats } from "../utils/stats";
import { calculateDayStreak } from "../utils/streak";

export default function Home({ user, profile, statsVersion }) {
  /* =========================
     AUTH STATE (LOGGED OUT)
  ========================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [streak, setStreak] = useState(0);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMessage(error.message);
    setLoading(false);
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) setMessage(error.message);
    else setMessage("Check your email to verify your account.");

    setLoading(false);
  }

  /* =========================
     STATS
  ========================= */
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      const { data, error } = await supabase
        .from("workouts")
        .select("workout")
        .eq("user_id", user.id);

      if (error) {
        console.error("Stats fetch error:", error);
        return;
      }

      const workoutJsons = data.map((row) => row.workout);
      setStats(calculateStats(workoutJsons));

      const streakValue = calculateDayStreak(data);
      setStreak(streakValue);
    }

    fetchStats();
  }, [user, statsVersion]); // ✅ THIS NOW WORKS

  /* =========================
     LOGGED OUT UI
  ========================= */
  if (!user) {
    return (
      <div className="auth-wrapper">
      <div className="card auth-card">
        <h2>Zeus Fitness</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn-primary" onClick={signIn} disabled={loading}>
          Sign In
        </button>

        <button className="btn-primary" onClick={signUp} disabled={loading}>
          Sign Up
        </button>

        {message && <p className="text-muted">{message}</p>}
      </div>
      </div>
    );
  }

  const displayName =
    profile?.display_name ||
    user.email?.split("@")[0] ||
    "Athlete";

  return (
    <>


      <div className="card">
        <h2>Welcome back, {displayName} 👋</h2>


        <div className="card">
          <div className="card-title">Streak</div>

          <div className="streak-container">
            {/* <span className="streak-fire-wrapper"> */}
            <span className="streak-fire">🔥</span>
            
            <span className="streak-count">
              {streak} day{streak === 1 ? "" : "s"}
            </span>
          </div>

          <p className="text-muted" style={{ marginTop: 6 }}>
            Up to 2 rest days per week allowed
          </p>
        </div>

        <div className="card minimal-manual">
          <div className="manual-header">
            <h3>Getting Started</h3>
          </div>

          <div className="manual-steps">
            <div className="manual-step">
              <span className="step-number">1</span>
              <p>
                Go to <strong>Workout</strong> and generate your AI workout.
              </p>
            </div>

            <div className="manual-step">
              <span className="step-number">2</span>
              <p>Log weights and reps after completing exercises.</p>
            </div>

            <div className="manual-step">
              <span className="step-number">3</span>
              <p>
                Track progress in <strong>History</strong> and upcoming{" "}
                <strong>Stats</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Your Stats</div>

        <p className="text-muted" style={{ marginTop: 8 }}>
          🚧 Stats coming soon
        </p>

        <p className="text-muted" style={{ fontSize: 14 }}>
          We’re working on accurate tracking and insights.
        </p>
      </div>
    </>
  );
}