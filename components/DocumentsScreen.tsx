"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { highlightMarkdown } from "@/lib/markdownHighlight";

interface Document {
  id: string;
  name: string;
  path: string;
  type: "memory" | "config" | "doc" | "script" | "skill" | "other";
  category: string;
  size: number;
  created: string;
  modified: string;
  description: string;
  preview: string;
  tags: string[];
}

function MarkdownContent({ content }: { content: string }) {
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

function FileContent({ filePath }: { filePath: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/documents?file=${encodeURIComponent(filePath)}`);
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
        {content.endsWith(".md") || filePath?.endsWith(".md") ? (
          <MarkdownContent content={content} />
        ) : (
          <div style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  "Long-term Memory": "#f97316",
  "Daily Notes": "#eab308",
  "Configuration": "#22c55e",
  "Documentation": "#3b82f6",
  "Scripts & Automation": "#8b5cf6",
  "Skills": "#f59e0b",
  "Other Files": "#6b7280",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Long-term Memory": "🧠",
  "Daily Notes": "📓",
  "Configuration": "⚙️",
  "Documentation": "📚",
  "Scripts & Automation": "🔧",
  "Skills": "⚡",
  "Other Files": "📄",
};

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Document | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [allTags, setAllTags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        setDocuments(data.documents || []);
        setCategories(data.categories || {});
        if (data.documents?.length > 0) {
          setSelected(data.documents[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        setLoading(false);
      }
    };

    fetchDocuments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDocuments, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter documents
  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
        Loading documents...
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", background: "var(--bg-primary)" }}>
      {/* Left sidebar - Document list */}
      <div style={{ width: "320px", borderRight: "1px solid var(--bg-tertiary)", display: "flex", flexDirection: "column", padding: "16px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Documents ({documents.length})
        </h2>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <Search size={14} style={{ position: "absolute", left: "8px", top: "8px", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px 6px 28px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--bg-tertiary)",
              borderRadius: "4px",
              fontSize: "11px",
              color: "var(--text-primary)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category filter */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>
            CATEGORY
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--bg-tertiary)",
              borderRadius: "4px",
              fontSize: "11px",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            <option value="all">All Categories</option>
            {Object.entries(categories).map(([cat, count]) => (
              <option key={cat} value={cat}>
                {cat} ({count})
              </option>
            ))}
          </select>
        </div>

        {/* Document list */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {filtered.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", paddingTop: "20px" }}>
              No documents found
            </div>
          ) : (
            filtered.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelected(doc)}
                style={{
                  padding: "10px",
                  background: selected?.id === doc.id ? "var(--accent-purple)" : "var(--bg-secondary)",
                  border: selected?.id === doc.id ? "1px solid var(--accent-purple)" : "1px solid var(--bg-tertiary)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span>{CATEGORY_ICONS[doc.category] || "📄"}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      color: selected?.id === doc.id ? "white" : "var(--text-primary)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.name}
                  </span>
                </div>
                <div style={{ fontSize: "9px", color: selected?.id === doc.id ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                  {doc.category}
                </div>
                {doc.tags?.length > 0 && (
                  <div style={{ fontSize: "8px", marginTop: "4px", display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: selected?.id === doc.id ? "rgba(255,255,255,0.2)" : "rgba(59,130,246,0.2)",
                          color: selected?.id === doc.id ? "rgba(255,255,255,0.8)" : "#3b82f6",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span style={{ fontSize: "8px", color: selected?.id === doc.id ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>
                        +{doc.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right side - Document preview */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px" }}>
        {selected ? (
          <>
            {/* Header */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "20px" }}>{CATEGORY_ICONS[selected.category] || "📄"}</span>
                <div>
                  <h1 style={{ margin: "0", fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>
                    {selected.name}
                  </h1>
                  <p style={{ margin: "0", fontSize: "10px", color: "var(--text-muted)" }}>
                    {selected.path}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                <div style={{ background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "2px" }}>TYPE</div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>
                    {selected.type}
                  </div>
                </div>
                <div style={{ background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "2px" }}>CATEGORY</div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: CATEGORY_COLORS[selected.category] || "var(--text-primary)" }}>
                    {selected.category}
                  </div>
                </div>
                <div style={{ background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "2px" }}>SIZE</div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>
                    {(selected.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div style={{ background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "2px" }}>MODIFIED</div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>
                    {new Date(selected.modified).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Tags section */}
              {selected.tags && selected.tags.length > 0 && (
                <div style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "6px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>TAGS</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: "var(--accent-purple)20",
                          color: "var(--accent-purple)",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "600",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Description */}
            {selected.description && (
              <div style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "6px" }}>
                <p style={{ margin: "0", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  {selected.description}
                </p>
              </div>
            )}

            {/* File content - VS Code style */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <FileContent filePath={selected.path} />
            </div>
          </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
            Select a document to view details
          </div>
        )}
      </div>
    </div>
  );
}
