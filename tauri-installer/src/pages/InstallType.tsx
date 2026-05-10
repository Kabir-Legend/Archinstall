import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore, InstallType as IType } from "../store/installer";

const INSTALL_TYPES: { id: IType; label: string; description: string; features: string[] }[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "A bare-bones Arch installation with no desktop environment.",
    features: ["Base system + kernel", "Networking stack", "SSH server", "No GUI"],
  },
  {
    id: "desktop",
    label: "Desktop Environment",
    description: "Full graphical installation with your choice of desktop environment.",
    features: ["Base system + kernel", "X.Org / Wayland", "Desktop environment", "Display manager", "Common utilities"],
  },
];

export default function InstallType() {
  const { installType, setInstallType, nextStep } = useInstallerStore();

  return (
    <Layout
      icon={<LayersIcon />}
      title="Installation Type"
      subtitle="Choose between a minimal base system or a full graphical desktop installation."
      footer={<Footer onNext={nextStep} />}
    >
      <div className="radio-cards">
        {INSTALL_TYPES.map((t) => (
          <div
            key={t.id}
            className={`radio-card ${installType === t.id ? "selected" : ""}`}
            onClick={() => setInstallType(t.id)}
            style={{ alignItems: "flex-start" }}
          >
            <div className="radio-dot" style={{ marginTop: 3 }}>
              <div className="radio-dot-fill" />
            </div>
            <div className="radio-card-body">
              <div className="radio-card-title">{t.label}</div>
              <div className="radio-card-desc" style={{ marginBottom: 12 }}>{t.description}</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--primary)", fontSize: 12, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
