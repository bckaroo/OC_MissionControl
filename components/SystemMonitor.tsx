"use client";

import { useState, useEffect } from "react";
import { Activity, Zap } from "lucide-react";

interface SystemStats {
  cpu: {
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  loadAverage: number[];
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/system");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return null;
  }

  const getCpuColor = (usage: number) => {
    if (usage > 80) return "#ef4444"; // Red
    if (usage > 50) return "#f59e0b"; // Orange
    return "#22c55e"; // Green
  };

  const getMemoryColor = (percentage: number) => {
    if (percentage > 85) return "#ef4444"; // Red
    if (percentage > 70) return "#f59e0b"; // Orange
    return "#22c55e"; // Green
  };

  return (
    <div
      style={{
        padding: "6px 20px",
        background: "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        fontSize: "11px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "fit-content" }}>
        <Zap size={12} />
        <span style={{ fontWeight: "600" }}>
          {stats.cpu.usage.toFixed(0)}%
        </span>
        <span>
          CPU ({stats.cpu.cores} cores)
        </span>
      </div>

      <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "fit-content" }}>
        <Activity size={12} />
        <span style={{ fontWeight: "600" }}>
          {stats.memory.percentage.toFixed(0)}%
        </span>
        <span>({stats.memory.used}GB / {stats.memory.total}GB)</span>
      </div>

      <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />

      <div style={{ fontWeight: "600" }}>
        Load: {stats.loadAverage[0].toFixed(1)}
      </div>

      <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />

      <div style={{ fontWeight: "600" }}>
        Up: {formatUptime(stats.uptime)}
      </div>
    </div>
  );
}
