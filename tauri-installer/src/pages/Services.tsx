import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore, NetworkOption, AudioOption } from "../store/installer";

export default function Services() {
  const {
    bluetooth, setBluetooth,
    network, setNetwork,
    audio, setAudio,
    nextStep,
  } = useInstallerStore();

  return (
    <Layout
      icon={<SettingsIcon />}
      title="Services"
      subtitle="Configure system services that will start automatically after installation."
      footer={<Footer onNext={nextStep} />}
    >
      {/* Bluetooth */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-title">Bluetooth</div>
        <div className="toggle-row">
          <div className="toggle-label">
            <span className="toggle-label-text">Enable Bluetooth</span>
            <span className="toggle-label-sub">Starts bluetoothd via systemd on boot.</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={bluetooth}
              onChange={(e) => setBluetooth(e.target.checked)}
            />
            <div className="toggle-track" />
          </label>
        </div>
      </div>

      {/* Network */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-title">Network Manager</div>
        <div className="radio-cards">
          {(
            [
              {
                id: "networkmanager" as NetworkOption,
                label: "NetworkManager",
                desc: "Full-featured connection manager. Recommended for most desktop setups.",
              },
              {
                id: "networkmanager-iwd" as NetworkOption,
                label: "NetworkManager + iwd",
                desc: "NetworkManager with iwd as the Wi-Fi backend. Faster and more modern than wpa_supplicant.",
              },
              {
                id: "disabled" as NetworkOption,
                label: "Disabled",
                desc: "No network manager. Configure networking manually after installation.",
              },
            ] as const
          ).map((opt) => (
            <div
              key={opt.id}
              className={`radio-card ${network === opt.id ? "selected" : ""}`}
              onClick={() => setNetwork(opt.id)}
            >
              <div className="radio-dot"><div className="radio-dot-fill" /></div>
              <div className="radio-card-body">
                <div className="radio-card-title">{opt.label}</div>
                <div className="radio-card-desc">{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audio */}
      <div>
        <div className="section-title">Audio Server</div>
        <div className="radio-cards">
          {(
            [
              {
                id: "pipewire" as AudioOption,
                label: "PipeWire",
                desc: "Modern, low-latency audio/video server. Replaces PulseAudio and JACK. Recommended.",
              },
              {
                id: "pulseaudio" as AudioOption,
                label: "PulseAudio",
                desc: "Mature, stable audio server. Wide application support.",
              },
              {
                id: "disabled" as AudioOption,
                label: "Disabled",
                desc: "No audio server. Configure audio manually after installation.",
              },
            ] as const
          ).map((opt) => (
            <div
              key={opt.id}
              className={`radio-card ${audio === opt.id ? "selected" : ""}`}
              onClick={() => setAudio(opt.id)}
            >
              <div className="radio-dot"><div className="radio-dot-fill" /></div>
              <div className="radio-card-body">
                <div className="radio-card-title">{opt.label}</div>
                <div className="radio-card-desc">{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
