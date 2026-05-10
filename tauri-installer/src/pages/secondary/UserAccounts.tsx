import Layout from "../../components/Layout";
import { useInstallerStore } from "../../store/installer";

export default function UserAccounts() {
  const { users, removeUser, openSecondaryPage, closeSecondaryPage } = useInstallerStore();

  return (
    <Layout
      icon={<UsersIcon />}
      title="User Accounts"
      subtitle="Manage user accounts for the installed system."
      step={9}
      footer={
        <>
          <div className="footer-left">
            <button
              className="btn btn-secondary"
              onClick={() => openSecondaryPage("add-user")}
            >
              <PlusIcon /> Add User
            </button>
          </div>
          <div className="footer-right">
            <button className="btn btn-primary" onClick={closeSecondaryPage}>Done</button>
          </div>
        </>
      }
    >
      {users.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" style={{ fontSize: 48 }}>👤</span>
          <div className="empty-state-text" style={{ color: "var(--text-secondary)" }}>
            No users created yet.
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => openSecondaryPage("add-user")}
          >
            Create First User
          </button>
        </div>
      ) : (
        <div>
          {users.map((user) => (
            <div key={user.username} className="user-row">
              <div className="user-info">
                <div className="user-avatar">
                  {user.username[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <div className="user-name">{user.username}</div>
                  <div className="user-badges">
                    {user.sudo && (
                      <span className="chip success" style={{ fontSize: 11 }}>sudo</span>
                    )}
                    <span className="chip neutral" style={{ fontSize: 11 }}>Password set</span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => removeUser(user.username)}
              >
                Remove
              </button>
            </div>
          ))}

          {!users.some((u) => u.sudo) && (
            <div className="form-error" style={{ marginTop: 10 }}>
              At least one user must have sudo privileges to proceed.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
