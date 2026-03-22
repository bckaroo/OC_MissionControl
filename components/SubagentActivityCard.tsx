"use client";

import React from "react";
import { Briefcase, CheckCircle2, AlertCircle, Zap } from "lucide-react";

interface SubagentActivity {
  project: string;
  currentTask: string;
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  skills?: string[];
}

interface SubagentActivityCardProps {
  agent: {
    id: string;
    name: string;
    emoji: string;
    status: "working" | "idle" | "blocked" | "offline";
    model: string;
    currentTask: string | null;
    lastActivity: string;
  };
  activity: SubagentActivity;
  onViewDetails?: () => void;
}

const STATUS_COLORS = {
  working: "#3b82f6",
  idle: "#22c55e",
  blocked: "#f97316",
  offline: "#6b7280",
};

export default function SubagentActivityCard({
  agent,
  activity,
  onViewDetails,
}: SubagentActivityCardProps) {
  const isWorking = agent.status === "working";
  const isBlocked = agent.status === "blocked";

  // Parse time
  const startDate = new Date(activity.startTime);
  const elapsed = Math.floor((Date.now() - startDate.getTime()) / 1000);
  const elapsedStr =
    elapsed < 60
      ? `${elapsed}s ago`
      : elapsed < 3600
      ? `${Math.floor(elapsed / 60)}m ago`
      : `${Math.floor(elapsed / 3600)}h ago`;

  return (
    <div
      onClick={onViewDetails}
      style={{
        padding: "14px 16px",
        borderRadius: "10px",
        background: isWorking
          ? "rgba(59,130,246,0.08)"
          : isBlocked
          ? "rgba(249,115,22,0.08)"
          : "var(--bg-tertiary)",
        border: isWorking
          ? "1px solid rgba(59,130,246,0.25)"
          : isBlocked
          ? "1px solid rgba(249,115,22,0.25)"
          : "1px solid var(--border)",
        cursor: onViewDetails ? "pointer" : "default",
        transition: "all 0.2s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (onViewDetails) {
          (e.currentTarget as HTMLDivElement).style.background = isWorking
            ? "rgba(59,130,246,0.12)"
            : isBlocked
            ? "rgba(249,115,22,0.12)"
            : "var(--bg-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = isWorking
          ? "rgba(59,130,246,0.08)"
          : isBlocked
          ? "rgba(249,115,22,0.08)"
          : "var(--bg-tertiary)";
      }}
    >
      {/* Status indicator */}
      <div style={{ position: "absolute", top: "12px", right: "12px" }}>
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: STATUS_COLORS[agent.status],
            boxShadow: isWorking
              ? `0 0 6px ${STATUS_COLORS.working}`
              : undefined,
          }}
        />
      </div>

      {/* Header: emoji + name + model */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "20px" }}>{agent.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
            {agent.name}
          </div>
          <div
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {agent.model.split("/").pop()?.slice(0, 20)}
          </div>
        </div>
      </div>

      {/* Project section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
          padding: "6px 8px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "6px",
        }}
      >
        <Briefcase size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
        <div
          style={{
            fontSize: "11px",
            fontWeight: "500",
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {activity.project}
        </div>
      </div>

      {/* Current task */}
      <div
        style={{
          marginBottom: "8px",
          padding: "6px 8px",
          background: isWorking ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
          borderLeft: `2px solid ${isWorking ? "#3b82f6" : "transparent"}`,
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "500",
            color: isWorking ? "#93c5fd" : "var(--text-secondary)",
            lineHeight: "1.4",
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
          }}
        >
          {isWorking ? (
            <Zap size={12} style={{ flexShrink: 0, marginTop: "2px" }} />
          ) : isBlocked ? (
            <AlertCircle size={12} style={{ flexShrink: 0, marginTop: "2px", color: "#f97316" }} />
          ) : (
            <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: "2px", color: "#22c55e" }} />
          )}
          <span>{activity.currentTask}</span>
        </div>
      </div>

      {/* Progress bar */}
      {isWorking && (
        <div style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Progress</span>
            <span style={{ fontSize: "10px", fontWeight: "600", color: "#3b82f6" }}>
              {activity.progress}%
            </span>
          </div>
          <div style={{ height: "3px", background: "rgba(59,130,246,0.2)", borderRadius: "2px" }}>
            <div
              style={{
                height: "100%",
                width: `${activity.progress}%`,
                background: "#3b82f6",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Footer: timing + skills */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}
      >
        <div>
          <div>Started {elapsedStr}</div>
          {activity.estimatedCompletion && (
            <div style={{ color: "var(--text-muted)", fontSize: "9px", marginTop: "2px" }}>
              ~{activity.estimatedCompletion}
            </div>
          )}
        </div>
        {activity.skills && activity.skills.length > 0 && (
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {activity.skills.slice(0, 2).map((skill) => (
              <div
                key={skill}
                style={{
                  padding: "2px 5px",
                  background: "rgba(124,90,244,0.2)",
                  borderRadius: "3px",
                  color: "#a78bfa",
                  whiteSpace: "nowrap",
                  fontSize: "9px",
                }}
              >
                {skill}
              </div>
            ))}
            {activity.skills.length > 2 && (
              <div
                style={{
                  padding: "2px 5px",
                  color: "var(--text-muted)",
                  fontSize: "9px",
                }}
              >
                +{activity.skills.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
