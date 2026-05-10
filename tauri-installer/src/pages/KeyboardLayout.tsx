import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import SearchableSelect from "../components/SearchableSelect";
import { useInstallerStore } from "../store/installer";
import { getKeyboardLayouts, KeyboardLayout as KBLayout } from "../tauri/commands";

export default function KeyboardLayout() {
  const { keyboardLayout, setKeyboardLayout, nextStep } = useInstallerStore();

  const [layouts, setLayouts] = useState<KBLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getKeyboardLayouts()
      .then(setLayouts)
      .catch(() => setError("Failed to load keyboard layouts."))
      .finally(() => setLoading(false));
  }, []);

  const options = layouts.map((l) => l.code);

  const selectedLayout = layouts.find((l) => l.code === keyboardLayout);

  const handleNext = () => {
    if (!keyboardLayout) {
      setError("Please select a keyboard layout.");
      return;
    }
    nextStep();
  };

  return (
    <Layout
      icon={<KeyboardIcon />}
      title="Keyboard Layout"
      subtitle="Choose the keyboard layout that matches your physical keyboard."
      footer={<Footer onNext={handleNext} nextDisabled={!keyboardLayout} />}
    >
      <div className="form-group">
        <div className="form-label">Layout</div>
        <SearchableSelect
          options={options}
          value={keyboardLayout}
          onChange={(v) => { setKeyboardLayout(v); setError(null); }}
          placeholder="Select a layout..."
          searchPlaceholder="Search layouts (e.g. us, de, fr)..."
          loading={loading}
        />
        {error && <div className="form-error">{error}</div>}
      </div>

      {selectedLayout && (
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 16px",
            background: "var(--chip-bg)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            marginTop: 4,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 22 }}>⌨️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedLayout.description || selectedLayout.code}</div>
            <div className="text-muted">Code: <code>{selectedLayout.code}</code></div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div className="form-label" style={{ marginBottom: 10 }}>Common layouts</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["us", "uk", "de", "fr", "es", "pt", "ru", "jp"].map((code) => (
            <button
              key={code}
              className={`btn btn-sm ${keyboardLayout === code ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setKeyboardLayout(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <line x1="6" y1="11" x2="6" y2="11" />
      <line x1="10" y1="11" x2="10" y2="11" />
      <line x1="14" y1="11" x2="14" y2="11" />
      <line x1="18" y1="11" x2="18" y2="11" />
      <line x1="6" y1="15" x2="6" y2="15" />
      <line x1="18" y1="15" x2="18" y2="15" />
      <line x1="10" y1="15" x2="14" y2="15" />
    </svg>
  );
}
