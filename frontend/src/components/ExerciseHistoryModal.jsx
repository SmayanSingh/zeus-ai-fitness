import PropTypes from "prop-types";

export default function ExerciseHistoryModal({
    exerciseName,
    workoutHistory,
    onClose,
}) {
    const sessions = [];

    workoutHistory.forEach((session) => {
        const exercises = session.workout?.workout;
        if (!Array.isArray(exercises)) return;

        exercises.forEach((ex) => {
            if (ex.exercise.toLowerCase() !== exerciseName.toLowerCase()) return;

            // 🔒 HARD SAFETY CHECK
            if (!Array.isArray(ex.sets)) return;

            ex.sets.forEach((set) => {
                sessions.push({
                    date: new Date(session.created_at).toLocaleDateString("en-IN"),
                    reps: Number(set.reps) || 0,
                    weight: Number(set.weight) || 0,
                });
            });
        });
    });
    sessions.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );
    const lastFive = sessions.slice(-5);

    const pr = sessions.reduce(
        (best, s) =>
            s.weight > best.weight ||
                (s.weight === best.weight && s.reps > best.reps)
                ? s
                : best,
        { weight: 0, reps: 0 }
    );

    return (
        <div className="modal-backdrop">
            <div className="card modal">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div className="card-title">{exerciseName} History</div>
                    <button onClick={onClose}>❌</button>
                </div>

                {lastFive.length === 0 ? (
                    <p className="text-muted">No history yet.</p>
                ) : (
                    <>
                        <h4>Last 5 Sessions</h4>
                        <ul>
                            {lastFive.map((s, i) => (
                                <li key={i}>
                                    {s.date} — {s.weight} kg × {s.reps} reps
                                </li>
                            ))}
                        </ul>

                        <h4 style={{ marginTop: 10 }}>
                            🏆 PR: {pr.weight} kg × {pr.reps} reps
                        </h4>
                    </>
                )}
            </div>
        </div>
    );


}