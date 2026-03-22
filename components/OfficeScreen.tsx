"use client";

import { useState, useEffect, useRef } from "react";

// Pixel art constants
const TILE = 32; // pixels per tile
const COLS = 24;
const ROWS = 16;

// Tile types
const T = {
  FLOOR: 0,
  WALL_H: 1,
  WALL_V: 2,
  DESK: 3,
  CHAIR: 4,
  MONITOR: 5,
  PLANT: 6,
  COOLER: 7, // water cooler
  WINDOW: 8,
  DOOR: 9,
  RUG: 10,
  BOOKSHELF: 11,
  LAMP: 12,
};

// Colors
const COLORS: Record<number, string> = {
  [T.FLOOR]: "#1a1a1a",
  [T.WALL_H]: "#2a2a2a",
  [T.WALL_V]: "#222",
  [T.DESK]: "#3d2b1f",
  [T.CHAIR]: "#1e1e4a",
  [T.MONITOR]: "#111",
  [T.PLANT]: "#1a3a1a",
  [T.COOLER]: "#1a2a3a",
  [T.WINDOW]: "#0d1a2e",
  [T.DOOR]: "#3d2b1f",
  [T.RUG]: "#1a1528",
  [T.BOOKSHELF]: "#2a1f0f",
  [T.LAMP]: "#2a2a1a",
};

type Agent = {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  status: "working" | "idle" | "chatting";
  activity: string;
  targetX: number;
  targetY: number;
  moveTimer: number;
};

const INITIAL_AGENTS: Agent[] = [
  {
    id: "xz",
    name: "XiaoZhu 🐖",
    emoji: "🐷",
    x: 4, y: 4,
    status: "working",
    activity: "Building dashboard...",
    targetX: 4, targetY: 4,
    moveTimer: 0,
  },
  {
    id: "alpha",
    name: "Subagent α",
    emoji: "🤖",
    x: 10, y: 4,
    status: "idle",
    activity: "Waiting for tasks",
    targetX: 10, targetY: 4,
    moveTimer: 0,
  },
  {
    id: "beta",
    name: "Subagent β",
    emoji: "🔍",
    x: 16, y: 4,
    status: "idle",
    activity: "Standing by",
    targetX: 16, targetY: 4,
    moveTimer: 0,
  },
];

// Desk positions (row, col)
const DESKS = [
  { x: 4, y: 3 }, { x: 5, y: 3 },
  { x: 10, y: 3 }, { x: 11, y: 3 },
  { x: 16, y: 3 }, { x: 17, y: 3 },
];

// Water cooler position
const COOLER_POS = { x: 20, y: 8 };

function buildMap(): number[][] {
  const map: number[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(T.FLOOR));

  // Outer walls
  for (let x = 0; x < COLS; x++) {
    map[0][x] = T.WALL_H;
    map[ROWS - 1][x] = T.WALL_H;
  }
  for (let y = 0; y < ROWS; y++) {
    map[y][0] = T.WALL_V;
    map[y][COLS - 1] = T.WALL_V;
  }

  // Windows along top wall
  for (let x = 2; x < COLS - 2; x += 4) {
    if (x < COLS - 3) map[0][x] = T.WINDOW;
  }

  // Door
  map[ROWS - 1][12] = T.DOOR;

  // Rug in center area
  for (let y = 7; y <= 11; y++) {
    for (let x = 8; x <= 15; x++) {
      map[y][x] = T.RUG;
    }
  }

  // Desks (row 3) - 3 workstations
  DESKS.forEach(({ x, y }) => {
    map[y][x] = T.DESK;
    map[y][x + 1] = T.MONITOR;
    map[y + 1][x] = T.CHAIR;
  });

  // Plants in corners
  map[1][1] = T.PLANT;
  map[1][COLS - 2] = T.PLANT;
  map[ROWS - 2][1] = T.PLANT;

  // Bookshelf along left wall
  for (let y = 4; y <= 8; y++) {
    map[y][1] = T.BOOKSHELF;
  }

  // Water cooler
  map[COOLER_POS.y][COOLER_POS.x] = T.COOLER;

  // Lamp
  map[10][3] = T.LAMP;
  map[10][19] = T.LAMP;

  return map;
}

const MAP = buildMap();

