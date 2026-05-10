import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore } from "../store/installer";

export default function Authentication() {
  const { rootPassword, users, openSecondaryPage, removeUser, nextStep } = useInstallerStore();

  const hasSudoUser = users.some((u) => u.sudo);
  const canProceed = rootPassword.length > 0 && users.length > 0 && hasSudoUser;

  const handleNext = () => {
    if (canProceed) nextStep();
  };

  return (
    <Layout
      icon={<UserIcon />}
      title="Authentication"
      subtitle="Configure the root password and create at least one sudo user."
      footer={<Footer onNext={handleNext} nextDisabled={!canProceed} />}
    >
      {/* Root Password Section */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-title">Root Password</div>
        <div
          className={`partition-row ${rootPassword ? "" : ""}`}
          style={{ cursor: "pointer", marginBottom: 0 }}
          onClick={() => openSecondaryPage("root-password")}
        >
          <div className="user-info">
            <div className="user-avatar" style={{ background: "linear-gradient(135deg, #c42b1c, #e05b50)" }}>
              R
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>root</div>
              <div className="text-muted">
                {rootPassword ? "Password configured" : "No password set"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {rootPassword ? (
              <span className="chip success">Configured</span>
            ) : (
              <span className="chip danger">Required</span>
            )}
            <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); openSecondaryPage("root-password"); }}>
              {rootPassword ? "Change" : "Set password"}
            </button>
          </div>
        </div>

        {!rootPassword && (
          <div className="form-error" style={{ marginTop: 8 }}>Root password is required.</div>
        )}
      </div>

      {/* User Accounts Section */}
      <div>
        <div className="section-title">User Accounts</div>

        {users.length === 0 ? (
          <div className="empty-state" style={{ padding: "20px 0", textAlign: "left" }}>
            <div className="text-muted">No users created yet. At least one sudo user is required.</div>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.username} className="user-row">
              <div className="user-info">
                <div className="user-avatar">
                  {user.username[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <div className="user-name">{user.username}</div>
                  <div className="user-badges">
                    {user.sudo && <span className="chip success" style={{ fontSize: 11 }}>sudo</span>}
                    <span className="chip neutral" style={{ fontSize: 11 }}>Password set</span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => removeUser(user.username)}
                style={{ opacity: 0.8 }}
              >
                Remove
              </button>
            </div>
          ))
        )}

        {users.length > 0 && !hasSudoUser && (
          <div className="form-error" style={{ marginTop: 8 }}>
            At least one user must have sudo privileges.
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => openSecondaryPage("add-user")}
            style={{ gap: 6 }}
          >
            <PlusIcon />
            Add User Account
          </button>
        </div>
      </div>
    </Layout>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
