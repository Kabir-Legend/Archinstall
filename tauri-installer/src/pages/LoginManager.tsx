import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore, LoginManager as LM } from "../store/installer";

const LOGIN_MANAGERS: { id: LM; label: string; description: string; recommended?: string }[] = [
  {
    id: "sddm",
    label: "SDDM",
    description: "Simple Desktop Display Manager. Recommended for KDE Plasma. Modern, themeable, and Wayland-ready.",
    recommended: "KDE Plasma",
  },
  {
    id: "gdm",
    label: "GDM",
    description: "GNOME Display Manager. Recommended for GNOME. Tight integration with GNOME Shell and accessibility tools.",
    recommended: "GNOME",
  },
  {
    id: "ly",
    label: "ly",
    description: "Minimal TUI display manager. Lightweight, terminal-based, works with any desktop environment.",
  },
  {
    id: "none",
    label: "None",
    description: "No display manager. Log in from TTY and start your session manually with startx or similar.",
  },
];

export default function LoginManager() {
  const { loginManager, setLoginManager, desktopEnvironments, nextStep } = useInstallerStore();

  return (
    <Layout
      icon={<LockIcon />}
      title="Login Manager"
      subtitle="Select the display manager that handles graphical login."
      footer={<Footer onNext={nextStep} />}
    >
      <div className="radio-cards">
        {LOGIN_MANAGERS.map((lm) => {
          const isRecommended =
            lm.recommended === "KDE Plasma"
              ? desktopEnvironments.includes("kde-plasma")
              : lm.recommended === "GNOME"
              ? desktopEnvironments.includes("gnome")
              : false;

          return (
            <div
              key={lm.id}
              className={`radio-card ${loginManager === lm.id ? "selected" : ""}`}
              onClick={() => setLoginManager(lm.id)}
            >
              <div className="radio-dot">
                <div className="radio-dot-fill" />
              </div>
              <div className="radio-card-body">
                <div className="radio-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {lm.label}
                  {isRecommended && (
                    <span className="chip success" style={{ fontSize: 11, padding: "1px 8px" }}>
                      Recommended
                    </span>
                  )}
                </div>
                <div className="radio-card-desc">{lm.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
