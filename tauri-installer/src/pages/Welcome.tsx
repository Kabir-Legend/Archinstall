import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore } from "../store/installer";
import { checkNetwork } from "../tauri/commands";

export default function Welcome() {
  const { nextStep, openSecondaryPage } = useInstallerStore();
  const [networkStatus, setNetworkStatus] = useState<{ connected: boolean; interface: string | null } | null>(null);

  useEffect(() => {
    checkNetwork()
      .then(setNetworkStatus)
      .catch(() => setNetworkStatus({ connected: false, interface: null }));
  }, []);

  return (
    <Layout
      icon={<ArchIcon />}
      title="Welcome to Arch Linux"
      subtitle="This installer will guide you through setting up a new Arch Linux system."
      step={0}
      footer={
        <Footer
          hidePrev
          nextLabel="Get Started"
          onNext={nextStep}
          leftExtra={
            networkStatus !== null && (
              <div className="flex items-center gap-2" style={{ marginLeft: 12 }}>
                <span className={`status-dot ${networkStatus.connected ? "online" : "offline"}`} />
                <span className="text-muted">
                  {networkStatus.connected
                    ? `Online${networkStatus.interface ? ` · ${networkStatus.interface}` : ""}`
                    : "No network connection"}
                </span>
              </div>
            )
          }
        />
      }
    >
      <div className="welcome-actions" style={{ paddingTop: 8 }}>
        <svg width="88" height="88" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="64" cy="64" r="64" fill="#1793d1" fillOpacity="0.12" />
          <path d="M64 18 L100 100 H28 Z" fill="none" stroke="#1793d1" strokeWidth="5" strokeLinejoin="round" />
          <path d="M64 18 L100 100" stroke="#1793d1" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
          <path d="M64 18 L28 100" stroke="#1793d1" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
          <path d="M42 80 L86 80" stroke="#1793d1" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <path d="M50 65 L78 65" stroke="#1793d1" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        </svg>

        <h1 className="welcome-heading">Install Arch Linux</h1>
        <p className="welcome-sub">
          A minimal, rolling-release Linux distribution. This guided installer will help you
          configure partitions, desktop environment, users, and services.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
          <button className="btn btn-primary" style={{ width: "100%", padding: "12px 24px", fontSize: 15 }} onClick={nextStep}>
            Begin Installation
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: "100%" }}
            onClick={() => openSecondaryPage("help")}
          >
            <HelpIcon />
            Installer Help
          </button>
        </div>

        {networkStatus !== null && !networkStatus.connected && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#fde8e6",
              borderRadius: 8,
              border: "1px solid #f5c2bc",
              fontSize: 13,
              color: "#c42b1c",
              maxWidth: 380,
              textAlign: "center",
            }}
          >
            No network detected. Online installation steps will require an active connection.
          </div>
        )}
      </div>
    </Layout>
  );
}

function ArchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L22 20 H2 Z" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 2 L22 20" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M12 2 L2 20" stroke="white" strokeWidth="1" opacity="0.5" />
      <path d="M7 16 L17 16" stroke="white" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
