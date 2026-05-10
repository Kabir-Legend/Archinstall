import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore } from "../store/installer";

const DESKTOP_ENVIRONMENTS = [
  {
    id: "kde-plasma",
    label: "KDE Plasma",
    description: "Feature-rich and highly customizable desktop.",
  },
  {
    id: "gnome",
    label: "GNOME",
    description: "Modern, clean, and touch-friendly interface.",
  },
  {
    id: "xfce",
    label: "Xfce",
    description: "Lightweight and fast. Ideal for older hardware.",
  },
  {
    id: "cinnamon",
    label: "Cinnamon",
    description: "Traditional desktop feel with modern polish.",
  },
];

export default function DesktopEnvironments() {
  const { desktopEnvironments, toggleDesktopEnvironment, nextStep } = useInstallerStore();
  const [error, setError] = [
    desktopEnvironments.length === 0 ? "Select at least one desktop environment." : null,
    () => {},
  ];

  const handleNext = () => {
    if (desktopEnvironments.length === 0) return;
    nextStep();
  };

  return (
    <Layout
      icon={<MonitorIcon />}
      title="Desktop Environments"
      subtitle="Select one or more desktop environments to install. You can install multiple and choose at login."
      footer={<Footer onNext={handleNext} nextDisabled={desktopEnvironments.length === 0} />}
    >
      <div className="checkbox-cards">
        {DESKTOP_ENVIRONMENTS.map((de) => {
          const selected = desktopEnvironments.includes(de.id);
          return (
            <div
              key={de.id}
              className={`checkbox-card ${selected ? "selected" : ""}`}
              onClick={() => toggleDesktopEnvironment(de.id)}
              style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, padding: "16px 14px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                <div className="checkbox-box">
                  <span className="checkbox-tick">✓</span>
                </div>
                <span className="checkbox-card-title" style={{ fontWeight: 600, fontSize: 14.5 }}>{de.label}</span>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", paddingLeft: 28, margin: 0, lineHeight: 1.4 }}>
                {de.description}
              </p>
            </div>
          );
        })}
      </div>

      {desktopEnvironments.length === 0 && (
        <div className="form-error" style={{ marginTop: 14 }}>
          At least one desktop environment must be selected.
        </div>
      )}

      {desktopEnvironments.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span className="form-label" style={{ width: "100%", marginBottom: 4 }}>Selected:</span>
          {desktopEnvironments.map((de) => {
            const found = DESKTOP_ENVIRONMENTS.find((d) => d.id === de);
            return (
              <span key={de} className="chip">
                {found?.label ?? de}
              </span>
            );
          })}
        </div>
      )}

      {error}
    </Layout>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
