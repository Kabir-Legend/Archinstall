import { useState } from "react";
import Layout from "../components/Layout";
import { useInstallerStore } from "../store/installer";
import { saveConfig, startInstallation } from "../tauri/commands";

export default function Summary() {
  const { getConfig, prevStep } = useInstallerStore();
  const [starting, setStarting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const config = getConfig();

  const handleStartInstall = async () => {
    setStarting(true);
    setSaveError(null);
    try {
      await saveConfig(config);
      await startInstallation();
    } catch (e) {
      setSaveError(String(e));
      setStarting(false);
    }
  };

  const formatValue = (v: unknown): string => {
    if (typeof v === "boolean") return v ? "true" : "false";
    if (Array.isArray(v)) return v.length ? v.join(", ") : "(none)";
    if (v === "" || v === null || v === undefined) return "(not set)";
    return String(v);
  };

  const rows: { label: string; value: string }[] = [
    { label: "Region / Timezone", value: `${config.region} / ${config.timezone}` },
    { label: "Keyboard Layout", value: config.keyboardLayout },
    { label: "Root Partition", value: config.rootPartition },
    { label: "Boot Partition", value: config.bootPartition },
    { label: "Root Filesystem", value: config.rootFilesystem.toUpperCase() },
    { label: "Boot Filesystem", value: "FAT32 (fixed)" },
    { label: "Bootloader", value: config.bootloader },
    { label: "Install Type", value: config.installType === "desktop" ? "Desktop Environment" : "Minimal" },
    ...(config.installType === "desktop"
      ? [{ label: "Desktop Environments", value: formatValue(config.desktopEnvironments) }]
      : []),
    { label: "Login Manager", value: config.loginManager },
    { label: "Root Password", value: config.rootPassword ? "Configured" : "NOT SET" },
    { label: "User Accounts", value: config.users.map((u) => `${u.username}${u.sudo ? " (sudo)" : ""}`).join(", ") || "(none)" },
    { label: "Bluetooth", value: config.bluetooth ? "Enabled" : "Disabled" },
    { label: "Network", value: config.network },
    { label: "Audio", value: config.audio },
  ];

  return (
    <Layout
      icon={<CheckIcon />}
      title="Installation Summary"
      subtitle="Review your configuration before starting the installation."
      footer={
        <>
          <div className="footer-left">
            <button className="btn btn-secondary" onClick={prevStep} disabled={starting}>
              <ChevronLeft /> Previous
            </button>
          </div>
          <div className="footer-right">
            <button
              className="btn btn-primary"
              style={{ background: "linear-gradient(135deg, #107c10, #1a9e1a)", minWidth: 160, fontSize: 15 }}
              onClick={handleStartInstall}
              disabled={starting}
            >
              {starting ? (
                <><div className="spinner" style={{ borderTopColor: "#fff", width: 14, height: 14, borderColor: "rgba(255,255,255,0.3)" }} />Starting...</>
              ) : (
                <><RocketIcon /> Start Installation</>
              )}
            </button>
          </div>
        </>
      }
    >
      {/* Config table */}
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Configuration</div>
        <div
          style={{
            border: "1.5px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {rows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                padding: "10px 16px",
                borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                background: i % 2 === 0 ? "#fff" : "var(--surface)",
                fontSize: 13.5,
              }}
            >
              <span style={{ color: "var(--text-secondary)", width: 180, flexShrink: 0, fontWeight: 500 }}>{row.label}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 400 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* JSON preview */}
      <div>
        <div className="section-title">Config file preview</div>
        <div className="config-preview">
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
        <div className="text-muted" style={{ marginTop: 6, fontSize: 12 }}>
          Will be saved to <code>/installer/configs/config.json</code>
        </div>
      </div>

      {saveError && (
        <div className="form-error" style={{ marginTop: 12 }}>
          Failed to start installation: {saveError}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#fde8e6",
          borderRadius: 8,
          border: "1px solid #f5c2bc",
          fontSize: 13,
          color: "#c42b1c",
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <span style={{ flexShrink: 0, fontWeight: 700 }}>!</span>
        <span>
          Proceeding will <strong>permanently erase</strong> the selected partitions and install Arch Linux.
          This action cannot be undone.
        </span>
      </div>
    </Layout>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
