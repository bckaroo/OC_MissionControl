"use client";

import React from "react";
import { Plus, Zap, Eye, CheckCircle2 } from "lucide-react";

type EmptyStateType = "backlog" | "in-progress" | "review" | "done" | "activity";

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
}

export default function EmptyState({ type, onAction }: EmptyStateProps) {
  const configs: Record<EmptyStateType, { icon: React.ReactNode; title: string; message: string; cta?: string; color: string }> = {
    backlog: {
      icon: <Plus size={32} />,
      title: "No backlog items",
      message: "Click the + button to add a new task or drag existing tasks here.",
      cta: "Create Task",
      color: "#8b5cf6",
    },
    "in-progress": {
      icon: <Zap size={32} />,
      title: "Nothing in progress",
      message: "Drag tasks here to start working on them.",
      color: "#3b82f6",
    },
    review: {
      icon: <Eye size={32} />,
      title: "No reviews pending",
      message: "Tasks move here when they're ready for review.",
      color: "#f59e0b",
    },
    done: {
      icon: <CheckCircle2 size={32} />,
      title: "No completed tasks",
      message: "Completed tasks will appear here.",
      color: "#22c55e",
    },
    activity: {
      icon: <Zap size={32} />,
      title: "No activity yet",
      message: "Agent activity and task executions will show here.",
      color: "#fbbf24",
    },
  };

  const cfg = configs[type];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
        padding: "24px 16px",
        textAlign: "center",
        opacity: 0.6,
      }}
    >
      <div style={{ color: cfg.color }}>{cfg.icon}</div>
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-secondary)",
            marginBottom: "6px",
          }}
        >
          {cfg.title}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4", maxWidth: "200px" }}>
          {cfg.message}
        </div>
      </div>
      {cfg.cta && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: "8px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#fff",
            background: cfg.color,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.opacity = "1";
          }}
        >
          + {cfg.cta}
        </button>
      )}
    </div>
  );
}
