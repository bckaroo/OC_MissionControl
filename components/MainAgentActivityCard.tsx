"use client";

import React from "react";
import { Briefcase, CheckCircle2, AlertCircle, Zap, TrendingUp } from "lucide-react";

interface MainAgentActivity {
  project: string;
  currentTask: string;
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  skills?: string[];
  totalTokens?: number;
  contextLimit?: number;
}

interface MainAgentActivityCardProps {
  agent: {
    id: string;
    name: string;
    emoji: string;
    status: "working" | "idle" | "blocked" | "offline";
    model: string;
    currentTask: string | null;
    lastActivity: string;
    totalTokens?: number | null;
  };
  activity: MainAgentActivity;
  onViewDetails?: () => void;
}

const STATUS_COLORS = {
  working: "#3b82f6",
  idle: "#22c55e",
  blocked: "#f97316",
  offline: "#6b7280",
};

export default function MainAgentActivityCard({
  agent,
  activity,
  onViewDetails,
}: MainAgentActivityCardProps) {
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

  // Calculate context usage percentage
  const contextLimit = activity.contextLimit || 200000;
  const contextPct = activity.totalTokens
    ? Math.round((activity.totalTokens / contextLimit) * 100)
    : 0;

  return (
    <div
      onClick={onViewDetails}
      style={{
        padding: "20px 22px",
        borderRadius: "12px",
        background: isWorking
          ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,90,244,0.08))"
          : isBlocked
          ? "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.06))"
          : "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(124,90,244,0.06))",
        border: isWorking
          ? "1px solid rgba(59,130,246,0.3)"
          : isBlocked
          ? "1px solid rgba(249,115,22,0.3)"
          : "1px solid rgba(124,90,244,0.2)",
        cursor: onViewDetails ? "pointer" : "default",
        transition: "all 0.2s",
        position: "relative",
        minWidth: "280px",
      }}
      onMouseEnter={(e) => {
        if (onViewDetails) {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 8px 24px rgba(0,0,0,0.2)";
          (e.currentTarget as HTMLDivElement).style.transform =
            "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(0)";
      }}
    >
      {/* Status indicator - top right */}
      <div style={{ position: "absolute", top: "14px", right: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isWorking && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: "700",
                color: STATUS_COLORS.working,
                letterSpacing: "0.05em",
                animation: "pulse 2s infinite",
              }}
            >
              LIVE
            </span>
          )}
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: STATUS_COLORS[agent.status],
              boxShadow: isWorking
                ? `0 0 8px ${STATUS_COLORS.working}`
                : undefined,
            }}
          />
        </div>
      </div>

      {/* Avatar + name + model */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <span style={{ fontSize: "34px" }}>{agent.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
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
          marginBottom: "10px",
          padding: "7px 10px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "7px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Briefcase size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
        <div
          style={{
            fontSize: "11px",
            fontWeight: "600",
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
          marginBottom: "10px",
          padding: "8px 10px",
          background: isWorking ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
          borderLeft: `3px solid ${isWorking ? "#3b82f6" : "transparent"}`,
          borderRadius: "5px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "500",
            color: isWorking ? "#93c5fd" : "var(--text-secondary)",
            lineHeight: "1.5",
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
          }}
        >
          {isWorking ? (
            <Zap size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
          ) : isBlocked ? (
            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: "1px", color: "#f97316" }} />
          ) : (
            <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: "1px", color: "#22c55e" }} />
          )}
          <span>{activity.currentTask}</span>
        </div>
      </div>

      {/* Progress bar - only if working */}
      {isWorking && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Progress</span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#3b82f6" }}>
              {activity.progress}%
            </span>
          </div>
          <div style={{ height: "4px", background: "rgba(59,130,246,0.15)", borderRadius: "2px" }}>
            <div
              style={{
                height: "100%",
                width: `${activity.progress}%`,
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Context usage bar */}
      {activity.totalTokens !== undefined && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Context</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color:
                  contextPct > 80
                    ? "#f97316"
                    : contextPct > 60
                    ? "#eab308"
                    : "#7c5af4",
              }}
            >
              {activity.totalTokens?.toLocaleString()} / {contextLimit.toLocaleString()}
            </span>
          </div>
          <div style={{ height: "3px", background: "rgba(124,90,244,0.15)", borderRadius: "2px" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(contextPct, 100)}%`,
                background:
                  contextPct > 80
                    ? "#f97316"
                    : contextPct > 60
                    ? "#eab308"
                    : "#7c5af4",
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
          paddingTop: "8px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
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
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {activity.skills.slice(0, 2).map((skill) => (
              <div
                key={skill}
                style={{
                  padding: "2px 6px",
                  background: "rgba(124,90,244,0.25)",
                  borderRadius: "3px",
                  color: "#a78bfa",
                  whiteSpace: "nowrap",
                  fontSize: "9px",
                  fontWeight: "500",
                }}
              >
                {skill}
              </div>
            ))}
            {activity.skills.length > 2 && (
              <div
                style={{
                  padding: "2px 6px",
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
