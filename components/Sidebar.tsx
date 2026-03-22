"use client";

import { Screen } from "@/app/page";
import {
  CheckSquare2,
  Calendar,
  Hexagon,
  Brain,
  FileText,
  Users,
  Building2,
  ClipboardList,
  Wrench,
  BookOpen,
} from "lucide-react";

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  { id: "overview",           label: "Overview",         icon: "📊",                        section: "Navigation" },
  { id: "tasks",              label: "Task Board",       icon: <CheckSquare2 size={16} />,  section: "Workspace" },
  { id: "calendar",           label: "Calendar",         icon: <Calendar size={16} />,      section: "Workspace" },
  { id: "projects",           label: "Projects",         icon: <Hexagon size={16} />,       section: "Workspace" },
  { id: "memory",             label: "Memory",           icon: <Brain size={16} />,         section: "Workspace" },
  { id: "documents",          label: "Documents",        icon: <FileText size={16} />,      section: "Workspace" },
  { id: "team",               label: "Team",             icon: <Users size={16} />,         section: "Workspace" },
  { id: "situation-room",     label: "Situation Room",   icon: "🎭",                        section: "Workspace" },
  { id: "execution-history",  label: "Audit Trail",      icon: <ClipboardList size={16} />, section: "Observability" },
  { id: "models",             label: "Models",            icon: "🧠",                        section: "Infrastructure" },
  { id: "maintenance",        label: "Maintenance",      icon: <Wrench size={16} />,        section: "Infrastructure" },
  { id: "skills",             label: "Skills",            icon: <BookOpen size={16} />,      section: "Tools" },
];

export default function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  return (
    <aside
      style={{
        width: "200px",
        minWidth: "200px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          padding: "18px 14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            flexShrink: 0,
          }}
        >
          🐾
        </div>
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-primary)",
              letterSpacing: "0.01em",
            }}
          >
            Mission Control
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
            OpenClaw v2
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "4px 8px 8px", overflow: "auto" }}>
        {/* Group items by section */}
        {Array.from(new Set(navItems.map((item) => item.section))).map((section) => (
          <div key={section}>
            {/* Section header */}
            <div
              style={{
                fontSize: "10px",
                fontWeight: "600",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 8px 6px",
              }}
            >
              {section}
            </div>

            {/* Items in section */}
            {navItems
              .filter((item) => item.section === section)
              .map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 8px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      marginBottom: "1px",
                      textAlign: "left",
                      transition: "background 0.1s ease, color 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        minWidth: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                        opacity: isActive ? 1 : 0.7,
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* Label */}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isActive ? "500" : "400",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      {/* ── Status footer ── */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            background: "#7c3aed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          🐖
          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#22c55e",
              border: "1.5px solid var(--bg-sidebar)",
            }}
          />
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            XiaoZhu
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            Online
          </div>
        </div>
      </div>
    </aside>
  );
}
