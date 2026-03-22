/**
 * Auto-Ticket Creation for OpenClaw Maintenance
 * 
 * When an issue is detected, call createMaintenanceTicket() to:
 * 1. Create a ticket in the system
 * 2. Auto-schedule for nightly maintenance
 * 3. Notify #mission_control channel
 */

interface IssueDetection {
  type: string;
  severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  category: string;
  title: string;
  description: string;
  message: string;
  autoFix: string;
}

/**
 * Creates a maintenance ticket and notifies Discord
 */
export async function createMaintenanceTicket(issue: IssueDetection): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  try {
    // 1. Create ticket via API
    const response = await fetch("/api/maintenance/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: issue.type,
        severity: issue.severity,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        message: issue.message,
        autoFix: issue.autoFix,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ticket: ${response.statusText}`);
    }

    const ticket = await response.json();

    // 2. Send notification to Discord #mission_control
    try {
      await fetch("/api/discord/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "mission_control",
          message: formatDiscordMessage(ticket, issue),
        }),
      });
    } catch (discordError) {
      console.warn("Failed to send Discord notification:", discordError);
      // Don't fail the ticket creation if Discord fails
    }

    return { success: true, ticketId: ticket.id };
  } catch (error) {
    console.error("Failed to create maintenance ticket:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Formats a Discord notification message for a new ticket
 */
function formatDiscordMessage(ticket: any, issue: IssueDetection): string {
  const severityEmoji = {
    CRITICAL: "🔴",
    ERROR: "🟠",
    WARNING: "🟡",
    INFO: "🔵",
  }[issue.severity] || "📋";

  const nextMaintenance = ticket.scheduledFor 
    ? new Date(ticket.scheduledFor).toLocaleString("en-US", { 
        weekday: "short", 
        month: "short", 
        day: "numeric", 
        hour: "numeric", 
        minute: "2-digit",
        timeZoneName: "short"
      })
    : "Next maintenance window";

  return `**${severityEmoji} New Maintenance Ticket Created**

**Ticket:** \`${ticket.id}\`
**Type:** ${issue.type}
**Severity:** ${issue.severity}
**Detected:** ${new Date(ticket.detectedAt).toLocaleString()}

📝 **Description:**
\`\`\`
${issue.message}
\`\`\`

🔧 **Auto-Fix:**
${issue.autoFix}

⏰ **Scheduled for:** ${nextMaintenance}

*This ticket will be automatically resolved during nightly maintenance.*`;
}

/**
 * Pre-configured issue detectors for common OpenClaw errors
 */
export const IssueDetectors = {
  contextWindowOverflow: (modelId: string, contextSize: number, required: number) =>
    ({
      type: "Context Window Overflow",
      severity: "CRITICAL" as const,
      category: "critical",
      title: `Context overflow in ${modelId}`,
      description: `Model ${modelId} has context window of ${contextSize} but needed ${required}`,
      message: `FailoverError: context too small (${contextSize} < ${required}) in ${modelId}`,
      autoFix: `Switch ${modelId} to fallback model. Consider increasing context window or switching to a model with larger capacity.`,
    }),

  orphanedMessage: (channel: string, duration: string) =>
    ({
      type: "Orphaned Messages",
      severity: "WARNING" as const,
      category: "warning",
      title: `Orphaned message in ${channel}`,
      description: `Message stuck in ${channel} for ${duration}`,
      message: `Discord message in ${channel} stuck in pending state for ${duration}`,
      autoFix: "Clear message from pending state, restart session if persists.",
    }),

  toolEditFailure: (file: string, reason: string) =>
    ({
      type: "Tool Edit Failure",
      severity: "ERROR" as const,
      category: "error",
      title: `Failed to edit ${file}`,
      description: `Tool edit failed: ${reason}`,
      message: `Failed to edit ${file} - ${reason}`,
      autoFix: "Reload config, clear tool cache, retry operation.",
    }),

  gatewayTimeout: (endpoint: string, duration: string) =>
    ({
      type: "Gateway Timeout",
      severity: "ERROR" as const,
      category: "error",
      title: `Timeout calling ${endpoint}`,
      description: `Gateway timed out after ${duration}`,
      message: `Gateway timed out waiting for ${endpoint} (timeout after ${duration})`,
      autoFix: "Switch to local fallback model, retry with exponential backoff.",
    }),

  modelLoadFailure: (modelId: string, reason: string) =>
    ({
      type: "Model Load Failure",
      severity: "CRITICAL" as const,
      category: "critical",
      title: `Failed to load ${modelId}`,
      description: `Model load failed: ${reason}`,
      message: `Failed to load model ${modelId}: ${reason}`,
      autoFix: `Remove ${modelId} from active roster, fall back to next available model.`,
    }),
};
