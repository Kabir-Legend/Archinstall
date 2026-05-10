import Layout from "../../components/Layout";
import { useInstallerStore } from "../../store/installer";

const SECTIONS = [
  {
    title: "About this installer",
    content:
      "This is a graphical installer for Arch Linux, providing a guided Windows 11 OOBE-style wizard to configure and install a fully functional Arch system. The installer covers partitioning, filesystem selection, bootloader, desktop environment, user management, and services.",
  },
  {
    title: "Installation overview",
    content:
      "The wizard walks through 12 steps: Region/Timezone → Keyboard → Disk Selection → Filesystems → Bootloader → Install Type → Desktop Environments → Login Manager → Authentication → Services → Summary. At the Summary page, you review the config and start installation.",
  },
  {
    title: "Disk partitioning",
    content:
      "You need at least two partitions: a root partition (/) and an EFI/boot partition. Use the 'Partition disks (cfdisk)' button on the Disk Selection page to open cfdisk in a terminal. After partitioning, return to the installer — it will automatically re-scan.",
  },
  {
    title: "Bootloaders",
    content:
      "systemd-boot is recommended for UEFI systems. GRUB supports both BIOS and UEFI. efistub boots the kernel directly and is for advanced users. The available options are filtered based on your CPU architecture.",
  },
  {
    title: "Install types",
    content:
      "Minimal installs only the base system without any graphical interface. Desktop installs a full graphical environment with your choice of desktop. If you choose Desktop, you'll also configure a login manager on the next step.",
  },
  {
    title: "User accounts",
    content:
      "You must create at least one user with sudo privileges in addition to setting a root password. This ensures you have a regular user account with administrative access to the installed system.",
  },
  {
    title: "Config file",
    content:
      "All settings are saved to /installer/configs/config.json before installation begins. You can inspect this file in the Summary page before proceeding.",
  },
  {
    title: "Installation log",
    content:
      "Once you click 'Start Installation', the installer closes and a terminal launches with install.sh. The output is logged to /installer/logs/install.log. Do not power off the machine while installation is in progress.",
  },
];

export default function InstallerHelp() {
  const { closeSecondaryPage } = useInstallerStore();

  return (
    <Layout
      icon={<HelpIcon />}
      title="Installer Help"
      subtitle="Reference guide for this Arch Linux graphical installer."
      step={0}
      footer={
        <>
          <div className="footer-left" />
          <div className="footer-right">
            <button className="btn btn-primary" onClick={closeSecondaryPage}>
              Close
            </button>
          </div>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--primary)", fontSize: 13 }}>▸</span>
              {s.title}
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
              {s.content}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "12px 16px",
          background: "var(--chip-bg)",
          borderRadius: 8,
          border: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--chip-text)",
        }}
      >
        For more information, see the{" "}
        <strong>Arch Linux Installation Guide</strong> at{" "}
        <code>wiki.archlinux.org/title/Installation_guide</code>
      </div>
    </Layout>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
