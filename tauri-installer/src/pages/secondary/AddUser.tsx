import { useState } from "react";
import Layout from "../../components/Layout";
import { useInstallerStore } from "../../store/installer";

const USERNAME_RE = /^[a-z_][a-z0-9_-]{0,30}$/;

export default function AddUser() {
  const { addUser, closeSecondaryPage, openSecondaryPage, users } = useInstallerStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sudo, setSudo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirm?: string;
  }>({});

  const handleSave = () => {
    const errs: typeof errors = {};
    if (!username) {
      errs.username = "Username is required.";
    } else if (!USERNAME_RE.test(username)) {
      errs.username = "Username must be lowercase letters, digits, - or _. Must start with a letter or _.";
    } else if (users.some((u) => u.username === username)) {
      errs.username = `User "${username}" already exists.`;
    }
    if (!password) errs.password = "Password cannot be empty.";
    if (password !== confirm) errs.confirm = "Passwords do not match.";

    if (Object.keys(errs).length) { setErrors(errs); return; }

    addUser({ username, password, sudo });
    openSecondaryPage("user-accounts");
  };

  return (
    <Layout
      icon={<AddUserIcon />}
      title="Add User Account"
      subtitle="Create a new user for the installed system."
      step={9}
      footer={
        <>
          <div className="footer-left" />
          <div className="footer-right">
            <button className="btn btn-secondary" onClick={() => openSecondaryPage("user-accounts")}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!username || !password || password !== confirm}
            >
              Add User
            </button>
          </div>
        </>
      }
    >
      <div className="form-group">
        <div className="form-label">Username</div>
        <input
          className={`form-input ${errors.username ? "error" : ""}`}
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value.toLowerCase()); setErrors((er) => ({ ...er, username: undefined })); }}
          placeholder="e.g. johndoe"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        {errors.username ? (
          <div className="form-error">{errors.username}</div>
        ) : (
          <div className="form-hint">Lowercase letters, digits, hyphens, underscores. Must start with a letter or _.</div>
        )}
      </div>

      <div className="form-group">
        <div className="form-label">Password</div>
        <div className="password-wrapper">
          <input
            className={`form-input ${errors.password ? "error" : ""}`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: undefined })); }}
            placeholder="User password"
            style={{ paddingRight: 42 }}
          />
          <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {errors.password && <div className="form-error">{errors.password}</div>}
      </div>

      <div className="form-group">
        <div className="form-label">Confirm Password</div>
        <div className="password-wrapper">
          <input
            className={`form-input ${errors.confirm ? "error" : ""}`}
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((er) => ({ ...er, confirm: undefined })); }}
            placeholder="Repeat password"
            style={{ paddingRight: 42 }}
          />
        </div>
        {errors.confirm ? (
          <div className="form-error">{errors.confirm}</div>
        ) : confirm && password === confirm ? (
          <div className="form-hint" style={{ color: "var(--success)" }}>✓ Passwords match</div>
        ) : null}
      </div>

      {/* Sudo toggle */}
      <div style={{ paddingTop: 8 }}>
        <div className="toggle-row" style={{ borderBottom: "none", paddingTop: 8 }}>
          <div className="toggle-label">
            <span className="toggle-label-text">Administrator (sudo) privileges</span>
            <span className="toggle-label-sub">
              Allows this user to run commands as root with <code>sudo</code>.
            </span>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={sudo} onChange={(e) => setSudo(e.target.checked)} />
            <div className="toggle-track" />
          </label>
        </div>
      </div>

      {sudo && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "var(--chip-bg)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--chip-text)",
            border: "1px solid var(--border)",
          }}
        >
          This user will be added to the <code>wheel</code> group and configured in sudoers.
        </div>
      )}
    </Layout>
  );
}

function AddUserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
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
