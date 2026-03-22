"use client";

import { useState } from "react";
import Link from "next/link";

type AIFeature = {
  id: string;
  category: string;
  name: string;
  description: string;
  capabilities: string[];
  tools: string[];
  status: "active" | "beta" | "coming-soon";
};

const aiFeatures: AIFeature[] = [
  {
    id: "model-management",
    category: "Core Infrastructure",
    name: "Model Management",
    description: "Dynamically switch between and manage multiple AI models",
    capabilities: [
      "List available models",
      "Switch models seamlessly",
      "Override model per-session",
      "Support for local (LM Studio) and API models"
    ],
    tools: ["lmstudio", "anthropic", "ollama"],
    status: "active"
  },
  {
    id: "skill-execution",
    category: "Skill System",
    name: "Skill Execution",
    description: "Run predefined or custom skills for specialized tasks",
    capabilities: [
      "Execute predefined skills",
      "Create new custom skills",
      "Chain skills together",
      "Skill versioning and updates"
    ],
    tools: ["clawhub", "skill-creator"],
    status: "active"
  },
  {
    id: "file-operations",
    category: "File Management",
    name: "File Operations",
    description: "Read, write, and edit files with precision",
    capabilities: [
      "Read file contents",
      "Write new files",
      "Make surgical edits to existing files",
      "File dependency tracking"
    ],
    tools: ["read", "write", "edit"],
    status: "active"
  },
  {
    id: "web-interaction",
    category: "Web & Browser",
    name: "Web Interaction",
    description: "Fetch web content and interact with websites",
    capabilities: [
      "Search the web",
      "Fetch web page content",
      "Navigate and interact with browsers",
      "Screenshot capture"
    ],
    tools: ["ollama_web_search", "ollama_web_fetch", "browser"],
    status: "active"
  },
  {
    id: "task-automation",
    category: "Automation",
    name: "Task Automation",
    description: "Schedule and automate recurring tasks",
    capabilities: [
      "Create cron jobs",
      "Schedule one-time tasks",
      "Automate workflows",
      "Set reminders and alerts"
    ],
    tools: ["cron", "exec"],
    status: "active"
  },
  {
    id: "sub-agents",
    category: "Multi-Agent",
    name: "Sub-Agent Orchestration",
    description: "Spawn and manage specialized sub-agents",
    capabilities: [
      "Spawn isolated sub-agents",
      "Route tasks to specialized models",
      "Manage agent lifecycle",
      "Chinese animal naming convention"
    ],
    tools: ["sessions_spawn", "sessions_send", "subagents"],
    status: "active"
  },
  {
    id: "memory-system",
    category: "Persistence",
    name: "Memory System",
    description: "Long-term and session memory management",
    capabilities: [
      "Maintain long-term memory (MEMORY.md)",
      "Daily memory logs",
      "Semantic memory search",
      "Persistent workspace state"
    ],
    tools: ["memory_search", "memory_get"],
    status: "active"
  },
  {
    id: "messaging",
    category: "Communication",
    name: "Messaging & Channels",
    description: "Send messages across Discord, Telegram, and other channels",
    capabilities: [
      "Send messages to channels",
      "Create polls and reactions",
      "Thread management",
      "Multi-channel support"
    ],
    tools: ["message"],
    status: "active"
  },
  {
    id: "system-monitoring",
    category: "System",
    name: "System Monitoring",
    description: "Monitor and manage OpenClaw gateway and host",
    capabilities: [
      "Check system status",
      "View configuration",
      "Apply config changes",
      "Run gateway updates"
    ],
    tools: ["gateway", "session_status"],
    status: "active"
  },
  {
    id: "pdf-analysis",
    category: "Document Processing",
    name: "PDF Analysis",
    description: "Analyze and extract information from PDFs",
    capabilities: [
      "Parse PDF documents",
      "Extract text and images",
      "Analyze document structure",
      "Multi-document analysis"
    ],
    tools: ["pdf"],
    status: "active"
  },
  {
    id: "image-analysis",
    category: "Vision",
    name: "Image Analysis",
    description: "Analyze images with vision models",
    capabilities: [
      "Analyze single images",
      "Multi-image analysis",
      "Extract text from images",
      "Visual understanding"
    ],
    tools: ["image"],
    status: "active"
  },
  {
    id: "text-to-speech",
    category: "Audio",
    name: "Text-to-Speech",
    description: "Convert text to audio for accessibility and engagement",
    capabilities: [
      "Generate audio from text",
      "Multiple voice options",
      "Audio delivery to channels",
      "Custom voice selection"
    ],
    tools: ["tts"],
    status: "active"
  }
];

const categories = Array.from(new Set(aiFeatures.map(f => f.category)));

export default function CataloguePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredFeatures = aiFeatures.filter(feature => {
    const categoryMatch = !selectedCategory || feature.category === selectedCategory;
    const statusMatch = !selectedStatus || feature.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">🐖 OpenClaw AI Catalogue</h1>
              <p className="text-slate-400">Complete reference of available XiaoZhu capabilities</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              ← Back
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="text-slate-400">Total Features</div>
              <div className="text-2xl font-bold text-white">{aiFeatures.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="text-slate-400">Categories</div>
              <div className="text-2xl font-bold text-white">{categories.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="text-slate-400">Active Tools</div>
              <div className="text-2xl font-bold text-white">25+</div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-slate-700 bg-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Filter by Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-lg transition ${
                    !selectedCategory
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg transition ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Filter by Status</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStatus(null)}
                  className={`px-4 py-2 rounded-lg transition ${
                    !selectedStatus
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedStatus("active")}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedStatus === "active"
                      ? "bg-green-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  ✓ Active
                </button>
                <button
                  onClick={() => setSelectedStatus("beta")}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedStatus === "beta"
                      ? "bg-yellow-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  ⚡ Beta
                </button>
                <button
                  onClick={() => setSelectedStatus("coming-soon")}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedStatus === "coming-soon"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  🔜 Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {filteredFeatures.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No features match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map(feature => (
              <div
                key={feature.id}
                className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white flex-1">{feature.name}</h3>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        feature.status === "active"
                          ? "bg-green-900/30 text-green-300"
                          : feature.status === "beta"
                          ? "bg-yellow-900/30 text-yellow-300"
                          : "bg-purple-900/30 text-purple-300"
                      }`}
                    >
                      {feature.status === "active"
                        ? "✓ Active"
                        : feature.status === "beta"
                        ? "⚡ Beta"
                        : "🔜 Coming"}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-blue-400 mb-2">{feature.category}</p>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>

                {/* Capabilities */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase mb-2">Capabilities</h4>
                  <ul className="space-y-1">
                    {feature.capabilities.map((cap, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tools */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase mb-2">Tools</h4>
                  <div className="flex flex-wrap gap-1">
                    {feature.tools.map(tool => (
                      <span
                        key={tool}
                        className="px-2 py-1 bg-slate-700/30 text-slate-300 text-xs rounded border border-slate-600/50"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 border-t border-slate-700 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            For more details, check out the{" "}
            <Link href="/docs" className="text-blue-400 hover:text-blue-300">
              documentation
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
