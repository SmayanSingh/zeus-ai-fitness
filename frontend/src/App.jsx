import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";

import Header from "./components/Header";
import TopTabs from "./components/TopTabs";
import Footer from "./components/footer";

import Home from "./pages/Home";
import StartWorkout from "./pages/StartWorkout";
import WorkoutHistory from "./pages/WorkoutHistory";
import Profile from "./pages/Profile";

import "./App.css";

/* =========================
   APP LAYOUT (LOGGED IN)
========================= */
function AppLayout({
  user,
  profile,
  setProfile,
  statsVersion,
  setStatsVersion,
  lastWorkout,
  workoutHistory,
  draftWorkout,
  setDraftWorkout,
}) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <div className="app-container">
        <Header user={user} profile={profile} />
        <TopTabs />

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home
                    user={user}
                    profile={profile}
                    statsVersion={statsVersion}
                  />
                </PageTransition>
              }
            />

            <Route
              path="/workout"
              element={
                <PageTransition>
                  <StartWorkout
                    user={user}
                    lastWorkout={lastWorkout}
                    workoutHistory={workoutHistory}
                    draftWorkout={draftWorkout}
                    setDraftWorkout={setDraftWorkout}
                    setStatsVersion={setStatsVersion}
                  />
                </PageTransition>
              }
            />

            <Route
              path="/history"
              element={
                <PageTransition>
                  <WorkoutHistory user={user} />
                </PageTransition>
              }
            />

            <Route
              path="/profile"
              element={
                <PageTransition>
                  <Profile
                    user={user}
                    profile={profile}
                    setProfile={setProfile}
                  />
                </PageTransition>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        {/* ✅ Footer sits naturally after page content */}
        <Footer />
      </div>
    </div>
  );
}

/* =========================
   ROOT APP
========================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [statsVersion, setStatsVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  const [lastWorkout, setLastWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [draftWorkout, setDraftWorkout] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!mounted) return;
      setUser(sessionUser);

      if (!sessionUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      const { data: historyData } = await supabase
        .from("workouts")
        .select("workout, created_at")
        .eq("user_id", sessionUser.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      setProfile(profileData ?? null);
      setWorkoutHistory(historyData || []);
      setLastWorkout(historyData?.[0] ?? null);
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }

  return (
    <BrowserRouter>
      {!user ? (
        <>
          <Routes>
            <Route path="*" element={<Home user={null} />} />
          </Routes>

          {/* ✅ Footer visible even when logged out */}
          <Footer />
        </>
      ) : (
        <AppLayout
          user={user}
          profile={profile}
          setProfile={setProfile}
          statsVersion={statsVersion}
          setStatsVersion={setStatsVersion}
          lastWorkout={lastWorkout}
          workoutHistory={workoutHistory}
          draftWorkout={draftWorkout}
          setDraftWorkout={setDraftWorkout}
        />
      )}
    </BrowserRouter>
  );
}