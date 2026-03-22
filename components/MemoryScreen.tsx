"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { highlightMarkdown } from "@/lib/markdownHighlight";

interface MemoryFile {
  id: string;
  name: string;
  path: string;
  type: "memory" | "daily";
  lastModified: string;
  size: number;
  sections: string[];
  preview: string;
  isValid: boolean;
  validationErrors: string[];
  tags: string[];
}

function MarkdownMemoryContent({ content }: { content: string }) {
  const segments = highlightMarkdown(content);

  return (
    <>
      {segments.map((segment, idx) => (
        <span
          key={idx}
          style={{
            color: segment.color,
            fontWeight: segment.bold ? "bold" : "normal",
            fontStyle: segment.italic ? "italic" : "normal",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

function MemoryContent({ filePath }: { filePath: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/memory?file=${encodeURIComponent(filePath)}`);
        const data = await res.json();
        setContent(data.content || "");

        // Generate line numbers
        const lines = (data.content || "").split("\n").length;
        setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch file content:", error);
        setLoading(false);
      }
    };

    fetchContent();
  }, [filePath]);

  if (loading) {
    return <div style={{ padding: "16px", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--bg-secondary)", borderRadius: "6px", overflow: "hidden" }}>
      {/* Line numbers */}
      <div
        style={{
          background: "var(--bg-tertiary)",
          padding: "12px 8px",
          textAlign: "right",
          fontSize: "10px",
          color: "var(--text-muted)",
          lineHeight: "1.6",
          fontFamily: "monospace",
          userSelect: "none",
          overflowY: "auto",
          borderRight: "1px solid var(--bg-tertiary)",
        }}
      >
        {lineNumbers.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>

      {/* Content with syntax highlighting */}
      <div
        style={{
          flex: 1,
          padding: "12px 16px",
          overflow: "auto",
          fontSize: "10px",
          lineHeight: "1.6",
          fontFamily: "monospace",
        }}
      >
        <MarkdownMemoryContent content={content} />
      </div>
    </div>
  );
}

interface MemoryHealth {
  isValid: boolean;
  lastUpdated: string;
  issues: string[];
}

export default function MemoryScreen() {
  const [mainMemory, setMainMemory] = useState<MemoryFile | null>(null);
  const [dailyMemories, setDailyMemories] = useState<MemoryFile[]>([]);
  const [selected, setSelected] = useState<MemoryFile | null>(null);
  const [health, setHealth] = useState<MemoryHealth>({ isValid: true, lastUpdated: "", issues: [] });
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const res = await fetch("/api/memory");
        const data = await res.json();
        setMainMemory(data.mainMemory);
        setDailyMemories(data.dailyMemories || []);
        setHealth(data.health);
        
        // Select main memory first, then first daily
        setSelected(data.mainMemory || data.dailyMemories?.[0] || null);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch memory:", error);
        setLoading(false);
      }
    };

    fetchMemory();
    // Refresh every 60 seconds
    const interval = setInterval(fetchMemory, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
        Loading memory system...
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Health status bar */}
      <div
        style={{
          padding: "12px 16px",
          background: health.isValid ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          borderBottom: "1px solid var(--bg-tertiary)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {health.isValid ? (
          <>
            <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
            <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600" }}>
              Memory system healthy
            </span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} style={{ color: "#ef4444" }} />
            <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>
              {health.issues.length} issue(s) detected
            </span>
          </>
        )}
        <span style={{ fontSize: "9px", color: "var(--text-muted)", marginLeft: "auto" }}>
          Last updated: {new Date(health.lastUpdated).toLocaleString()}
        </span>
      </div>

      {/* Issues section */}
      {health.issues.length > 0 && (
        <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--bg-tertiary)" }}>
          {health.issues.map((issue, idx) => (
            <div key={idx} style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: idx < health.issues.length - 1 ? "4px" : "0" }}>
              ⚠️ {issue}
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left sidebar - File list */}
        <div style={{ width: "280px", borderRight: "1px solid var(--bg-tertiary)", display: "flex", flexDirection: "column", padding: "16px", overflow: "auto" }}>
          {/* Main Memory section */}
          {mainMemory && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                🧠 Long-term Memory
              </div>
              <div
                onClick={() => setSelected(mainMemory)}
                style={{
                  padding: "10px",
                  background: selected?.id === mainMemory.id ? "var(--accent-purple)" : "var(--bg-secondary)",
                  border: selected?.id === mainMemory.id ? "1px solid var(--accent-purple)" : "1px solid var(--bg-tertiary)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontSize: "10px", fontWeight: "600", color: selected?.id === mainMemory.id ? "white" : "var(--text-primary)", marginBottom: "4px" }}>
                  {mainMemory.name}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: selected?.id === mainMemory.id ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  {mainMemory.sections.length} sections
                </div>
                {mainMemory.tags?.length > 0 && (
                  <div style={{ fontSize: "8px", display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {mainMemory.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: selected?.id === mainMemory.id ? "rgba(255,255,255,0.2)" : "rgba(168,85,247,0.2)",
                          color: selected?.id === mainMemory.id ? "rgba(255,255,255,0.8)" : "#a855f7",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily memories section */}
          {dailyMemories.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                📓 Daily Notes ({dailyMemories.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {dailyMemories.map((mem) => (
                  <div
                    key={mem.id}
                    onClick={() => setSelected(mem)}
                    style={{
                      padding: "8px",
                      background: selected?.id === mem.id ? "var(--accent-purple)" : "var(--bg-secondary)",
                      border: selected?.id === mem.id ? "1px solid var(--accent-purple)" : "1px solid var(--bg-tertiary)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "9px",
                      color: selected?.id === mem.id ? "white" : "var(--text-primary)",
                    }}
                  >
                    {mem.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side - File details & sections */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px", overflow: "auto" }}>
          {selected ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: "16px" }}>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>
                  {selected.name}
                </h1>
                <p style={{ margin: "0", fontSize: "10px", color: "var(--text-muted)" }}>
                  {selected.path} • {(selected.size / 1024).toFixed(1)} KB • Modified {new Date(selected.lastModified).toLocaleDateString()}
                </p>
              </div>

              {/* Validation status */}
              <div style={{ marginBottom: "16px", padding: "10px", background: "var(--bg-secondary)", borderRadius: "6px" }}>
                {selected.isValid ? (
                  <div style={{ fontSize: "10px", color: "#22c55e", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} />
                    Structure valid
                  </div>
                ) : (
                  <div style={{ fontSize: "10px", color: "#ef4444" }}>
                    {selected.validationErrors.map((err, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <AlertCircle size={12} />
                        {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              {selected.tags && selected.tags.length > 0 && (
                <div style={{ marginBottom: "16px", padding: "10px", background: "var(--bg-secondary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "6px" }}>TAGS</div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: "var(--accent-purple)20",
                          color: "var(--accent-purple)",
                          padding: "3px 8px",
                          borderRadius: "3px",
                          fontSize: "9px",
                          fontWeight: "600",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections */}
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>
                  Sections ({selected.sections.length})
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
                  {selected.sections.map((section) => (
                    <div
                      key={section}
                      style={{
                        padding: "8px",
                        background: "var(--bg-secondary)",
                        borderRadius: "4px",
                        fontSize: "10px",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--bg-tertiary)",
                      }}
                      onClick={() => toggleSection(section)}
                    >
                      {section}
                    </div>
                  ))}
                </div>
              </div>

              {/* File content - VS Code style */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <MemoryContent filePath={selected.path} />
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
              No memory files found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
