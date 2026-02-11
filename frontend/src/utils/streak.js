function getWeekKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();

  const firstThursday = new Date(year, 0, 4);
  const week =
    Math.ceil(
      ((d - firstThursday) / 86400000 + firstThursday.getDay() + 1) / 7
    );

  return `${year}-W${week}`;
}

export function calculateDayStreak(workoutHistory) {
  if (!workoutHistory || workoutHistory.length === 0) return 0;

  // Normalize workout days
  const workoutDays = new Set(
    workoutHistory.map(w =>
      new Date(w.created_at).toDateString()
    )
  );

  const restDaysPerWeek = {};
  let streak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk backwards day by day
  for (let i = 0; i < 365; i++) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() - i);

    const dayKey = currentDay.toDateString();
    const weekKey = getWeekKey(currentDay);

    if (!restDaysPerWeek[weekKey]) {
      restDaysPerWeek[weekKey] = 0;
    }

    if (workoutDays.has(dayKey)) {
      streak++; // ✅ workout day
    } else {
      restDaysPerWeek[weekKey]++; // 💤 rest day

      if (restDaysPerWeek[weekKey] > 2) {
        break; // ❌ streak broken
      }
    }
  }

  return streak;
}