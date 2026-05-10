import { create } from "zustand";

export interface User {
  username: string;
  password: string;
  sudo: boolean;
}

export type InstallType = "minimal" | "desktop";
export type LoginManager = "sddm" | "gdm" | "ly" | "none";
export type NetworkOption = "networkmanager" | "networkmanager-iwd" | "disabled";
export type AudioOption = "pipewire" | "pulseaudio" | "disabled";
export type SecondaryPage = "help" | "root-password" | "user-accounts" | "add-user" | null;

export interface InstallerConfig {
  region: string;
  timezone: string;
  keyboardLayout: string;
  rootPartition: string;
  bootPartition: string;
  rootFilesystem: string;
  bootloader: string;
  installType: InstallType;
  desktopEnvironments: string[];
  loginManager: LoginManager;
  rootPassword: string;
  users: User[];
  bluetooth: boolean;
  network: NetworkOption;
  audio: AudioOption;
}

interface InstallerState extends InstallerConfig {
  currentStep: number;
  secondaryPage: SecondaryPage;
  editingUser: User | null;

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  openSecondaryPage: (page: SecondaryPage) => void;
  closeSecondaryPage: () => void;

  setRegion: (v: string) => void;
  setTimezone: (v: string) => void;
  setKeyboardLayout: (v: string) => void;
  setRootPartition: (v: string) => void;
  setBootPartition: (v: string) => void;
  setRootFilesystem: (v: string) => void;
  setBootloader: (v: string) => void;
  setInstallType: (v: InstallType) => void;
  toggleDesktopEnvironment: (de: string) => void;
  setLoginManager: (v: LoginManager) => void;
  setRootPassword: (v: string) => void;
  addUser: (user: User) => void;
  removeUser: (username: string) => void;
  setBluetooth: (v: boolean) => void;
  setNetwork: (v: NetworkOption) => void;
  setAudio: (v: AudioOption) => void;
  setEditingUser: (user: User | null) => void;

  getConfig: () => InstallerConfig;
}

const TOTAL_STEPS = 12;

function getNextStep(step: number, installType: InstallType): number {
  if (step === 6 && installType === "minimal") return 8;
  return Math.min(step + 1, TOTAL_STEPS - 1);
}

function getPrevStep(step: number, installType: InstallType): number {
  if (step === 8 && installType === "minimal") return 6;
  return Math.max(step - 1, 0);
}

export const useInstallerStore = create<InstallerState>((set, get) => ({
  currentStep: 0,
  secondaryPage: null,
  editingUser: null,

  region: "",
  timezone: "",
  keyboardLayout: "us",
  rootPartition: "",
  bootPartition: "",
  rootFilesystem: "ext4",
  bootloader: "",
  installType: "desktop",
  desktopEnvironments: [],
  loginManager: "sddm",
  rootPassword: "",
  users: [],
  bluetooth: true,
  network: "networkmanager",
  audio: "pipewire",

  nextStep: () =>
    set((s) => ({ currentStep: getNextStep(s.currentStep, s.installType) })),
  prevStep: () =>
    set((s) => ({ currentStep: getPrevStep(s.currentStep, s.installType) })),
  goToStep: (step) => set({ currentStep: step }),
  openSecondaryPage: (page) => set({ secondaryPage: page }),
  closeSecondaryPage: () => set({ secondaryPage: null, editingUser: null }),

  setRegion: (region) => set({ region }),
  setTimezone: (timezone) => set({ timezone }),
  setKeyboardLayout: (keyboardLayout) => set({ keyboardLayout }),
  setRootPartition: (rootPartition) => set({ rootPartition }),
  setBootPartition: (bootPartition) => set({ bootPartition }),
  setRootFilesystem: (rootFilesystem) => set({ rootFilesystem }),
  setBootloader: (bootloader) => set({ bootloader }),
  setInstallType: (installType) => set({ installType }),
  toggleDesktopEnvironment: (de) =>
    set((s) => ({
      desktopEnvironments: s.desktopEnvironments.includes(de)
        ? s.desktopEnvironments.filter((d) => d !== de)
        : [...s.desktopEnvironments, de],
    })),
  setLoginManager: (loginManager) => set({ loginManager }),
  setRootPassword: (rootPassword) => set({ rootPassword }),
  addUser: (user) =>
    set((s) => ({
      users: [
        ...s.users.filter((u) => u.username !== user.username),
        user,
      ],
    })),
  removeUser: (username) =>
    set((s) => ({ users: s.users.filter((u) => u.username !== username) })),
  setBluetooth: (bluetooth) => set({ bluetooth }),
  setNetwork: (network) => set({ network }),
  setAudio: (audio) => set({ audio }),
  setEditingUser: (editingUser) => set({ editingUser }),

  getConfig: () => {
    const s = get();
    return {
      region: s.region,
      timezone: s.timezone,
      keyboardLayout: s.keyboardLayout,
      rootPartition: s.rootPartition,
      bootPartition: s.bootPartition,
      rootFilesystem: s.rootFilesystem,
      bootloader: s.bootloader,
      installType: s.installType,
      desktopEnvironments: s.desktopEnvironments,
      loginManager: s.loginManager,
      rootPassword: s.rootPassword,
      users: s.users,
      bluetooth: s.bluetooth,
      network: s.network,
      audio: s.audio,
    };
  },
}));
