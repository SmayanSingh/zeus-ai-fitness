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
            Sign Up(new user)
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
            <h3>Train Smarter. Train Elite.</h3>
            <p className="manual-subtitle">
              Built for precision. Designed for progression.
            </p>
          </div>

          <div className="manual-steps">
            <div className="manual-step">
              <span className="step-number">01</span>
              <div>
                <h4>Generate</h4>
                <p>
                  Go to <strong>Start Workout</strong> and let Zeus build your session
                  instantly.
                </p>
              </div>
            </div>

            <div className="manual-step">
              <span className="step-number">02</span>
              <div>
                <h4>Refine</h4>
                <p>
                  Add custom exercises, adjust sets, reorder movements with drag and
                  drop, and tailor the workout to your standard.
                </p>
              </div>
            </div>

            <div className="manual-step">
              <span className="step-number">03</span>
              <div>
                <h4>Execute & Track</h4>
                <p>
                  Save your workout and monitor progress inside{" "}
                  <strong>History</strong>. Every session compounds.
                </p>
              </div>
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