import { useState } from "react";
import Layout from "../../components/Layout";
import { useInstallerStore } from "../../store/installer";

export default function RootPassword() {
  const { rootPassword, setRootPassword, closeSecondaryPage } = useInstallerStore();

  const [password, setPassword] = useState(rootPassword);
  const [confirm, setConfirm] = useState(rootPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const handleSave = () => {
    const errs: typeof errors = {};
    if (password.length < 1) errs.password = "Password cannot be empty.";
    if (password !== confirm) errs.confirm = "Passwords do not match.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setRootPassword(password);
    closeSecondaryPage();
  };

  const strength = getStrength(password);

  return (
    <Layout
      icon={<KeyIcon />}
      title="Root Password"
      subtitle="Set the password for the root superuser account."
      step={9}
      footer={
        <>
          <div className="footer-left" />
          <div className="footer-right">
            <button className="btn btn-secondary" onClick={closeSecondaryPage}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!password || password !== confirm}>
              Save Password
            </button>
          </div>
        </>
      }
    >
      <div className="form-group">
        <div className="form-label">Password</div>
        <div className="password-wrapper">
          <input
            className={`form-input ${errors.password ? "error" : ""}`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: undefined })); }}
            placeholder="Enter root password"
            autoFocus
            style={{ paddingRight: 42 }}
          />
          <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {errors.password && <div className="form-error">{errors.password}</div>}

        {password && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  width: `${strength.pct}%`,
                  background: strength.color,
                  transition: "width 0.3s, background 0.3s",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <div className="form-label">Confirm Password</div>
        <div className="password-wrapper">
          <input
            className={`form-input ${errors.confirm ? "error" : ""}`}
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((er) => ({ ...er, confirm: undefined })); }}
            placeholder="Repeat root password"
            style={{ paddingRight: 42 }}
          />
          <button className="password-toggle" type="button" onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {errors.confirm && <div className="form-error">{errors.confirm}</div>}
        {confirm && !errors.confirm && password === confirm && (
          <div className="form-hint" style={{ color: "var(--success)" }}>✓ Passwords match</div>
        )}
      </div>

      <div
        style={{
          padding: "12px 14px",
          background: "var(--surface)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        The root password grants full unrestricted access to the system. Use a strong, unique password and store it securely.
      </div>
    </Layout>
  );
}

function getStrength(pw: string): { pct: number; label: string; color: string } {
  if (pw.length === 0) return { pct: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { pct: 25, label: "Weak", color: "#c42b1c" };
  if (score <= 2) return { pct: 50, label: "Fair", color: "#e07b00" };
  if (score <= 3) return { pct: 75, label: "Good", color: "#0067c0" };
  return { pct: 100, label: "Strong", color: "#107c10" };
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
