import { NextResponse } from "next/server";
import os from "os";

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

export async function GET(): Promise<NextResponse<SystemStats>> {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    const cpus = os.cpus();
    const numCores = cpus.length;

    // Calculate CPU usage based on load average
    const loadAverage = os.loadavg();
    const cpuUsage = Math.min((loadAverage[0] / numCores) * 100, 100);

    const stats: SystemStats = {
      cpu: {
        cores: numCores,
        usage: Math.round(cpuUsage * 10) / 10,
      },
      memory: {
        total: Math.round(totalMemory / (1024 * 1024 * 1024) * 10) / 10,
        used: Math.round(usedMemory / (1024 * 1024 * 1024) * 10) / 10,
        percentage: Math.round(memoryPercentage * 10) / 10,
      },
      uptime: Math.round(os.uptime()),
      loadAverage: loadAverage.map(l => Math.round(l * 100) / 100),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to get system stats:", error);
    return NextResponse.json(
      {
        cpu: { cores: 0, usage: 0 },
        memory: { total: 0, used: 0, percentage: 0 },
        uptime: 0,
        loadAverage: [0, 0, 0],
      },
      { status: 500 }
    );
  }
}
