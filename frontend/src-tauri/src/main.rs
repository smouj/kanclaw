#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{thread, time::Duration};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};

fn wait_for_server() {
  for _ in 0..40 {
    if std::net::TcpStream::connect("127.0.0.1:3210").is_ok() {
      return;
    }
    thread::sleep(Duration::from_millis(350));
  }
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      let handle = app.handle().clone();
      let command = handle
        .shell()
        .sidecar("kanclaw-next-server")
        .expect("failed to resolve kanclaw next sidecar")
        .env("PORT", "3210")
        .env("HOST", "127.0.0.1")
        .env("NODE_ENV", "production");

      let (mut rx, _child) = command.spawn().expect("failed to spawn kanclaw sidecar");
      let app_handle = handle.clone();

      tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
          match event {
            CommandEvent::Stdout(line) => {
              let _ = app_handle.emit("kanclaw-sidecar-stdout", String::from_utf8_lossy(&line).to_string());
            }
            CommandEvent::Stderr(line) => {
              let _ = app_handle.emit("kanclaw-sidecar-stderr", String::from_utf8_lossy(&line).to_string());
            }
            CommandEvent::Terminated(_) => break,
            _ => {}
          }
        }
      });

      wait_for_server();

      if app.get_webview_window("main").is_none() {
        let _window = WebviewWindowBuilder::new(app, "main", WebviewUrl::External("http://127.0.0.1:3210".parse().unwrap()))
          .title("KanClaw")
          .inner_size(1600.0, 980.0)
          .min_inner_size(1200.0, 760.0)
          .build()?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}