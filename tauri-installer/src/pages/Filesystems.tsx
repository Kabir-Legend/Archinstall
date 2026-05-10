import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore } from "../store/installer";
import { getSupportedFilesystems } from "../tauri/commands";

const FS_DESCRIPTIONS: Record<string, string> = {
  ext4: "Fourth Extended Filesystem — stable, widely supported, excellent for general use.",
  btrfs: "B-tree Filesystem — modern, supports snapshots, compression, and RAID.",
  xfs: "High-performance journaling filesystem — ideal for large files and parallel I/O.",
  f2fs: "Flash-Friendly Filesystem — optimized for NAND flash storage (SSDs, eMMC).",
};

export default function Filesystems() {
  const {
    rootPartition, bootPartition,
    rootFilesystem, setRootFilesystem,
    nextStep,
  } = useInstallerStore();

  const [filesystems, setFilesystems] = useState<string[]>(["ext4", "btrfs", "xfs"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupportedFilesystems()
      .then((fss) => setFilesystems(fss.length > 0 ? fss : ["ext4", "btrfs", "xfs"]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout
      icon={<FSIcon />}
      title="Filesystems"
      subtitle="Choose the filesystem for your root partition. Boot will be formatted as FAT32."
      footer={<Footer onNext={nextStep} nextDisabled={!rootFilesystem} />}
    >
      {/* Summary of selected partitions */}
      <div style={{ marginBottom: 22, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="form-label">Selected partitions</div>
        <div className="partition-row" style={{ cursor: "default", pointerEvents: "none" }}>
          <div className="partition-info">
            <div className="partition-device">{rootPartition || "—"}</div>
            <div className="partition-meta"><span>Root partition</span></div>
          </div>
          <span className="chip">Will be formatted</span>
        </div>
        <div className="partition-row" style={{ cursor: "default", pointerEvents: "none" }}>
          <div className="partition-info">
            <div className="partition-device">{bootPartition || "—"}</div>
            <div className="partition-meta"><span>Boot / EFI partition</span></div>
          </div>
          <span className="chip success">FAT32 (fixed)</span>
        </div>
      </div>

      <div className="section-title">Root filesystem</div>

      {loading ? (
        <div className="loading-row"><div className="spinner" />Detecting supported filesystems...</div>
      ) : (
        <div className="radio-cards">
          {filesystems.map((fs) => (
            <div
              key={fs}
              className={`radio-card ${rootFilesystem === fs ? "selected" : ""}`}
              onClick={() => setRootFilesystem(fs)}
            >
              <div className="radio-dot">
                <div className="radio-dot-fill" />
              </div>
              <div className="radio-card-body">
                <div className="radio-card-title">{fs}</div>
                <div className="radio-card-desc">{FS_DESCRIPTIONS[fs] ?? "A supported Linux filesystem."}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          padding: "10px 14px",
          background: "#fff8e1",
          borderRadius: 8,
          border: "1px solid #ffe58f",
          fontSize: 13,
          color: "#7a5f00",
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <span style={{ flexShrink: 0 }}>⚠️</span>
        <span>
          Both partitions will be <strong>completely erased</strong> during installation. Ensure you have backed up any important data.
        </span>
      </div>
    </Layout>
  );
}

function FSIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}