// Rendering helpers
function drawTile(ctx: CanvasRenderingContext2D, type: number, x: number, y: number) {
  const px = x * TILE;
  const py = y * TILE;

  ctx.fillStyle = COLORS[type] || COLORS[T.FLOOR];
  ctx.fillRect(px, py, TILE, TILE);

  switch (type) {
    case T.FLOOR:
      ctx.strokeStyle = "#1e1e1e";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, TILE, TILE);
      break;
    case T.WALL_H:
    case T.WALL_V:
      ctx.fillStyle = "#333";
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      break;
    case T.WINDOW:
      ctx.fillStyle = "#0d1a2e";
      ctx.fillRect(px, py, TILE, TILE);
      // Glass panes
      ctx.fillStyle = "#1a3a5a";
      ctx.fillRect(px + 4, py + 4, TILE / 2 - 5, TILE - 8);
      ctx.fillRect(px + TILE / 2 + 1, py + 4, TILE / 2 - 5, TILE - 8);
      ctx.fillStyle = "#2a5a8a44";
      ctx.fillRect(px + 4, py + 4, TILE / 2 - 5, TILE - 8);
      break;
    case T.DESK:
      ctx.fillStyle = "#5a3d2a";
      ctx.fillRect(px + 2, py + 4, TILE - 4, TILE - 6);
      ctx.fillStyle = "#3d2b1f";
      ctx.fillRect(px + 2, py + TILE - 6, TILE - 4, 4);
      break;
    case T.MONITOR:
      ctx.fillStyle = "#0a0a15";
      ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 12);
      // Screen glow
      ctx.fillStyle = "#7c5af411";
      ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 14);
      ctx.fillStyle = "#7c5af4";
      ctx.fillRect(px + 6, py + 6, TILE - 12, 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(px + 6, py + 10, TILE - 16, 1);
      ctx.fillRect(px + 6, py + 13, TILE - 12, 1);
      break;
    case T.CHAIR:
      ctx.fillStyle = "#2a2a6a";
      ctx.fillRect(px + 4, py + 2, TILE - 8, TILE / 2);
      ctx.fillStyle = "#1e1e4a";
      ctx.fillRect(px + 6, py + TILE / 2, TILE - 12, TILE / 2 - 4);
      break;
    case T.PLANT:
      ctx.fillStyle = "#1a2a1a";
      ctx.fillRect(px + 8, py + 16, 16, 14);
      ctx.fillStyle = "#2a5a2a";
      ctx.fillRect(px + 6, py + 6, 20, 14);
      ctx.fillStyle = "#1a4a1a";
      ctx.fillRect(px + 10, py + 2, 12, 8);
      break;
    case T.COOLER:
      ctx.fillStyle = "#1a3a5a";
      ctx.fillRect(px + 6, py + 4, 20, 24);
      ctx.fillStyle = "#2a5a8a";
      ctx.fillRect(px + 8, py + 6, 16, 14);
      ctx.fillStyle = "#5aaaff44";
      ctx.fillRect(px + 9, py + 7, 14, 12);
      ctx.fillStyle = "#ff5a5a";
      ctx.fillRect(px + 8, py + 22, 6, 4);
      ctx.fillStyle = "#5a5aff";
      ctx.fillRect(px + 18, py + 22, 6, 4);
      break;
    case T.RUG:
      ctx.fillStyle = "#1a1528";
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = "#2a2038";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
      break;
    case T.BOOKSHELF:
      ctx.fillStyle = "#3a2a10";
      ctx.fillRect(px + 2, py, TILE - 4, TILE);
      for (let i = 0; i < 4; i++) {
        const bookColors = ["#7c5af4", "#3b82f6", "#22c55e", "#eab308", "#ef4444"];
        ctx.fillStyle = bookColors[i % bookColors.length];
        ctx.fillRect(px + 4 + i * 6, py + 3, 5, TILE - 8);
      }
      break;
    case T.LAMP:
      ctx.fillStyle = "#3a3a2a";
      ctx.fillRect(px + 14, py + 20, 4, 12);
      ctx.fillStyle = "#5a5a2a";
      ctx.beginPath();
      ctx.arc(px + 16, py + 14, 8, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = "#ffff99";
      ctx.beginPath();
      ctx.arc(px + 16, py + 14, 5, 0, Math.PI);
      ctx.fill();
      break;
    case T.DOOR:
      ctx.fillStyle = "#5a3d2a";
      ctx.fillRect(px + 2, py + 4, TILE - 4, TILE - 4);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(px + TILE - 8, py + TILE / 2 - 2, 4, 4);
      break;
  }
}

