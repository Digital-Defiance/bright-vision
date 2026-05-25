//! System CPU/RAM snapshot for the in-app resource overlay (roadmap #33).

use serde::Serialize;
use sysinfo::System;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceSnapshot {
    pub cpu_pct: f32,
    pub mem_used_mb: u64,
    pub mem_total_mb: u64,
    pub mem_pct: f32,
    /// Utilization 0–100 when detectable (`nvidia-smi`); otherwise null.
    pub gpu_pct: Option<f32>,
    pub scope: String,
}

fn try_gpu_utilization() -> Option<f32> {
    let out = std::process::Command::new("nvidia-smi")
        .args([
            "--query-gpu=utilization.gpu",
            "--format=csv,noheader,nounits",
        ])
        .output()
        .ok()?;
    if !out.status.success() {
        return None;
    }
    let line = String::from_utf8_lossy(&out.stdout);
    let first = line.lines().find(|l| !l.trim().is_empty())?;
    let pct: f32 = first.trim().parse().ok()?;
    if pct.is_finite() && (0.0..=100.0).contains(&pct) {
        Some(pct)
    } else {
        None
    }
}

/// Refresh and return system-wide CPU/RAM (and optional NVIDIA GPU via `nvidia-smi`).
#[tauri::command]
pub fn get_resource_snapshot() -> ResourceSnapshot {
    let mut sys = System::new();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu_pct = sys.global_cpu_usage();
    let total = sys.total_memory();
    let used = sys.used_memory();
    let mem_pct = if total > 0 {
        (used as f64 / total as f64 * 100.0) as f32
    } else {
        0.0
    };

    ResourceSnapshot {
        cpu_pct,
        mem_used_mb: used / 1024 / 1024,
        mem_total_mb: total / 1024 / 1024,
        mem_pct,
        gpu_pct: try_gpu_utilization(),
        scope: "system".to_string(),
    }
}
