require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

/* =========================
   CORS CONFIG
========================= */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   GROQ SETUP
========================= */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("AI Fitness Backend is running");
});

/* =========================
   PROMPT BUILDER
========================= */
function buildWorkoutPrompt({ day, level, equipment, duration, variant }) {
  return `
You are a professional fitness coach AI.

Generate a workout for the following split:
SPLIT: ${day}
VARIANT: ${variant}

STRICT RULES (DO NOT BREAK THESE):
- ONLY include exercises that train the ${day} muscles
- DO NOT include exercises from other muscle groups
- If an exercise trains multiple muscles, it MUST primarily target ${day}
- If unsure, DO NOT include the exercise

Workout constraints:
- Max 5 exercises
- Beginner friendly
- Equipment: ${equipment}
- Duration: ${duration} minutes
- NO warmup
- NO cooldown
- NO explanations
- NO extra text

Return ONLY valid JSON in this format:

{
  "workout": [
    { "exercise": "", "sets": "3", "reps": "10", "rest": "60" }
  ]
}
`;
}

/* =========================
   GENERATE WORKOUT ROUTE
========================= */
app.post("/get-workout", async (req, res) => {
  try {
    const { user_id, workoutType, variant, level, equipment, duration } =
      req.body;

    if (!user_id || !workoutType || !level || !equipment || !duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const day = workoutType.toLowerCase();

    const prompt = buildWorkoutPrompt({
      day,
      variant,
      level,
      equipment,
      duration,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    const workoutPlan = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(workoutPlan.workout) || !workoutPlan.workout.length) {
      return res.status(400).json({ error: "Invalid workout generated" });
    }

    return res.json({
      day,
      variant,
      level,
      equipment,
      duration,
      workout: workoutPlan.workout,
    });
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Workout generation failed" });
  }
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});