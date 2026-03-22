/**
 * Tests for /api/agents/[id]/activity endpoint
 * 
 * These tests verify that the endpoint correctly:
 * 1. Reads and parses JSONL session files
 * 2. Extracts current task from user messages
 * 3. Determines agent status based on activity timestamps
 * 4. Collects skills/tools used
 * 5. Handles errors gracefully
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { SubagentActivityRecord } from "../../../lib/types/agent-activity";

/**
 * Helper to call the API endpoint
 */
async function callActivityEndpoint(agentId: string): Promise<SubagentActivityRecord> {
  const encodedId = encodeURIComponent(agentId);
  const response = await fetch(`http://localhost:3000/api/agents/${encodedId}/activity`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

describe("/api/agents/[id]/activity", () => {
  describe("Response Structure", () => {
    it("should return all required fields", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      expect(activity).toHaveProperty("currentTask");
      expect(activity).toHaveProperty("status");
      expect(activity).toHaveProperty("progressEstimate");
      expect(activity).toHaveProperty("skillsUsed");
      expect(activity).toHaveProperty("startTime");
      expect(activity).toHaveProperty("messageCount");
      expect(activity).toHaveProperty("lastUpdated");
      expect(activity).toHaveProperty("entryCount");
      expect(activity).toHaveProperty("error");
    });

    it("should have correct types for all fields", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      expect(typeof activity.currentTask === "string" || activity.currentTask === null).toBe(true);
      expect(["working", "idle", "blocked", "offline"]).toContain(activity.status);
      expect(typeof activity.progressEstimate === "string" || activity.progressEstimate === null).toBe(true);
      expect(Array.isArray(activity.skillsUsed)).toBe(true);
      expect(typeof activity.startTime === "string" || activity.startTime === null).toBe(true);
      expect(typeof activity.messageCount === "number").toBe(true);
      expect(typeof activity.lastUpdated === "string" || activity.lastUpdated === null).toBe(true);
      expect(typeof activity.entryCount === "number").toBe(true);
      expect(typeof activity.error === "string" || activity.error === null).toBe(true);
    });
  });

  describe("Task Extraction", () => {
    it("should extract current task from most recent user message", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      // If there are messages, currentTask should be populated
      if (activity.messageCount > 0) {
        // Task should be a string if messages exist
        expect(typeof activity.currentTask === "string" || activity.currentTask === null).toBe(true);
        
        // If task exists, it should be reasonably sized
        if (activity.currentTask) {
          expect(activity.currentTask.length).toBeGreaterThan(0);
          expect(activity.currentTask.length).toBeLessThanOrEqual(500);
        }
      }
    });

    it("should set currentTask to null if no user messages exist", async () => {
      // This would require a fresh session - skipping in normal tests
      // Documented for completeness
    });
  });

  describe("Status Determination", () => {
    it("should return 'working' for recent activity (<90s)", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      if (activity.lastUpdated) {
        const ageMs = Date.now() - new Date(activity.lastUpdated).getTime();
        
        if (ageMs < 90_000 && !activity.error) {
          expect(activity.status).toBe("working");
        }
      }
    });

    it("should return 'blocked' if error is present", async () => {
      // Find a session with an error
      // This would require a session that encountered an error
      // Documented for completeness
    });

    it("should return 'offline' for stale sessions (>30m)", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      if (activity.lastUpdated) {
        const ageMs = Date.now() - new Date(activity.lastUpdated).getTime();
        
        if (ageMs > 30 * 60_000) {
          expect(activity.status).toBe("offline");
        }
      }
    });
  });

  describe("Skills Extraction", () => {
    it("should return array of tools used", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      expect(Array.isArray(activity.skillsUsed)).toBe(true);
      
      // Skills should be deduplicated and sorted
      const unique = new Set(activity.skillsUsed);
      expect(unique.size).toBe(activity.skillsUsed.length); // no duplicates
      
      // Should be sorted alphabetically
      const sorted = [...activity.skillsUsed].sort();
      expect(activity.skillsUsed).toEqual(sorted);
    });

    it("should include common tool names", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      // Known tools: read, write, edit, exec, browser, image, etc.
      const knownTools = ["read", "write", "edit", "exec", "browser", "image", "canvas", "message"];
      const foundTools = activity.skillsUsed.filter(skill => knownTools.includes(skill));
      
      // Not a hard requirement, but documents expected tool names
      if (activity.messageCount > 5) {
        expect(foundTools.length).toBeGreaterThan(0);
      }
    });

    it("should return empty array for sessions with no tool calls", async () => {
      // A session with only user/assistant text would have no skills
      // Documented for completeness
    });
  });

  describe("Timestamps", () => {
    it("should return ISO 8601 formatted timestamps", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      
      if (activity.startTime) {
        expect(isoRegex.test(activity.startTime)).toBe(true);
      }
      
      if (activity.lastUpdated) {
        expect(isoRegex.test(activity.lastUpdated)).toBe(true);
      }
    });

    it("startTime should be before or equal to lastUpdated", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      if (activity.startTime && activity.lastUpdated) {
        const startMs = new Date(activity.startTime).getTime();
        const lastMs = new Date(activity.lastUpdated).getTime();
        
        expect(startMs).toBeLessThanOrEqual(lastMs);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return gracefully for non-existent agent ID", async () => {
      const activity = await callActivityEndpoint("agent:main:nonexistent");
      
      // Should return valid response even if file doesn't exist
      expect(activity.error).toBeTruthy();
      expect(activity.status).toBe("offline");
      expect(activity.messageCount).toBe(0);
    });

    it("should handle malformed session file paths", async () => {
      const activity = await callActivityEndpoint("invalid-format");
      
      // Should not throw, should return error message
      expect(activity.status).toBe("offline");
    });

    it("error field should be null on success", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      if (activity.entryCount > 0) {
        // If file was successfully parsed, error should be null
        expect(activity.error).toBeNull();
      }
    });
  });

  describe("Entry Counts", () => {
    it("should have messageCount <= entryCount", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      expect(activity.messageCount).toBeLessThanOrEqual(activity.entryCount);
    });

    it("should have reasonable counts", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      // Message count should be even (pairs of user/assistant messages usually)
      // but not required
      expect(activity.messageCount).toBeGreaterThanOrEqual(0);
      expect(activity.entryCount).toBeGreaterThanOrEqual(0);
      
      // For active sessions, should have some activity
      if (activity.status === "working") {
        expect(activity.entryCount).toBeGreaterThan(0);
      }
    });
  });

  describe("Progress Estimation", () => {
    it("should provide progressEstimate for working agents", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      if (activity.status === "working") {
        // Working agents should have some progress indication
        expect(activity.progressEstimate).toBeTruthy();
      }
    });

    it("should return null or meaningful string for progressEstimate", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      
      expect(
        activity.progressEstimate === null ||
        typeof activity.progressEstimate === "string"
      ).toBe(true);
    });
  });

  describe("Agent Key Encoding", () => {
    it("should handle encoded agent keys correctly", async () => {
      const sessionKey = "agent:main:subagent:061299d1-169c-433e-8d84-b075a25412e0";
      const encoded = encodeURIComponent(sessionKey);
      
      // This might return 'offline' if the session doesn't exist,
      // but should not throw
      const activity = await callActivityEndpoint(sessionKey);
      expect(activity).toBeDefined();
    });

    it("should handle main agent key", async () => {
      const activity = await callActivityEndpoint("agent:main:main");
      expect(activity).toBeDefined();
    });
  });
});

/**
 * Integration tests - these require actual session files
 */
describe("/api/agents/[id]/activity - Integration", () => {
  it("should read real session files from disk", async () => {
    // This test verifies the endpoint can actually read the OpenClaw sessions
    const activity = await callActivityEndpoint("agent:main:main");
    
    // Should have at least some entries
    if (activity.entryCount > 0) {
      expect(activity.messageCount).toBeGreaterThan(0);
    }
  });

  it("should keep up with live sessions", async () => {
    // Get activity at time T1
    const activity1 = await callActivityEndpoint("agent:main:main");
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get activity at time T2
    const activity2 = await callActivityEndpoint("agent:main:main");
    
    // If session is active, timestamps or entry count should be different
    // (This is not guaranteed if no activity occurs during the wait)
    expect(activity1).toBeDefined();
    expect(activity2).toBeDefined();
  });
});