function drawAgent(ctx: CanvasRenderingContext2D, agent: Agent, frame: number) {
  const px = agent.x * TILE + TILE / 2;
  const py = agent.y * TILE + TILE / 2;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(px, py + 12, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body bounce
  const bounce = agent.status === "working" ? Math.sin(frame * 0.15) * 2 : 0;
  const bodyY = py - 6 + bounce;

  // Agent circle (body)
  const agentColor =
    agent.id === "xz" ? "#7c5af4" :
    agent.id === "alpha" ? "#3b82f6" : "#22c55e";

  ctx.fillStyle = agentColor;
  ctx.beginPath();
  ctx.arc(px, bodyY, 11, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(px - 3, bodyY - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Face emoji
  ctx.font = "14px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(agent.emoji, px, bodyY);

  // Status indicator
  const statusColor =
    agent.status === "working" ? "#22c55e" :
    agent.status === "chatting" ? "#eab308" : "#888";
  ctx.fillStyle = statusColor;
  ctx.beginPath();
  ctx.arc(px + 9, bodyY - 9, 4, 0, Math.PI * 2);
  ctx.fill();

  // Name label
  if (frame % 120 < 80) { // show name periodically
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    const nameWidth = ctx.measureText(agent.name).width + 8;
    ctx.fillRect(px - nameWidth / 2, bodyY - 28, nameWidth, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "9px monospace";
    ctx.fillText(agent.name, px, bodyY - 21);
  }

  // Activity bubble when working
  if (agent.status === "working" && frame % 60 < 40) {
    ctx.fillStyle = "rgba(124,90,244,0.85)";
    const bubbleW = Math.min(ctx.measureText(agent.activity).width + 8, 100);
    ctx.fillRect(px + 14, bodyY - 20, bubbleW, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "8px monospace";
    const shortActivity = agent.activity.length > 15 ? agent.activity.slice(0, 15) + "…" : agent.activity;
    ctx.fillText(shortActivity, px + 18, bodyY - 13);
  }
}

export default function OfficeScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>(INITIAL_AGENTS.map(a => ({ ...a })));
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; agent: Agent } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      frameRef.current++;
      const frame = frameRef.current;

      // Move agents occasionally
      if (frame % 120 === 0) {
        agentsRef.current = agentsRef.current.map((agent) => {
          const rand = Math.random();
          if (agent.status === "idle" && rand < 0.3) {
            // Move to water cooler
            return {
              ...agent,
              targetX: COOLER_POS.x - 1,
              targetY: COOLER_POS.y,
              status: "chatting" as const,
              activity: "Getting water...",
            };
          }
          if (agent.status === "chatting" && rand < 0.4) {
            // Return to desk
            const desk = DESKS.find((_, i) =>
              (agent.id === "xz" && i === 0) ||
              (agent.id === "alpha" && i === 2) ||
              (agent.id === "beta" && i === 4)
            );
            if (desk) {
              return {
                ...agent,
                targetX: desk.x,
                targetY: desk.y + 1,
                status: "working" as const,
                activity: "Back to work!",
              };
            }
          }
          if (agent.status === "working" && rand < 0.1) {
            return {
              ...agent,
              activity: ["Coding...", "Thinking...", "Searching...", "Processing..."][Math.floor(Math.random() * 4)],
            };
          }
          return agent;
        });
      }

      // Smooth movement
      agentsRef.current = agentsRef.current.map((agent) => {
        if (agent.x !== agent.targetX || agent.y !== agent.targetY) {
          const dx = agent.targetX - agent.x;
          const dy = agent.targetY - agent.y;
          const speed = 0.05;
          return {
            ...agent,
            x: Math.abs(dx) < 0.05 ? agent.targetX : agent.x + dx * speed,
            y: Math.abs(dy) < 0.05 ? agent.targetY : agent.y + dy * speed,
          };
        }
        return agent;
      });

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw map
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          drawTile(ctx, MAP[y][x], x, y);
        }
      }

      // Draw agents
      for (const agent of agentsRef.current) {
        drawAgent(ctx, agent, frame);
      }

      // Scanlines effect
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = (COLS * TILE) / rect.width;
    const scaleY = (ROWS * TILE) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const hoveredAgent = agentsRef.current.find((a) => {
      const ax = a.x * TILE + TILE / 2;
      const ay = a.y * TILE + TILE / 2;
      return Math.abs(mx - ax) < 20 && Math.abs(my - ay) < 20;
    });

    if (hoveredAgent) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, agent: hoveredAgent });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "var(--text-primary)" }}>
            Office
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Live 2D pixel art view of agent activity
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {agentsRef.current.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: a.status === "working" ? "#22c55e" : a.status === "chatting" ? "#eab308" : "#888",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          background: "#080808",
          position: "relative",
        }}
      >
        <div style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={COLS * TILE}
            height={ROWS * TILE}
            style={{
              imageRendering: "pixelated",
              border: "2px solid #333",
              borderRadius: "4px",
              maxWidth: "100%",
              maxHeight: "calc(100vh - 200px)",
              cursor: "crosshair",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
          />

          {/* Tooltip */}
          {tooltip && (
            <div
              style={{
                position: "absolute",
                left: tooltip.x + 12,
                top: tooltip.y - 10,
                background: "rgba(0,0,0,0.85)",
                border: "1px solid #7c5af4",
                borderRadius: "6px",
                padding: "8px 12px",
                pointerEvents: "none",
                zIndex: 10,
                minWidth: "140px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                {tooltip.agent.name}
              </div>
              <div style={{ fontSize: "11px", color: "#a78bfa", marginBottom: "4px" }}>
                Status: {tooltip.agent.status}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {tooltip.agent.activity}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            background: "rgba(0,0,0,0.7)",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "8px 12px",
          }}
        >
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "500" }}>Legend</div>
          {[
            { color: "#22c55e", label: "Working" },
            { color: "#eab308", label: "At cooler / Chatting" },
            { color: "#888", label: "Idle" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
