import { useState } from "react";
import { supabase } from "../supabase";
import { WORKOUT_SPLITS } from "../constants/workoutSplits";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

/* =========================
   SORTABLE WRAPPER
========================= */
function SortableExercise({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

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
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [addingExercise, setAddingExercise] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  /* =========================
     DELETE EXERCISE
  ========================= */
  function deleteExercise(exIndex) {
    setDraftWorkout((prev) => ({
      ...prev,
      workout: prev.workout.filter((_, i) => i !== exIndex),
    }));
  }

  /* =========================
     DRAG END HANDLER
  ========================= */
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraftWorkout((prev) => {
      const oldIndex = prev.workout.findIndex(
        (ex) => ex.exercise === active.id
      );
      const newIndex = prev.workout.findIndex(
        (ex) => ex.exercise === over.id
      );

      return {
        ...prev,
        workout: arrayMove(prev.workout, oldIndex, newIndex),
      };
    });
  }

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
        if (ex.exercise.toLowerCase() !== exerciseName.toLowerCase())
          return;
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

  function updateSet(exIndex, setIndex, field, value) {
    setDraftWorkout((prev) => {
      const updated = [...prev.workout];
      updated[exIndex].sets[setIndex][field] = Number(value);
      return { ...prev, workout: updated };
    });
  }

  /* =========================
     ADD CUSTOM EXERCISE
  ========================= */
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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draftWorkout.workout.map((ex) => ex.exercise)}
                strategy={verticalListSortingStrategy}
              >
                {draftWorkout.workout.map((ex, idx) => {
                  const hint = getProgressiveOverloadHint(ex.exercise);

                  return (
                    <SortableExercise key={ex.exercise} id={ex.exercise}>
                      {({ attributes, listeners }) => (
                        <div style={{ marginBottom: 20 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8
                            }}
                          >
                            <div
                              {...attributes}
                              {...listeners}
                              style={{
                                cursor: "grab",
                                padding: "4px 8px",
                                background: "#222",
                                borderRadius: "6px"
                              }}
                            >
                              ☰
                            </div>

                            <strong
                              style={{ flex: 1, cursor: "pointer" }}
                              onClick={() => setSelectedExercise(ex.exercise)}
                            >
                              {ex.exercise}
                            </strong>

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
                    </SortableExercise>
                  );
                })}
              </SortableContext>
            </DndContext>

            {/* CUSTOM EXERCISE */}
            <div style={{ marginTop: 20 }}>
              {!addingExercise ? (
                <button onClick={() => setAddingExercise(true)}>
                  ➕ Add Custom Exercise
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="Exercise name"
                    value={customExerciseName}
                    onChange={(e) =>
                      setCustomExerciseName(e.target.value)
                    }
                  />
                  <button onClick={confirmAddExercise}>Add</button>
                  <button
                    onClick={() => setAddingExercise(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={saveWorkout}
              style={{ marginTop: 20 }}
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