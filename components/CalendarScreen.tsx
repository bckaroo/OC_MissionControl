"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  heartbeat: { bg: "rgba(124,90,244,0.12)", text: "#a78bfa", icon: "💓" },
  monitoring: { bg: "rgba(14,165,233,0.12)", text: "#38bdf8", icon: "👁️" },
  "task-management": { bg: "rgba(251,146,60,0.12)", text: "#fed7aa", icon: "✅" },
  communication: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", icon: "💬" },
  memory: { bg: "rgba(236,72,153,0.12)", text: "#f472b6", icon: "🧠" },
  calendar: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", icon: "📅" },
};

function generateWeekPattern(job: CalendarEvent): Record<number, string[]> {
  const pattern: Record<number, string[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
  };

  const frequency = job.frequency;

  if (frequency.includes("30s") || frequency.includes("10m") || frequency.includes("30m") || frequency.includes("1h")) {
    for (let i = 0; i < 7; i++) {
      pattern[i] = ["Active"];
    }
  } else if (frequency.includes("24h")) {
    for (let i = 0; i < 7; i++) {
      pattern[i] = ["Daily"];
    }
  }

  return pattern;
}

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error("Failed to fetch calendar events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", color: "var(--text-primary)" }}>
        Loading calendar...
      </div>
    );
  }

  const cronJobs = events.filter((e) => e.type === "cron");
  const heartbeats = events.filter((e) => e.type === "heartbeat");
  const allJobs = cronJobs;

  // ============== SLIDES ==============
  const Slide7DayGrid = () => (
    <div style={{ height: "100%" }}>
      <h2 style={{ color: "var(--text-primary)", marginBottom: "16px", fontSize: "16px", fontWeight: "bold" }}>
        7-Day Schedule
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "10px",
          height: "calc(100% - 50px)",
        }}
      >
        {DAYS.map((day, idx) => {
          const dayJobs = allJobs.filter((job) => {
            const pattern = generateWeekPattern(job);
            return pattern[idx]?.length > 0;
          });

          // Time slots: 00:00-06:00, 06:00-12:00, 12:00-18:00, 18:00-24:00
          const timeSlots = [
            { label: "00-06", jobs: dayJobs.slice(0, 1) },
            { label: "06-12", jobs: dayJobs.slice(1, 2) },
            { label: "12-18", jobs: dayJobs.slice(2, 3) },
            { label: "18-24", jobs: dayJobs.slice(3) },
          ];

          return (
            <div
              key={idx}
              style={{
                background: "var(--bg-tertiary)",
                borderRadius: "6px",
                border: "1px solid var(--bg-tertiary)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: "320px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  padding: "10px 8px",
                  background: "var(--accent-purple)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                {day}
              </div>

              {/* Time Slots */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "6px" }}>
                {timeSlots.map((slot, slotIdx) => (
                  <div
                    key={slotIdx}
                    style={{
                      flex: 1,
                      borderBottom: slotIdx < 3 ? "1px solid var(--bg-secondary)" : "none",
                      padding: "8px 6px",
                      color: "var(--text-primary)",
                      opacity: 0.7,
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ fontSize: "9px", opacity: 0.6, fontWeight: "600" }}>{slot.label}</div>
                    {slot.jobs.map((job) => {
                      const colors = CATEGORY_COLORS[job.category] || {
                        bg: "rgba(100,100,100,0.1)",
                        text: "var(--text-primary)",
                        icon: "📌",
                      };

                      return (
                        <div
                          key={job.id}
                          style={{
                            padding: "6px 8px",
                            background: colors.bg,
                            borderLeft: `2px solid ${colors.text}`,
                            borderRadius: "3px",
                            fontSize: "10px",
                            fontWeight: "600",
                            color: colors.text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={job.name}
                        >
                          {colors.icon} {job.name}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Activity Indicator */}
              {dayJobs.length > 0 && (
                <div
                  style={{
                    padding: "6px",
                    background: "var(--bg-secondary)",
                    borderTop: "1px solid var(--bg-tertiary)",
                    fontSize: "9px",
                    color: "var(--accent-purple)",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {dayJobs.length} active
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const SlideWeeklyTable = () => (
    <div>
      <h2 style={{ color: "var(--text-primary)", marginBottom: "16px", fontSize: "16px" }}>
        Weekly Schedule
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {allJobs.map((job) => {
          const pattern = generateWeekPattern(job);
          const colors = CATEGORY_COLORS[job.category] || {
            bg: "rgba(100,100,100,0.1)",
            text: "var(--text-primary)",
          };

          return (
            <div
              key={job.id}
              style={{
                border: `1px solid ${colors.text}40`,
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: colors.bg,
                  padding: "10px",
                  borderBottom: `1px solid ${colors.text}40`,
                }}
              >
                <div style={{ fontWeight: "bold", color: colors.text, fontSize: "12px" }}>
                  {CATEGORY_COLORS[job.category]?.icon || "📌"} {job.name}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-primary)", opacity: 0.7 }}>
                  {job.frequency}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {DAYS.map((day, idx) => {
                  const execTimes = pattern[idx] || [];
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        borderRight: idx < 6 ? `1px solid ${colors.text}20` : "none",
                        background: execTimes.length > 0 ? colors.bg : "var(--bg-tertiary)",
                        fontSize: "11px",
                      }}
                    >
                      {execTimes.length > 0 ? (
                        <div style={{ color: colors.text, fontWeight: "600" }}>✓</div>
                      ) : (
                        <div style={{ color: "var(--text-primary)", opacity: 0.4 }}>—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const SlideTimeline = () => (
    <div>
      <h2 style={{ color: "var(--text-primary)", marginBottom: "16px", fontSize: "16px" }}>
        Weekly Timeline
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {allJobs.map((job) => {
          const pattern = generateWeekPattern(job);
          const colors = CATEGORY_COLORS[job.category] || {
            bg: "rgba(100,100,100,0.1)",
            text: "var(--text-primary)",
          };
          const activeDays = Object.keys(pattern)
            .filter((day) => pattern[parseInt(day)].length > 0)
            .map((d) => parseInt(d));

          return (
            <div key={job.id}>
              <div style={{ marginBottom: "6px" }}>
                <div style={{ fontWeight: "bold", color: colors.text, fontSize: "12px" }}>
                  {CATEGORY_COLORS[job.category]?.icon} {job.name}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-primary)", opacity: 0.7 }}>
                  {job.frequency}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  height: "32px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: `1px solid ${colors.text}40`,
                }}
              >
                {DAYS.map((day, idx) => {
                  const isActive = activeDays.includes(idx);
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        background: isActive ? colors.bg : "var(--bg-tertiary)",
                        borderRight: idx < 6 ? `1px solid ${colors.text}20` : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "600",
                        color: isActive ? colors.text : "var(--text-primary)",
                        opacity: isActive ? 1 : 0.4,
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const slides = [
    { name: "Grid", component: <Slide7DayGrid /> },
    { name: "Table", component: <SlideWeeklyTable /> },
    { name: "Timeline", component: <SlideTimeline /> },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid var(--bg-tertiary)",
          background: "var(--bg-secondary)",
        }}
      >
        <button
          onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
          style={{
            background: "var(--accent-purple)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
          }}
        >
          <ChevronLeft size={14} /> Prev
        </button>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: slide === idx ? "2px solid var(--accent-purple)" : "1px solid var(--bg-tertiary)",
                background: slide === idx ? "var(--accent-purple)" : "var(--bg-tertiary)",
                color: slide === idx ? "white" : "var(--text-primary)",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "600",
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSlide((s) => (s + 1) % slides.length)}
          style={{
            background: "var(--accent-purple)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
          }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      {/* Content: Slide + Reference Side-by-Side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "16px",
          padding: "20px",
          background: "var(--bg-primary)",
          overflowY: "auto",
        }}
      >
        {/* Left: Slide Content */}
        <div style={{ flex: 1 }}>
          {slides[slide].component}
        </div>

        {/* Right: Reference Cards */}
        <div
          style={{
            width: "320px",
            minWidth: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Cron Jobs Card */}
          {cronJobs.length > 0 && (
            <div
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "6px",
                padding: "12px",
                border: "1px solid var(--bg-tertiary)",
              }}
            >
              <h3 style={{ color: "var(--text-primary)", marginBottom: "10px", fontSize: "12px", fontWeight: "bold" }}>
                ⚙️ Cron Jobs
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {cronJobs.map((job) => {
                  const colors = CATEGORY_COLORS[job.category] || {
                    bg: "rgba(100,100,100,0.1)",
                    text: "var(--text-primary)",
                  };
                  return (
                    <div
                      key={job.id}
                      style={{
                        padding: "8px",
                        background: colors.bg,
                        borderRadius: "4px",
                        borderLeft: `2px solid ${colors.text}`,
                      }}
                    >
                      <div style={{ fontWeight: "600", color: colors.text, fontSize: "11px", marginBottom: "2px" }}>
                        {job.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-primary)", opacity: 0.7 }}>
                        {job.description}
                      </div>
                      <div style={{ fontSize: "9px", color: "var(--text-primary)", opacity: 0.6, marginTop: "2px" }}>
                        {job.frequency}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Heartbeats Card */}
          {heartbeats.length > 0 && (
            <div
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "6px",
                padding: "12px",
                border: "1px solid var(--bg-tertiary)",
              }}
            >
              <h3 style={{ color: "var(--text-primary)", marginBottom: "10px", fontSize: "12px", fontWeight: "bold" }}>
                💓 Heartbeats
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {heartbeats.map((hb) => {
                  const colors = CATEGORY_COLORS[hb.category] || {
                    bg: "rgba(100,100,100,0.1)",
                    text: "var(--text-primary)",
                  };
                  return (
                    <div
                      key={hb.id}
                      style={{
                        padding: "8px",
                        background: colors.bg,
                        borderRadius: "4px",
                        borderLeft: `2px solid ${colors.text}`,
                      }}
                    >
                      <div style={{ fontWeight: "600", color: colors.text, fontSize: "11px", marginBottom: "2px" }}>
                        {hb.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-primary)", opacity: 0.7 }}>
                        {hb.description}
                      </div>
                      <div style={{ fontSize: "9px", color: "var(--text-primary)", opacity: 0.6, marginTop: "2px" }}>
                        {hb.frequency}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
