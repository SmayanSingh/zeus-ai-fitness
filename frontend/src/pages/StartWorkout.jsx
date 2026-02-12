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
    if (!Array.isArray(workoutHistory)) return null;

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

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

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
      setMessage("⚠️ Workout generation failed.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     SET MANAGEMENT
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

  function moveSet(exIndex, setIndex, direction) {
    setDraftWorkout((prev) => {
      const updated = [...prev.workout];
      const sets = [...updated[exIndex].sets];

      const newIndex =
        direction === "up" ? setIndex - 1 : setIndex + 1;

      if (newIndex < 0 || newIndex >= sets.length) return prev;

      [sets[setIndex], sets[newIndex]] = [
        sets[newIndex],
        sets[setIndex],
      ];

      updated[exIndex].sets = sets;
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

  /* =========================
     EXERCISE MANAGEMENT
  ========================= */
  function deleteExercise(exIndex) {
    setDraftWorkout((prev) => ({
      ...prev,
      workout: prev.workout.filter((_, i) => i !== exIndex),
    }));
  }

  function moveExercise(exIndex, direction) {
    setDraftWorkout((prev) => {
      const updated = [...prev.workout];

      const newIndex =
        direction === "up" ? exIndex - 1 : exIndex + 1;

      if (newIndex < 0 || newIndex >= updated.length) return prev;

      [updated[exIndex], updated[newIndex]] = [
        updated[newIndex],
        updated[exIndex],
      ];

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
          {loading ? "Generating..." : "Generate Workout"}
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
                  <div style={{ display: "flex", gap: 6 }}>
                    <strong
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelectedExercise(ex.exercise)
                      }
                    >
                      {ex.exercise}
                    </strong>

                    <button
                      disabled={idx === 0}
                      onClick={() => moveExercise(idx, "up")}
                    >
                      ⬆
                    </button>

                    <button
                      disabled={
                        idx === draftWorkout.workout.length - 1
                      }
                      onClick={() => moveExercise(idx, "down")}
                    >
                      ⬇
                    </button>

                    <button onClick={() => deleteExercise(idx)}>
                      🗑
                    </button>
                  </div>

                  {hint && (
                    <div className="text-muted">
                      🔁 Last: {hint.weight}kg × {hint.reps}
                    </div>
                  )}

                  {ex.sets.map((set, sIdx) => (
                    <div
                      key={`${idx}-${sIdx}`}
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      <input
                        type="number"
                        value={set.weight}
                        placeholder="kg"
                        onChange={(e) =>
                          updateSet(
                            idx,
                            sIdx,
                            "weight",
                            e.target.value
                          )
                        }
                      />

                      <input
                        type="number"
                        value={set.reps}
                        placeholder="reps"
                        onChange={(e) =>
                          updateSet(
                            idx,
                            sIdx,
                            "reps",
                            e.target.value
                          )
                        }
                      />

                      <button
                        disabled={sIdx === 0}
                        onClick={() =>
                          moveSet(idx, sIdx, "up")
                        }
                      >
                        ⬆
                      </button>

                      <button
                        disabled={
                          sIdx === ex.sets.length - 1
                        }
                        onClick={() =>
                          moveSet(idx, sIdx, "down")
                        }
                      >
                        ⬇
                      </button>

                      <button
                        onClick={() =>
                          deleteSet(idx, sIdx)
                        }
                      >
                        ❌
                      </button>
                    </div>
                  ))}

                  <button onClick={() => addSet(idx)}>
                    ➕ Add Set
                  </button>
                </div>
              );
            })}

            <button
              className="btn-primary"
              onClick={saveWorkout}
            >
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