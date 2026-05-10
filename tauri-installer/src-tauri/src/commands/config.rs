//! Config persistence and installation execution.

use serde_json::Value;
use std::fs;
use std::process::Command;
use tauri::command;

const CONFIG_PATH: &str = "/installer/configs/config.json";
const INSTALL_SCRIPT: &str = "/installer/scripts/install.sh";

/// Serialize and write the installer config to /installer/configs/config.json.
/// Creates parent directories if needed.
#[command]
pub fn save_config(config: Value) -> Result<(), String> {
    // Ensure config directory exists
    if let Some(parent) = std::path::Path::new(CONFIG_PATH).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config dir: {}", e))?;
    }

    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Serialization error: {}", e))?;

    fs::write(CONFIG_PATH, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

/// Close the installer window and execute install.sh in a Ghostty terminal
/// on i3 workspace 1.
#[command]
pub async fn start_installation(app: tauri::AppHandle) -> Result<(), String> {
    // Switch to workspace 1
    Command::new("i3-msg")
        .args(["workspace", "1"])
        .output()
        .ok();

    // Launch the install script in Ghostty
    Command::new("ghostty")
        .args([
            "--command",
            &format!("bash -c '{} 2>&1 | tee /installer/logs/install.log; exec bash'", INSTALL_SCRIPT),
        ])
        .spawn()
        .map_err(|e| format!("Failed to launch install terminal: {}", e))?;

    // Close the installer application
    app.exit(0);

    Ok(())
}
