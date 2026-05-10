#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{config, disk, system};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            system::get_architecture,
            system::get_regions,
            system::get_timezones,
            system::get_keyboard_layouts,
            system::check_network,
            system::get_supported_filesystems,
            system::get_bootloaders,
            disk::get_disks,
            disk::launch_cfdisk,
            config::save_config,
            config::start_installation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
