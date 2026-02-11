import { supabase } from "../supabase";

export default function VerifyEmail({ user }) {
  async function resendVerification() {
    await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });

    alert("Verification email sent. Check your inbox 📩");
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        <div className="card">
          <h2>Email Verification Required</h2>

          <p className="text-muted" style={{ marginTop: 8 }}>
            We’ve sent a verification link to:
          </p>

          <strong>{user.email}</strong>

          <p className="text-muted" style={{ marginTop: 12 }}>
            Please verify your email to continue using Zeus Fitness.
          </p>

          <button
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={resendVerification}
          >
            Resend Verification Email
          </button>

          <p
            className="text-muted"
            style={{ marginTop: 16, fontSize: 13 }}
          >
            After verifying, refresh this page.
          </p>
        </div>
      </div>
    </div>
  );
}