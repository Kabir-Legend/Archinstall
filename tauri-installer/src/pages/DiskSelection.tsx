import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { useInstallerStore } from "../store/installer";
import { getDisks, launchCfdisk, DiskInfo } from "../tauri/commands";

export default function DiskSelection() {
  const {
    rootPartition, setRootPartition,
    bootPartition, setBootPartition,
    nextStep,
  } = useInstallerStore();

  const [disks, setDisks] = useState<DiskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState<"root" | "boot">("root");
  const [errors, setErrors] = useState<{ root?: string; boot?: string; same?: string }>({});

  const fetchDisks = () => {
    setLoading(true);
    getDisks()
      .then(setDisks)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisks(); }, []);

  const handleCfdisk = async () => {
    setRefreshing(true);
    await launchCfdisk().catch(() => {});
    // Re-scan after cfdisk exits
    getDisks().then(setDisks).finally(() => setRefreshing(false));
  };

  const handlePartitionClick = (device: string) => {
    if (selecting === "root") {
      setRootPartition(device);
      setErrors((e) => ({ ...e, root: undefined, same: undefined }));
    } else {
      setBootPartition(device);
      setErrors((e) => ({ ...e, boot: undefined, same: undefined }));
    }
  };

  const handleNext = () => {
    const errs: typeof errors = {};
    if (!rootPartition) errs.root = "Select a root partition.";
    if (!bootPartition) errs.boot = "Select a boot/EFI partition.";
    if (rootPartition && bootPartition && rootPartition === bootPartition)
      errs.same = "Root and boot partitions must be different.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    nextStep();
  };

  const allPartitions = disks.flatMap((d) => d.partitions);

  return (
    <Layout
      icon={<DiskIcon />}
      title="Disk Selection"
      subtitle="Select the target root and EFI/boot partitions for installation."
      footer={
        <Footer
          onNext={handleNext}
          nextDisabled={!rootPartition || !bootPartition}
          leftExtra={
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleCfdisk}
              disabled={refreshing}
              style={{ marginLeft: 8 }}
            >
              <PartitionIcon />
              {refreshing ? "Refreshing..." : "Partition disks (cfdisk)"}
            </button>
          }
        />
      }
    >
      {/* Selection mode toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <button
          className={`btn btn-sm ${selecting === "root" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setSelecting("root")}
        >
          Select Root
          {rootPartition && <span className="chip" style={{ marginLeft: 6, fontSize: 11, padding: "1px 7px" }}>{rootPartition}</span>}
        </button>
        <button
          className={`btn btn-sm ${selecting === "boot" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setSelecting("boot")}
        >
          Select Boot/EFI
          {bootPartition && <span className="chip" style={{ marginLeft: 6, fontSize: 11, padding: "1px 7px" }}>{bootPartition}</span>}
        </button>
      </div>

      {errors.same && (
        <div className="form-error" style={{ marginBottom: 12 }}>
          Root and boot partitions must be different devices.
        </div>
      )}

      {loading ? (
        <div className="loading-row"><div className="spinner" />Scanning block devices...</div>
      ) : disks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">💿</span>
          <div className="empty-state-text">No disks detected. Use cfdisk to create partitions.</div>
        </div>
      ) : (
        disks.map((disk) => (
          <div key={disk.device}>
            <div className="disk-header">
              <span className="disk-label">{disk.model} — {disk.device} ({disk.size})</span>
              <div className="disk-label-line" />
            </div>

            {disk.partitions.length === 0 ? (
              <div className="text-muted" style={{ paddingBottom: 10, paddingLeft: 2 }}>
                No partitions. Use cfdisk to create them.
              </div>
            ) : (
              disk.partitions.map((part) => {
                const isRoot = rootPartition === part.device;
                const isBoot = bootPartition === part.device;
                const isSelected = selecting === "root" ? isRoot : isBoot;

                return (
                  <div
                    key={part.device}
                    className={`partition-row ${isSelected ? "selected" : ""}`}
                    onClick={() => handlePartitionClick(part.device)}
                  >
                    <div className="partition-info">
                      <div className="partition-device">{part.device}</div>
                      <div className="partition-meta">
                        {part.fstype && <span>{part.fstype}</span>}
                        {part.label && <span>{part.label}</span>}
                        {part.mountpoint && <span>mounted at {part.mountpoint}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isRoot && <span className="chip">Root</span>}
                      {isBoot && <span className="chip success">Boot/EFI</span>}
                      <span className="partition-size">{part.size}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))
      )}

      {errors.root && !rootPartition && (
        <div className="form-error" style={{ marginTop: 8 }}>{errors.root}</div>
      )}
      {errors.boot && !bootPartition && (
        <div className="form-error" style={{ marginTop: 4 }}>{errors.boot}</div>
      )}
    </Layout>
  );
}

function DiskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function PartitionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}
