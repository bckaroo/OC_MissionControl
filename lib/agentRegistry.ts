/**
 * Agent Registry & Task Tracker
 * Maintains serial numbers, specializations, and inferred tasks for all agents
 */

export interface AgentProfile {
  serialNumber: string;
  internalName: string;
  displayName: string;
  emoji: string;
  role: string;
  specialization: string;
  capabilities: string[];
  inferredTask?: string;
  lastKnownProject?: string;
  spawnedFrom?: string;
  priority: "critical" | "high" | "normal" | "low";
}

export interface AgentIdentifier {
  id: string;
  serialNumber: string;
  profile: AgentProfile;
  taskInference: TaskInference | null;
  metadata: {
    firstSeen: number;
    lastUpdated: number;
    totalSessions: number;
    successRate: number; // 0-100
  };
}

export interface TaskInference {
  task: string;
  confidence: number; // 0-100
  category: "coding" | "analysis" | "writing" | "vision" | "coordination" | "unknown";
  keywords: string[];
  estimatedDuration?: string;
}

// ─── Official Roster with Serial Numbers ─────────────────────────────────────

const AGENT_ROSTER: Record<string, AgentProfile> = {
  "agent:main:main": {
    serialNumber: "XZ-MAIN-001",
    internalName: "xiaozhu",
    displayName: "XiaoZhu",
    emoji: "🐖",
    role: "Chief of Staff",
    specialization: "Main Coordinator & Dispatcher",
    capabilities: [
      "Route tasks to subagents",
      "Monitor all sessions",
      "Discord listener",
      "Decision making",
      "Workflow orchestration",
    ],
    priority: "critical",
  },
  "xiaoya": {
    serialNumber: "XZ-CODER-001",
    internalName: "xiaoya",
    displayName: "xiaoya",
    emoji: "🪳",
    role: "Coding Specialist",
    specialization: "Software Development & Debugging",
    capabilities: [
      "Write production code",
      "Debug complex issues",
      "Refactor codebases",
      "Build features",
      "Code review",
      "Performance optimization",
    ],
    priority: "high",
  },
  "xiaohu": {
    serialNumber: "XZ-REASON-001",
    internalName: "xiaohu",
    displayName: "xiaohu",
    emoji: "🪳",
    role: "Analysis Specialist",
    specialization: "Deep Reasoning & Problem Solving",
    capabilities: [
      "Complex reasoning",
      "Research & analysis",
      "Problem decomposition",
      "Strategic thinking",
      "Pattern recognition",
      "Root cause analysis",
    ],
    priority: "high",
  },
  "xiaomao": {
    serialNumber: "XZ-WRITER-001",
    internalName: "xiaomao",
    displayName: "xiaomao",
    emoji: "🪳",
    role: "Documentation Specialist",
    specialization: "Writing & Content Creation",
    capabilities: [
      "Technical documentation",
      "Long-form writing",
      "Essay composition",
      "Content structuring",
      "Editing & refinement",
      "Narrative creation",
    ],
    priority: "high",
  },
  "xiaozhu-vision": {
    serialNumber: "XZ-VISION-001",
    internalName: "xiaozhu-vision",
    displayName: "xiaozhu-vision",
    emoji: "🪳",
    role: "Vision Specialist",
    specialization: "Image & Multimodal Analysis",
    capabilities: [
      "Image analysis",
      "OCR & text extraction",
      "Visual understanding",
      "Multimodal reasoning",
      "Diagram interpretation",
      "Design feedback",
    ],
    priority: "high",
  },
};

// ─── Dynamic Agent Instance Tracking ──────────────────────────────────────────

class AgentRegistry {
  private instances = new Map<string, AgentIdentifier>();
  private sessionCounter = new Map<string, number>();
  private instanceCounter = 0;

  /**
   * Register or update an agent instance
   */
  registerInstance(
    sessionKey: string,
    model: string,
    status: "working" | "idle" | "blocked" | "offline",
    currentTaskHint?: string
  ): AgentIdentifier {
    let identifier = this.instances.get(sessionKey);

    if (!identifier) {
      this.instanceCounter++;
      const baseProfile = this.getBaseProfile(sessionKey);
      const serialNumber = this.generateSerialNumber(baseProfile.serialNumber);

      identifier = {
        id: sessionKey,
        serialNumber,
        profile: baseProfile,
        taskInference: currentTaskHint ? this.inferTask(currentTaskHint) : null,
        metadata: {
          firstSeen: Date.now(),
          lastUpdated: Date.now(),
          totalSessions: 1,
          successRate: 100,
        },
      };

      this.instances.set(sessionKey, identifier);
    } else {
      // Update existing
      identifier.metadata.lastUpdated = Date.now();
      identifier.taskInference = currentTaskHint ? this.inferTask(currentTaskHint) : identifier.taskInference;

      // Count sessions by base type
      const baseType = sessionKey.split(":").slice(0, 3).join(":");
      const count = (this.sessionCounter.get(baseType) || 0) + 1;
      this.sessionCounter.set(baseType, count);
      identifier.metadata.totalSessions = count;
    }

    return identifier;
  }

