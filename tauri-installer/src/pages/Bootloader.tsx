import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore } from "../store/installer";
import { getBootloaders, getArchitecture, BootloaderInfo } from "../tauri/commands";

export default function Bootloader() {
  const { bootloader, setBootloader, nextStep } = useInstallerStore();

  const [bootloaders, setBootloaders] = useState<BootloaderInfo[]>([]);
  const [arch, setArch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getBootloaders(), getArchitecture()])
      .then(([bls, a]) => { setBootloaders(bls); setArch(a); })
      .catch(() => setError("Failed to detect system bootloaders."))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = () => {
    if (!bootloader) { setError("Please select a bootloader."); return; }
    nextStep();
  };

  return (
    <Layout
      icon={<BootIcon />}
      title="Bootloader"
      subtitle="Select the bootloader to install. Options are filtered based on your system architecture."
      footer={<Footer onNext={handleNext} nextDisabled={!bootloader} />}
    >
      {arch && (
        <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="form-label">Architecture detected:</span>
          <span className="chip">{arch}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-row"><div className="spinner" />Detecting available bootloaders...</div>
      ) : error ? (
        <div className="form-error">{error}</div>
      ) : (
        <div className="radio-cards">
          {bootloaders.map((bl) => (
            <div
              key={bl.name}
              className={`radio-card ${!bl.supported ? "disabled" : ""} ${bootloader === bl.name ? "selected" : ""}`}
              onClick={() => bl.supported && (setBootloader(bl.name), setError(null))}
              style={!bl.supported ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              <div className="radio-dot">
                <div className="radio-dot-fill" />
              </div>
              <div className="radio-card-body">
                <div className="radio-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {bl.name}
                  {!bl.supported && <span className="chip neutral" style={{ fontSize: 11 }}>Unsupported on {arch}</span>}
                </div>
                <div className="radio-card-desc">{bl.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="form-error" style={{ marginTop: 12 }}>{error}</div>
      )}
    </Layout>
  );
}

function BootIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
