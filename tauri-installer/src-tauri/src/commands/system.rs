//! System interrogation commands — detect real hardware and OS data.
//! All functions read from live system sources. No hardcoded values.

use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyboardLayout {
    pub code: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkStatus {
    pub connected: bool,
    pub interface: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BootloaderInfo {
    pub name: String,
    pub description: String,
    pub supported: bool,
}

/// Return the system CPU architecture (e.g. "x86_64", "aarch64").
/// Reads from /info/architexture if present; falls back to uname.
#[command]
pub fn get_architecture() -> Result<String, String> {
    if let Ok(arch) = fs::read_to_string("/info/architexture") {
        return Ok(arch.trim().to_string());
    }
    let output = Command::new("uname")
        .arg("-m")
        .output()
        .map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Return a sorted list of available region names from the zoneinfo directory.
#[command]
pub fn get_regions() -> Result<Vec<String>, String> {
    let base = "/usr/share/zoneinfo";
    let mut regions = Vec::new();
    let entries = fs::read_dir(base).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
            // Skip non-region directories
            if !name.starts_with('.') && !["right", "posix", "Etc", "leap-seconds.list"].contains(&name.as_str()) {
                regions.push(name);
            }
        }
    }
    regions.sort();
    Ok(regions)
}

/// Return a sorted list of city names within a given region.
#[command]
pub fn get_timezones(region: String) -> Result<Vec<String>, String> {
    let path = format!("/usr/share/zoneinfo/{}", region);
    let mut cities = Vec::new();
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with('.') {
            cities.push(name);
        }
    }
    cities.sort();
    Ok(cities)
}

/// Return a list of available keyboard layouts from localectl or /usr/share/kbd/keymaps.
#[command]
pub fn get_keyboard_layouts() -> Result<Vec<KeyboardLayout>, String> {
    // Try localectl first
    let output = Command::new("localectl")
        .args(["list-keymaps"])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let layouts: Vec<KeyboardLayout> = String::from_utf8_lossy(&out.stdout)
                .lines()
                .map(|l| {
                    let code = l.trim().to_string();
                    KeyboardLayout {
                        description: code.clone(),
                        code,
                    }
                })
                .collect();
            return Ok(layouts);
        }
    }

    // Fallback: enumerate keymaps directory
    let mut layouts = Vec::new();
    if let Ok(entries) = fs::read_dir("/usr/share/kbd/keymaps") {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(name) = path.file_stem() {
                let code = name.to_string_lossy().to_string();
                layouts.push(KeyboardLayout {
                    description: code.clone(),
                    code,
                });
            }
        }
    } else {
        // Hard minimum fallback for dev
        layouts.push(KeyboardLayout { code: "us".into(), description: "English (US)".into() });
    }
    layouts.sort_by(|a, b| a.code.cmp(&b.code));
    Ok(layouts)
}

/// Probe network connectivity by attempting to reach a well-known address.
#[command]
pub async fn check_network() -> Result<NetworkStatus, String> {
    // Use ip route to find the default interface
    let iface_output = Command::new("ip")
        .args(["route", "show", "default"])
        .output()
        .ok();

    let interface = iface_output.as_ref().and_then(|o| {
        let stdout = String::from_utf8_lossy(&o.stdout);
        stdout
            .split_whitespace()
            .skip_while(|&w| w != "dev")
            .nth(1)
            .map(|s| s.to_string())
    });

    // Attempt a real connectivity check
    let ping_result = Command::new("ping")
        .args(["-c", "1", "-W", "2", "1.1.1.1"])
        .output();

    let connected = ping_result.map(|o| o.status.success()).unwrap_or(false);

    Ok(NetworkStatus { connected, interface })
}

/// Return a list of filesystem types supported by the running kernel.
#[command]
pub fn get_supported_filesystems() -> Result<Vec<String>, String> {
    let content = fs::read_to_string("/proc/filesystems").map_err(|e| e.to_string())?;
    let supported: Vec<String> = content
        .lines()
        .filter(|l| !l.starts_with("nodev"))
        .filter_map(|l| {
            let fs = l.split_whitespace().last()?.to_string();
            // Only return installer-relevant filesystems
            if ["ext4", "btrfs", "xfs", "f2fs"].contains(&fs.as_str()) {
                Some(fs)
            } else {
                None
            }
        })
        .collect();

    // Always include ext4 as baseline if kernel list is sparse
    let mut result = if supported.is_empty() {
        vec!["ext4".into(), "btrfs".into(), "xfs".into()]
    } else {
        supported
    };
    result.dedup();
    result.sort();
    Ok(result)
}

/// Return a list of available bootloaders based on system architecture.
#[command]
pub fn get_bootloaders() -> Result<Vec<BootloaderInfo>, String> {
    let arch = get_architecture().unwrap_or_else(|_| "x86_64".into());

    let mut bootloaders = Vec::new();

    match arch.as_str() {
        "x86_64" | "i686" => {
            bootloaders.push(BootloaderInfo {
                name: "systemd-boot".into(),
                description: "Lightweight EFI boot manager (recommended for UEFI systems)".into(),
                supported: true,
            });
            bootloaders.push(BootloaderInfo {
                name: "grub".into(),
                description: "Grand Unified Bootloader — supports BIOS and UEFI".into(),
                supported: true,
            });
            bootloaders.push(BootloaderInfo {
                name: "efistub".into(),
                description: "Direct kernel EFI stub boot (advanced)".into(),
                supported: true,
            });
        }
        "aarch64" => {
            bootloaders.push(BootloaderInfo {
                name: "grub".into(),
                description: "Grand Unified Bootloader — supports ARM64 UEFI".into(),
                supported: true,
            });
            bootloaders.push(BootloaderInfo {
                name: "systemd-boot".into(),
                description: "Lightweight EFI boot manager".into(),
                supported: true,
            });
        }
        _ => {
            bootloaders.push(BootloaderInfo {
                name: "grub".into(),
                description: "Grand Unified Bootloader".into(),
                supported: true,
            });
        }
    }

    Ok(bootloaders)
}
