export function calculateStats(rows) {
  let totalExercises = 0;
  let totalSets = 0;
  let totalWeight = 0;

  rows.forEach((row) => {
    const workout = row.workout;
    if (!workout) return;

    // 🔹 AI-generated workout format
    if (Array.isArray(workout.workout)) {
      workout.workout.forEach((ex) => {
        totalExercises++;

        const sets = Number(ex.sets) || 0;
        totalSets += sets;

        // AI workouts have NO weight → skip weight
      });
    }

    // 🔹 Logged workout format (future / manual)
    if (Array.isArray(workout.loggedWorkout)) {
      workout.loggedWorkout.forEach((ex) => {
        totalExercises++;

        ex.sets?.forEach((set) => {
          totalSets++;
          totalWeight +=
            (Number(set.weight) || 0) * (Number(set.reps) || 0);
        });
      });
    }
  });

  return {
    totalExercises,
    totalSets,
    totalWeight,
  };
}