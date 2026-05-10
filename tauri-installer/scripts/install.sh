#!/usr/bin/env bash
# =============================================================================
# install.sh — Arch Linux installation executor
# Reads /installer/configs/config.json and performs the full installation.
# Must be run as root in the live environment.
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Logging ───────────────────────────────────────────────────────────────
LOG_FILE="/installer/logs/install.log"
mkdir -p /installer/logs
exec > >(tee -a "$LOG_FILE") 2>&1

ts()    { date "+%H:%M:%S"; }
info()  { echo -e "${CYAN}[$(ts)]${NC} $*"; }
ok()    { echo -e "${GREEN}[$(ts)] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[$(ts)] ⚠${NC} $*"; }
die()   { echo -e "${RED}[$(ts)] ✗ ERROR:${NC} $*" >&2; exit 1; }

# ── Root check ────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && die "install.sh must be run as root."

# ── Config ────────────────────────────────────────────────────────────────
CONFIG_FILE="/installer/configs/config.json"
[[ -f "$CONFIG_FILE" ]] || die "Config file not found: $CONFIG_FILE"

info "Reading configuration from $CONFIG_FILE"

# Parse config using Python (always available in Arch live env via python3)
read_config() {
  python3 -c "
import json, sys
with open('$CONFIG_FILE') as f:
    c = json.load(f)
keys = sys.argv[1:]
val = c
for k in keys:
    val = val[k]
print(val if not isinstance(val, list) else ' '.join(val))
" "$@" 2>/dev/null || echo ""
}

ROOT_PART="$(read_config rootPartition)"
BOOT_PART="$(read_config bootPartition)"
ROOT_FS="$(read_config rootFilesystem)"
BOOTLOADER="$(read_config bootloader)"
INSTALL_TYPE="$(read_config installType)"
DESKTOP_ENVS="$(read_config desktopEnvironments)"
LOGIN_MGR="$(read_config loginManager)"
ROOT_PASSWORD="$(read_config rootPassword)"
KEYBOARD="$(read_config keyboardLayout)"
TIMEZONE="$(read_config region)/$(read_config timezone)"
BLUETOOTH="$(read_config bluetooth)"
NETWORK="$(read_config network)"
AUDIO="$(read_config audio)"

# ── Validate config ───────────────────────────────────────────────────────
info "Validating configuration..."
[[ -n "$ROOT_PART" ]]  || die "rootPartition is not set in config."
[[ -n "$BOOT_PART" ]]  || die "bootPartition is not set in config."
[[ -n "$ROOT_FS" ]]    || die "rootFilesystem is not set in config."
[[ -n "$BOOTLOADER" ]] || die "bootloader is not set in config."
[[ "$ROOT_PART" != "$BOOT_PART" ]] || die "Root and boot partitions must be different."
[[ -b "$ROOT_PART" ]] || die "Root partition device not found: $ROOT_PART"
[[ -b "$BOOT_PART" ]] || die "Boot partition device not found: $BOOT_PART"
ok "Configuration valid."

# ── Banner ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║         Arch Linux Graphical Installer               ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
info "Root partition:  $ROOT_PART ($ROOT_FS)"
info "Boot partition:  $BOOT_PART (FAT32)"
info "Bootloader:      $BOOTLOADER"
info "Install type:    $INSTALL_TYPE"
[[ "$INSTALL_TYPE" == "desktop" ]] && info "Desktop envs:    $DESKTOP_ENVS"
info "Login manager:   $LOGIN_MGR"
info "Keyboard:        $KEYBOARD"
info "Timezone:        $TIMEZONE"
echo ""

# ── Phase 1: Format partitions ────────────────────────────────────────────
echo -e "${BOLD}Phase 1: Partitioning & Formatting${NC}"

info "Formatting boot partition as FAT32: $BOOT_PART"
mkfs.fat -F32 -n EFI "$BOOT_PART"
ok "Boot partition formatted as FAT32."

info "Formatting root partition as ${ROOT_FS}: $ROOT_PART"
case "$ROOT_FS" in
  ext4)  mkfs.ext4  -F  -L archroot "$ROOT_PART" ;;
  btrfs) mkfs.btrfs -f  -L archroot "$ROOT_PART" ;;
  xfs)   mkfs.xfs   -f  -L archroot "$ROOT_PART" ;;
  f2fs)  mkfs.f2fs  -f  -l archroot "$ROOT_PART" ;;
  *)     die "Unsupported filesystem: $ROOT_FS" ;;
esac
ok "Root partition formatted as ${ROOT_FS}."

# Set EFI System Partition type
info "Setting EFI System Partition type on $BOOT_PART..."
sgdisk --typecode=0:ef00 "$BOOT_PART" 2>/dev/null || \
  parted -s "$(echo "$BOOT_PART" | sed 's/[0-9]*$//')" set "$(echo "$BOOT_PART" | grep -o '[0-9]*$')" esp on || \
  warn "Could not set ESP type code. Continuing — most systems will still boot."