  /**
   * Get base profile from official roster or generate one
   */
  private getBaseProfile(sessionKey: string): AgentProfile {
    // Check if it's a known agent
    for (const [key, profile] of Object.entries(AGENT_ROSTER)) {
      if (sessionKey === key || sessionKey.includes(key)) {
        return profile;
      }
    }

    // Generate fallback profile for unknown agents
    const match = sessionKey.match(/subagent:([a-z0-9-]+)/i);
    const agentName = match ? match[1] : "unknown";

    return {
      serialNumber: `XZ-UNKNOWN-${this.instanceCounter.toString().padStart(3, "0")}`,
      internalName: agentName,
      displayName: agentName,
      emoji: "🪳",
      role: "Subagent",
      specialization: "General Purpose Agent",
      capabilities: ["Task execution", "Problem solving"],
      priority: "normal",
    };
  }

  /**
   * Generate a unique serial number with instance counter
   */
  private generateSerialNumber(baseSerial: string): string {
    const [prefix, type, _] = baseSerial.split("-");
    const instance = (this.sessionCounter.get(baseSerial) || 0) + 1;
    return `${prefix}-${type}-${instance.toString().padStart(3, "0")}`;
  }

  /**
   * Infer what task an agent is working on based on hints
   */
  private inferTask(hint: string): TaskInference {
    const lowerHint = hint.toLowerCase();
    let category: TaskInference["category"] = "unknown";
    let confidence = 50;
    const keywords: string[] = [];

    // Coding indicators
    if (
      lowerHint.includes("code") ||
      lowerHint.includes("debug") ||
      lowerHint.includes("refactor") ||
      lowerHint.includes("build") ||
      lowerHint.includes("feature")
    ) {
      category = "coding";
      confidence = 85;
      keywords.push("development", "programming");
    }

    // Analysis indicators
    if (
      lowerHint.includes("analy") ||
      lowerHint.includes("reason") ||
      lowerHint.includes("research") ||
      lowerHint.includes("think") ||
      lowerHint.includes("problem")
    ) {
      category = "analysis";
      confidence = 85;
      keywords.push("research", "analysis");
    }

    // Writing indicators
    if (
      lowerHint.includes("writ") ||
      lowerHint.includes("doc") ||
      lowerHint.includes("essay") ||
      lowerHint.includes("content") ||
      lowerHint.includes("text")
    ) {
      category = "writing";
      confidence = 85;
      keywords.push("documentation", "writing");
    }

    // Vision indicators
    if (
      lowerHint.includes("image") ||
      lowerHint.includes("vision") ||
      lowerHint.includes("visual") ||
      lowerHint.includes("screenshot") ||
      lowerHint.includes("ocr")
    ) {
      category = "vision";
      confidence = 85;
      keywords.push("vision", "image analysis");
    }

    // Coordination indicators
    if (
      lowerHint.includes("coordin") ||
      lowerHint.includes("route") ||
      lowerHint.includes("dispatch") ||
      lowerHint.includes("monitor")
    ) {
      category = "coordination";
      confidence = 80;
      keywords.push("orchestration", "coordination");
    }

    return {
      task: hint,
      confidence,
      category,
      keywords,
      estimatedDuration:
        confidence > 80
          ? category === "coding"
            ? "5-30 mins"
            : category === "analysis"
            ? "10-60 mins"
            : category === "writing"
            ? "15-90 mins"
            : "variable"
          : undefined,
    };
  }

  /**
   * Get all registered instances
   */
  getAll(): AgentIdentifier[] {
    return Array.from(this.instances.values()).sort((a, b) => {
      // Prioritize by: critical > high > normal > low
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return (
        (priorityOrder[a.profile.priority] || 999) -
        (priorityOrder[b.profile.priority] || 999)
      );
    });
  }

  /**
   * Get instance by session key
   */
  getInstance(sessionKey: string): AgentIdentifier | undefined {
    return this.instances.get(sessionKey);
  }

  /**
   * Get instances by category
   */
  getByCategory(category: TaskInference["category"]): AgentIdentifier[] {
    return Array.from(this.instances.values()).filter(
      (id) => id.taskInference?.category === category
    );
  }

  /**
   * Get instances by role
   */
  getByRole(role: string): AgentIdentifier[] {
    return Array.from(this.instances.values()).filter((id) =>
      id.profile.role.toLowerCase().includes(role.toLowerCase())
    );
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();

/**
 * Helper: Format agent display with serial number
 */
export function formatAgentDisplay(
  identifier: AgentIdentifier
): {
  fullName: string;
  shortName: string;
  serial: string;
  badge: string;
} {
  return {
    fullName: `${identifier.profile.emoji} ${identifier.profile.displayName} (${identifier.serialNumber})`,
    shortName: `${identifier.profile.emoji} ${identifier.profile.displayName}`,
    serial: identifier.serialNumber,
    badge: `${identifier.profile.emoji} ${identifier.serialNumber}`,
  };
}

/**
 * Helper: Get task status display
 */
export function formatTaskStatus(inference: TaskInference | null): {
  display: string;
  color: string;
  icon: string;
} {
  if (!inference)
    return { display: "idle", color: "#6b7280", icon: "💤" };

  const categoryEmoji: Record<TaskInference["category"], string> = {
    coding: "💻",
    analysis: "🧠",
    writing: "✍️",
    vision: "👁️",
    coordination: "🎛️",
    unknown: "❓",
  };

  const categoryColor: Record<TaskInference["category"], string> = {
    coding: "#3b82f6",
    analysis: "#8b5cf6",
    writing: "#ec4899",
    vision: "#f59e0b",
    coordination: "#10b981",
    unknown: "#6b7280",
  };

  return {
    display: `${categoryEmoji[inference.category]} ${inference.category}`,
    color: categoryColor[inference.category],
    icon: categoryEmoji[inference.category],
  };
}
