import { useState } from "react";
import { supabase } from "../supabase";
import { WORKOUT_SPLITS } from "../constants/workoutSplits";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";

export default function StartWorkout({
  user,
  lastWorkout,
  workoutHistory,
  draftWorkout,
  setDraftWorkout,
  setStatsVersion,
}) {
  const [workoutType, setWorkoutType] = useState("legs");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);

  /* =========================
     VARIANT LOGIC
  ========================= */
  function getWorkoutVariant(lastWorkout, currentSplit) {
    if (!lastWorkout) return "A";
    const lastDay = lastWorkout.workout?.day;
    if (lastDay !== currentSplit) return "A";
    return lastWorkout.workout?.variant === "A" ? "B" : "A";
  }

  /* =========================
     PROGRESSIVE OVERLOAD
  ========================= */
  function getProgressiveOverloadHint(exerciseName) {
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0)
      return null;

    let best = null;

    workoutHistory.forEach((session) => {
      const exercises = session.workout?.workout;
      if (!Array.isArray(exercises)) return;

      exercises.forEach((ex) => {
        if (ex.exercise.toLowerCase() !== exerciseName.toLowerCase()) return;
        if (!Array.isArray(ex.sets)) return;

        ex.sets.forEach((set) => {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;

          if (
            !best ||
            weight > best.weight ||
            (weight === best.weight && reps > best.reps)
          ) {
            best = { weight, reps };
          }
        });
      });
    });

    return best;
  }

  /* =========================
     GENERATE WORKOUT
  ========================= */
  async function generateWorkout() {
    if (!user?.id) return;

    const variant = getWorkoutVariant(lastWorkout, workoutType);

    try {
      setMessage(null);
      setLoading(true);

      const API_URL = import.meta.env.VITE_API_URL;

      if (!API_URL) {
        throw new Error("API URL not configured");
      }

      const res = await fetch(`${API_URL}/get-workout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          workoutType,
          variant,
          level: "Beginner",
          equipment: "None",
          duration: 30,
        }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();

      if (!data?.workout) {
        throw new Error("Invalid response");
      }

      setDraftWorkout({
        day: workoutType,
        variant,
        workout: data.workout.map((ex) => ({
          exercise: ex.exercise,
          sets: Array.from({ length: Number(ex.sets) || 3 }).map(() => ({
            reps: Number(ex.reps) || 10,
            weight: 0,
          })),
        })),
      });
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Workout generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     EDIT HELPERS
  ========================= */
  function addSet(exIndex) {
    setDraftWorkout((prev) => {
      const updated = [...prev.workout];
      updated[exIndex].sets.push({ reps: 10, weight: 0 });
      return { ...prev, workout: updated };
    });
  }

  function deleteSet(exIndex, setIndex) {
    setDraftWorkout((prev) => {
      const updated = [...prev.workout];
      updated[exIndex].sets = updated[exIndex].sets.filter(
        (_, i) => i !== setIndex
      );
      return { ...prev, workout: updated };
    });
  }

  function updateSet(exIndex, setIndex, field, value) {
    setDraftWorkout((prev) => {
      const updated = [...prev.workout];
      updated[exIndex].sets[setIndex][field] = Number(value);
      return { ...prev, workout: updated };
    });
  }

  function confirmAddExercise() {
    if (!customExerciseName.trim()) return;

    setDraftWorkout((prev) => ({
      ...prev,
      workout: [
        ...prev.workout,
        {
          exercise: customExerciseName.trim(),
          sets: [{ reps: 10, weight: 0 }],
        },
      ],
    }));

    setCustomExerciseName("");
    setAddingExercise(false);
  }

  /* =========================
     SAVE WORKOUT
  ========================= */
  async function saveWorkout() {
    if (!draftWorkout) return;

    const { error } = await supabase.from("workouts").insert([
      { user_id: user.id, workout: draftWorkout },
    ]);

    if (error) return alert("Failed to save workout");

    setDraftWorkout(null);
    setStatsVersion((v) => v + 1);
    setMessage("Workout saved ✅");
    setTimeout(() => setMessage(null), 3000);
  }

  /* =========================
     UI
  ========================= */
  return (
    <>
      {message && <div className="card">{message}</div>}

      <div className="card start-workout-card">
        <div className="card-title">Start Workout</div>

        <select
          value={workoutType}
          onChange={(e) => setWorkoutType(e.target.value)}
        >
          {Object.entries(WORKOUT_SPLITS).map(([key, split]) => (
            <option key={key} value={key}>
              {split.label}
            </option>
          ))}
        </select>

        <button
          className="btn-primary"
          onClick={generateWorkout}
          disabled={loading}
        >
          {loading ? <span className="spinner"></span> : "Generate Workout"}
        </button>

        {draftWorkout && (
          <div className="card">
            <div className="card-title">
              {draftWorkout.day.toUpperCase()} Workout
            </div>

            {draftWorkout.workout.map((ex, idx) => {
              const hint = getProgressiveOverloadHint(ex.exercise);

              return (
                <div key={idx} style={{ marginBottom: 20 }}>
                  <strong
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setSelectedExercise(ex.exercise)}
                  >
                    {ex.exercise}
                  </strong>

                  {hint && (
                    <div className="text-muted" style={{ marginTop: 4 }}>
                      🔁 Last time: {hint.weight} kg × {hint.reps} reps
                      <br />
                      👉 Try +2.5 kg or +1 rep
                    </div>
                  )}

                  {ex.sets.map((set, sIdx) => (
  <div
    key={`${idx}-set-${sIdx}`}
    className="set-row"
    style={{ marginTop: 6, display: "flex", gap: 8 }}
  >
    <input
      type="number"
      placeholder="Weight (kg)"
      value={set.weight}
      onChange={(e) =>
        updateSet(idx, sIdx, "weight", e.target.value)
      }
      style={{ width: "90px" }}
    />

    <input
      type="number"
      placeholder="Reps"
      value={set.reps}
      onChange={(e) =>
        updateSet(idx, sIdx, "reps", e.target.value)
      }
      style={{ width: "70px" }}
    />

    <button onClick={() => deleteSet(idx, sIdx)}>❌</button>
  </div>
))}

                  <button onClick={() => addSet(idx)}>➕ Add Set</button>
                </div>
              );
            })}

            {!addingExercise ? (
              <button
                className="btn-primary"
                onClick={() => setAddingExercise(true)}
              >
                ➕ Add Custom Exercise
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  placeholder="Exercise name"
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                />
                <button onClick={confirmAddExercise}>Add</button>
                <button onClick={() => setAddingExercise(false)}>Cancel</button>
              </div>
            )}

            <button className="btn-primary" onClick={saveWorkout}>
              Save Workout
            </button>
          </div>
        )}

        {selectedExercise && (
          <ExerciseHistoryModal
            exerciseName={selectedExercise}
            workoutHistory={workoutHistory}
            onClose={() => setSelectedExercise(null)}
          />
        )}
      </div>
    </>
  );
}