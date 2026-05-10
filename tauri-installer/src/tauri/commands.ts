// [Frontend Integration Placeholder] — Tauri IPC command bindings.
// All functions invoke real Rust commands. Swap mock implementations
// by providing a real Tauri context during the build.

import { invoke } from "@tauri-apps/api/core";

export interface DiskPartition {
  device: string;
  size: string;
  fstype: string | null;
  label: string | null;
  mountpoint: string | null;
}

export interface DiskInfo {
  device: string;
  name: string;
  size: string;
  model: string;
  partitions: DiskPartition[];
}

export interface KeyboardLayout {
  code: string;
  description: string;
}

export interface NetworkStatus {
  connected: boolean;
  interface: string | null;
}

export interface BootloaderInfo {
  name: string;
  description: string;
  supported: boolean;
}

// ── Detect whether we're running inside Tauri ──────────────────────────────
const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (IS_TAURI) {
    return invoke<T>(cmd, args);
  }
  // Dev-mode mock data so the UI works in a browser during frontend development
  return getMockData<T>(cmd, args);
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getDisks(): Promise<DiskInfo[]> {
  return tauriInvoke<DiskInfo[]>("get_disks");
}

export async function getKeyboardLayouts(): Promise<KeyboardLayout[]> {
  return tauriInvoke<KeyboardLayout[]>("get_keyboard_layouts");
}

export async function getRegions(): Promise<string[]> {
  return tauriInvoke<string[]>("get_regions");
}

export async function getTimezones(region: string): Promise<string[]> {
  return tauriInvoke<string[]>("get_timezones", { region });
}

export async function getArchitecture(): Promise<string> {
  return tauriInvoke<string>("get_architecture");
}

export async function checkNetwork(): Promise<NetworkStatus> {
  return tauriInvoke<NetworkStatus>("check_network");
}

export async function getSupportedFilesystems(): Promise<string[]> {
  return tauriInvoke<string[]>("get_supported_filesystems");
}

export async function getBootloaders(): Promise<BootloaderInfo[]> {
  return tauriInvoke<BootloaderInfo[]>("get_bootloaders");
}

export async function launchCfdisk(partition?: string): Promise<void> {
  return tauriInvoke<void>("launch_cfdisk", { partition: partition ?? null });
}

export async function saveConfig(config: unknown): Promise<void> {
  return tauriInvoke<void>("save_config", { config });
}

export async function startInstallation(): Promise<void> {
  return tauriInvoke<void>("start_installation");
}

// ── Mock data for browser-only development ─────────────────────────────────
// [Frontend Integration Placeholder] — remove or gate behind IS_TAURI check
function getMockData<T>(cmd: string, args?: Record<string, unknown>): T {
  const mocks: Record<string, unknown> = {
    get_disks: [
      {
        device: "/dev/sda",
        name: "sda",
        size: "500G",
        model: "Samsung SSD 870",
        partitions: [
          { device: "/dev/sda1", size: "512M", fstype: "vfat", label: "EFI", mountpoint: "/boot" },
          { device: "/dev/sda2", size: "499.5G", fstype: "ext4", label: null, mountpoint: null },
        ],
      },
      {
        device: "/dev/nvme0n1",
        name: "nvme0n1",
        size: "1T",
        model: "WD Black SN850",
        partitions: [
          { device: "/dev/nvme0n1p1", size: "512M", fstype: null, label: null, mountpoint: null },
          { device: "/dev/nvme0n1p2", size: "1023.5G", fstype: null, label: null, mountpoint: null },
        ],
      },
    ] as DiskInfo[],
    get_keyboard_layouts: [
      { code: "us", description: "English (US)" },
      { code: "uk", description: "English (UK)" },
      { code: "de", description: "German" },
      { code: "fr", description: "French" },
      { code: "es", description: "Spanish" },
      { code: "pt", description: "Portuguese" },
      { code: "ru", description: "Russian" },
      { code: "jp", description: "Japanese" },
    ] as KeyboardLayout[],
    get_regions: [
      "Africa", "America", "Antarctica", "Arctic", "Asia",
      "Atlantic", "Australia", "Europe", "Indian", "Pacific",
    ] as string[],
    get_timezones: [
      "London", "Paris", "Berlin", "Madrid", "Rome",
      "Amsterdam", "Brussels", "Warsaw", "Prague",
    ].filter(() => true) as string[],
    get_architecture: "x86_64" as string,
    check_network: { connected: true, interface: "eth0" } as NetworkStatus,
    get_supported_filesystems: ["btrfs", "ext4", "xfs"] as string[],
    get_bootloaders: [
      { name: "systemd-boot", description: "Lightweight EFI boot manager (recommended for UEFI systems)", supported: true },
      { name: "grub", description: "Grand Unified Bootloader — supports BIOS and UEFI", supported: true },
      { name: "efistub", description: "Direct kernel EFI stub boot (advanced)", supported: true },
    ] as BootloaderInfo[],
    save_config: undefined,
    start_installation: undefined,
  };

  // getTimezones mock: return plausible cities filtered by region
  if (cmd === "get_timezones" && args?.region) {
    const regionMocks: Record<string, string[]> = {
      America: ["New_York", "Chicago", "Denver", "Los_Angeles", "Toronto", "Vancouver", "Sao_Paulo"],
      Europe: ["London", "Paris", "Berlin", "Madrid", "Rome", "Amsterdam", "Warsaw", "Prague", "Stockholm"],
      Asia: ["Tokyo", "Shanghai", "Hong_Kong", "Singapore", "Seoul", "Kolkata", "Dubai", "Bangkok"],
      Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
      Africa: ["Cairo", "Lagos", "Nairobi", "Johannesburg", "Casablanca"],
      Pacific: ["Auckland", "Honolulu", "Fiji"],
    };
    return (regionMocks[args.region as string] ?? ["UTC"]) as T;
  }

  return (mocks[cmd] ?? null) as T;
}