# ── Phase 2: Mount filesystems ────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 2: Mounting${NC}"

info "Mounting root partition to /mnt..."
mount "$ROOT_PART" /mnt
ok "Root mounted."

info "Creating /mnt/boot and mounting EFI partition..."
mkdir -p /mnt/boot
mount "$BOOT_PART" /mnt/boot
ok "Boot mounted."

# ── Phase 3: Select mirrors ───────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 3: Mirror Selection${NC}"

if ping -c1 -W2 archlinux.org &>/dev/null; then
  info "Network available. Ranking mirrors with reflector..."
  reflector --country "$(python3 -c "
import json
with open('$CONFIG_FILE') as f:
    c = json.load(f)
print(c.get('region', 'US'))
")" --latest 5 --sort rate --save /etc/pacman.d/mirrorlist 2>/dev/null || \
    warn "reflector failed, using existing mirrorlist."
  ok "Mirrorlist updated."
else
  warn "No network. Using existing mirrorlist."
fi

# ── Phase 4: Arch base install ────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 4: Base Installation${NC}"

BASE_PACKAGES=(
  base base-devel linux linux-firmware
  networkmanager sudo nano vim git
  man-db man-pages texinfo
)

info "Running pacstrap..."
pacstrap -K /mnt "${BASE_PACKAGES[@]}"
ok "Base system installed."

# ── Phase 5: fstab ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 5: Filesystem Table${NC}"

info "Generating /etc/fstab..."
genfstab -U /mnt >> /mnt/etc/fstab
ok "fstab generated."

# ── Phase 6: System configuration ────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 6: System Configuration${NC}"

# Timezone
info "Setting timezone: $TIMEZONE"
arch-chroot /mnt ln -sf "/usr/share/zoneinfo/${TIMEZONE}" /etc/localtime
arch-chroot /mnt hwclock --systohc
ok "Timezone set."

# Locale
info "Configuring locale (en_US.UTF-8)..."
echo "en_US.UTF-8 UTF-8" >> /mnt/etc/locale.gen
arch-chroot /mnt locale-gen
echo "LANG=en_US.UTF-8" > /mnt/etc/locale.conf
ok "Locale configured."

# Keyboard
info "Setting keyboard layout: $KEYBOARD"
echo "KEYMAP=${KEYBOARD}" > /mnt/etc/vconsole.conf
ok "Keyboard layout set."

# Hostname
HOSTNAME="archlinux"
info "Setting hostname: $HOSTNAME"
echo "$HOSTNAME" > /mnt/etc/hostname
cat >> /mnt/etc/hosts <<EOF
127.0.0.1   localhost
::1         localhost
127.0.1.1   ${HOSTNAME}.localdomain ${HOSTNAME}
EOF
ok "Hostname configured."

# Initramfs
info "Generating initramfs..."
arch-chroot /mnt mkinitcpio -P
ok "initramfs generated."

# ── Phase 7: Root password ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 7: Authentication${NC}"

if [[ -n "$ROOT_PASSWORD" ]]; then
  info "Setting root password..."
  echo "root:${ROOT_PASSWORD}" | arch-chroot /mnt chpasswd
  ok "Root password set."
else
  warn "No root password in config. Root account will be locked."
fi

# User accounts
USER_COUNT="$(python3 -c "
import json
with open('$CONFIG_FILE') as f:
    c = json.load(f)
print(len(c.get('users', [])))
")"

if [[ "$USER_COUNT" -gt 0 ]]; then
  info "Creating user accounts..."
  python3 <<PYEOF
import json, subprocess, sys

with open('$CONFIG_FILE') as f:
    config = json.load(f)

for user in config.get('users', []):
    username = user['username']
    password = user['password']
    is_sudo  = user.get('sudo', False)

    groups = 'audio,video,optical,storage'
    if is_sudo:
        groups += ',wheel'

    subprocess.run(['arch-chroot', '/mnt', 'useradd', '-m', '-G', groups, username], check=True)
    proc = subprocess.run(
        ['arch-chroot', '/mnt', 'chpasswd'],
        input=f'{username}:{password}\n',
        text=True, check=True
    )
    print(f"[install] User '{username}' created (sudo={is_sudo})")

# Enable sudoers wheel group
with open('/mnt/etc/sudoers', 'r') as f:
    sudoers = f.read()
sudoers = sudoers.replace('# %wheel ALL=(ALL:ALL) ALL', '%wheel ALL=(ALL:ALL) ALL')
with open('/mnt/etc/sudoers', 'w') as f:
    f.write(sudoers)
PYEOF
  ok "User accounts created."
fi

# ── Phase 8: Bootloader ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 8: Bootloader${NC}"

case "$BOOTLOADER" in
  systemd-boot)
    info "Installing systemd-boot..."
    arch-chroot /mnt bootctl install
    ROOT_UUID="$(blkid -s UUID -o value "$ROOT_PART")"
    mkdir -p /mnt/boot/loader/entries
    cat > /mnt/boot/loader/loader.conf <<EOF
