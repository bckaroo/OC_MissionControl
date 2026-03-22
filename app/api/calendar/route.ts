import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

interface CalendarEvent {
  id: string;
  name: string;
  type: "cron" | "heartbeat";
  category: string;
  frequency: string;
  enabled: boolean;
  description?: string;
  app?: string;
  nextRun?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  heartbeat: { bg: "rgba(124,90,244,0.12)", text: "#a78bfa", icon: "💓" },
  monitoring: { bg: "rgba(14,165,233,0.12)", text: "#38bdf8", icon: "👁️" },
  "task-management": { bg: "rgba(251,146,60,0.12)", text: "#fed7aa", icon: "✅" },
  communication: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", icon: "💬" },
  memory: { bg: "rgba(236,72,153,0.12)", text: "#f472b6", icon: "🧠" },
  calendar: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", icon: "📅" },
};

export async function GET() {
  try {
    const events: CalendarEvent[] = [];
    const cronsDir = join(process.cwd(), "..", "..", "crons");

    // Load cron registries (system.json, mission-control.json, etc.)
    const cronRegistries = ["system.json", "mission-control.json"];
    
    for (const registry of cronRegistries) {
      try {
        const filePath = join(cronsDir, registry);
        const content = await readFile(filePath, "utf-8");
        const data = JSON.parse(content);

        if (data.jobs && Array.isArray(data.jobs)) {
          data.jobs.forEach((job: any) => {
            if (job.enabled === false) return;

            let nextRun: Date | undefined;
            const frequency = job.frequency || "unknown";

            if (frequency.includes("30s")) {
              nextRun = new Date(Date.now() + 30000);
            } else if (frequency.includes("10m")) {
              nextRun = new Date(Date.now() + 600000);
            } else if (frequency.includes("30m")) {
              nextRun = new Date(Date.now() + 1800000);
            } else if (frequency.includes("1h")) {
              nextRun = new Date(Date.now() + 3600000);
            }

            events.push({
              id: job.id,
              name: job.name,
              type: "cron",
              category: job.category || "automation",
              frequency,
              enabled: true,
              description: job.description,
              app: data.app,
              nextRun: nextRun?.toISOString(),
            });
          });
        }
      } catch (err) {
        // Silently skip missing registries
      }
    }

    // Load heartbeats registry
    try {
      const hbPath = join(cronsDir, "heartbeats.json");
      const content = await readFile(hbPath, "utf-8");
      const data = JSON.parse(content);

      if (data.heartbeats && Array.isArray(data.heartbeats)) {
        data.heartbeats.forEach((hb: any) => {
          if (hb.enabled === false) return;

          let nextRun: Date | undefined;
          const frequency = hb.frequency || "unknown";

          if (frequency.includes("30m")) {
            nextRun = new Date(Date.now() + 1800000);
          } else if (frequency.includes("60m") || frequency.includes("1h")) {
            nextRun = new Date(Date.now() + 3600000);
          } else if (frequency.includes("120m") || frequency.includes("2h")) {
            nextRun = new Date(Date.now() + 7200000);
          } else if (frequency.includes("24h")) {
            nextRun = new Date(Date.now() + 86400000);
          }

          events.push({
            id: hb.id,
            name: hb.name,
            type: "heartbeat",
            category: hb.category || "monitoring",
            frequency,
            enabled: true,
            description: hb.description,
            app: "heartbeats",
            nextRun: nextRun?.toISOString(),
          });
        });
      }
    } catch (err) {
      // Silently skip if heartbeats.json doesn't exist
    }

    // Sort by next run
    events.sort((a, b) => {
      const aTime = a.nextRun ? new Date(a.nextRun).getTime() : Number.MAX_VALUE;
      const bTime = b.nextRun ? new Date(b.nextRun).getTime() : Number.MAX_VALUE;
      return aTime - bTime;
    });

    return NextResponse.json({ events, total: events.length });
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return NextResponse.json(
      { error: String(error), events: [] },
      { status: 500 }
    );
  }
}
