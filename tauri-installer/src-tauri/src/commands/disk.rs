//! Disk and partition detection commands.
//! Uses lsblk for reliable block device enumeration.

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskPartition {
    pub device: String,
    pub size: String,
    pub fstype: Option<String>,
    pub label: Option<String>,
    pub mountpoint: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskInfo {
    pub device: String,
    pub name: String,
    pub size: String,
    pub model: String,
    pub partitions: Vec<DiskPartition>,
}

#[derive(Debug, Deserialize)]
struct LsblkDevice {
    name: String,
    #[serde(rename = "type")]
    kind: String,
    size: String,
    model: Option<String>,
    fstype: Option<String>,
    label: Option<String>,
    mountpoint: Option<String>,
    children: Option<Vec<LsblkDevice>>,
}

#[derive(Debug, Deserialize)]
struct LsblkOutput {
    blockdevices: Vec<LsblkDevice>,
}

/// Enumerate all block devices and their partitions using lsblk.
#[command]
pub fn get_disks() -> Result<Vec<DiskInfo>, String> {
    let output = Command::new("lsblk")
        .args([
            "--json",
            "--output",
            "NAME,TYPE,SIZE,MODEL,FSTYPE,LABEL,MOUNTPOINT",
            "--tree",
        ])
        .output()
        .map_err(|e| format!("Failed to run lsblk: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "lsblk failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let parsed: LsblkOutput =
        serde_json::from_slice(&output.stdout).map_err(|e| format!("Parse error: {}", e))?;

    let mut disks = Vec::new();

    for device in parsed.blockdevices {
        if device.kind != "disk" {
            continue;
        }

        let mut partitions = Vec::new();

        if let Some(children) = &device.children {
            for child in children {
                if child.kind == "part" {
                    partitions.push(DiskPartition {
                        device: format!("/dev/{}", child.name),
                        size: child.size.clone(),
                        fstype: child.fstype.clone(),
                        label: child.label.clone(),
                        mountpoint: child.mountpoint.clone(),
                    });
                }
            }
        }

        disks.push(DiskInfo {
            device: format!("/dev/{}", device.name),
            name: device.name.clone(),
            size: device.size.clone(),
            model: device.model.unwrap_or_else(|| "Unknown".into()),
            partitions,
        });
    }

    Ok(disks)
}

/// Launch cfdisk in a new Ghostty terminal on i3 workspace 2.
/// Blocks until the terminal exits, then switches back to workspace 1.
#[command]
pub async fn launch_cfdisk(partition: Option<String>) -> Result<(), String> {
    let cfdisk_cmd = match partition {
        Some(ref p) => format!("cfdisk {}", p),
        None => "cfdisk".to_string(),
    };

    // Open Ghostty on i3 workspace 2, run cfdisk, then auto-close
    let ghostty_cmd = format!(
        "bash -c '{}; exit 0'",
        cfdisk_cmd
    );

    // Switch to workspace 2, open Ghostty
    Command::new("i3-msg")
        .args(["workspace", "2"])
        .output()
        .map_err(|e| format!("i3-msg workspace failed: {}", e))?;

    Command::new("ghostty")
        .args(["--command", &ghostty_cmd])
        .status()
        .map_err(|e| format!("Failed to launch Ghostty: {}", e))?;

    // Switch back to workspace 1 after cfdisk exits
    Command::new("i3-msg")
        .args(["workspace", "1"])
        .output()
        .map_err(|e| format!("i3-msg workspace switch back failed: {}", e))?;

    Ok(())
}