default  arch.conf
timeout  4
console-mode max
editor   no
EOF
    cat > /mnt/boot/loader/entries/arch.conf <<EOF
title   Arch Linux
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options root=UUID=${ROOT_UUID} rw quiet
EOF
    ok "systemd-boot installed."
    ;;
  grub)
    info "Installing GRUB..."
    arch-chroot /mnt pacman -S --noconfirm grub efibootmgr
    arch-chroot /mnt grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
    arch-chroot /mnt grub-mkconfig -o /boot/grub/grub.cfg
    ok "GRUB installed."
    ;;
  efistub)
    info "Configuring EFI stub boot entry..."
    ROOT_UUID="$(blkid -s UUID -o value "$ROOT_PART")"
    DISK="$(lsblk -ndo pkname "$BOOT_PART")"
    PART_NUM="$(cat /sys/class/block/"${BOOT_PART##/dev/}"/partition)"
    efibootmgr --disk "/dev/${DISK}" --part "$PART_NUM" \
      --create --label "Arch Linux" \
      --loader /vmlinuz-linux \
      --unicode "root=UUID=${ROOT_UUID} rw quiet initrd=\\initramfs-linux.img"
    ok "EFI stub entry created."
    ;;
  *)
    warn "Unknown bootloader: $BOOTLOADER. Skipping bootloader installation."
    ;;
esac

# ── Phase 9: Desktop environment ──────────────────────────────────────────
if [[ "$INSTALL_TYPE" == "desktop" && -n "$DESKTOP_ENVS" ]]; then
  echo ""
  echo -e "${BOLD}Phase 9: Desktop Environments${NC}"

  declare -A DE_PACKAGES=(
    [kde-plasma]="plasma-meta kde-applications sddm"
    [gnome]="gnome gnome-extra gdm"
    [xfce]="xfce4 xfce4-goodies"
    [cinnamon]="cinnamon cinnamon-translations"
  )

  for de in $DESKTOP_ENVS; do
    pkgs="${DE_PACKAGES[$de]:-}"
    if [[ -n "$pkgs" ]]; then
      info "Installing ${de}: ${pkgs}"
      arch-chroot /mnt pacman -S --noconfirm $pkgs
      ok "${de} installed."
    fi
  done

  # Login manager
  case "$LOGIN_MGR" in
    sddm) arch-chroot /mnt systemctl enable sddm ;;
    gdm)  arch-chroot /mnt systemctl enable gdm  ;;
    ly)
      arch-chroot /mnt pacman -S --noconfirm ly
      arch-chroot /mnt systemctl enable ly
      ;;
    none) info "No login manager selected." ;;
  esac
  ok "Login manager configured: $LOGIN_MGR"

  # X.org
  arch-chroot /mnt pacman -S --noconfirm xorg-server xorg-xinit
fi

# ── Phase 10: Services ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 10: Services${NC}"

# Network
case "$NETWORK" in
  networkmanager)
    arch-chroot /mnt systemctl enable NetworkManager
    ok "NetworkManager enabled."
    ;;
  networkmanager-iwd)
    arch-chroot /mnt pacman -S --noconfirm iwd
    arch-chroot /mnt systemctl enable NetworkManager iwd
    # Configure NM to use iwd backend
    mkdir -p /mnt/etc/NetworkManager/conf.d
    echo -e "[device]\nwifi.backend=iwd" > /mnt/etc/NetworkManager/conf.d/iwd.conf
    ok "NetworkManager + iwd enabled."
    ;;
  disabled)
    info "Network manager disabled. Skipping."
    ;;
esac

# Bluetooth
if [[ "$BLUETOOTH" == "True" || "$BLUETOOTH" == "true" ]]; then
  arch-chroot /mnt pacman -S --noconfirm bluez bluez-utils
  arch-chroot /mnt systemctl enable bluetooth
  ok "Bluetooth enabled."
fi

# Audio
case "$AUDIO" in
  pipewire)
    arch-chroot /mnt pacman -S --noconfirm pipewire pipewire-alsa pipewire-audio pipewire-pulse wireplumber
    ok "PipeWire installed."
    ;;
  pulseaudio)
    arch-chroot /mnt pacman -S --noconfirm pulseaudio pulseaudio-alsa
    ok "PulseAudio installed."
    ;;
  disabled)
    info "Audio server disabled. Skipping."
    ;;
esac

# ── Phase 11: Finalize ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Phase 11: Finalization${NC}"

info "Copying config.json to installed system..."
mkdir -p /mnt/etc/arch-installer
cp "$CONFIG_FILE" /mnt/etc/arch-installer/install-config.json
ok "Config saved."

info "Syncing filesystem..."
sync
ok "Sync complete."

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   Installation complete! Reboot to start Arch Linux. ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}umount -R /mnt && reboot${NC}"
echo ""
info "Log saved to: $LOG_FILE"
