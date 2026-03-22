import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

interface ModelMessage {
  id: string;
  model: string;
  modelColor: string;
  timestamp: string;
  content: string;
  type: "thinking" | "action" | "handoff" | "result";
  taskId?: string;
  taskTitle?: string;
  targetModel?: string;
}

interface ExecutingTask {
  id: string;
  title: string;
  model: string;
  modelColor: string;
  status: "backlog" | "queued" | "running" | "waiting" | "complete";
  startedAt: string;
  progress: number;
  projectId?: string;
  projectName?: string;
  priority?: string;
  assignee?: string;
}

interface SituationRoomData {
  executingTasks: ExecutingTask[];
  messages: ModelMessage[];
  lastUpdate: string;
}

const agents: Record<string, { name: string; animal: string; emoji: string; color: string; model: string }> = {
  "xiaozhu": {
    name: "XiaoZhu",
    animal: "小猪 (Little Pig)",
    emoji: "🐖",
    color: "#ec4899",
    model: "qwen3.5-9b",
  },
  "xiaoya": {
    name: "XiaoYa",
    animal: "小鴨 (Little Duck)",
    emoji: "🦆",
    color: "#3b82f6",
    model: "qwen3.5-9b",
  },
  "xiaohu": {
    name: "XiaoHu",
    animal: "小虎 (Little Tiger)",
    emoji: "🐯",
    color: "#f59e0b",
    model: "qwen3-coder-30b",
  },
  "xiaomao": {
    name: "XiaoMao",
    animal: "小猫 (Little Cat)",
    emoji: "🐱",
    color: "#10b981",
    model: "qwen3-vl-30b",
  },
  "xiaogou": {
    name: "XiaoGou",
    animal: "小狗 (Little Dog)",
    emoji: "🐕",
    color: "#8b5cf6",
    model: "deepseek-r1-8b",
  },
};

const modelColors: Record<string, string> = {
  "qwen3.5-9b": "#3b82f6",
  "qwen3-coder-30b": "#f59e0b",
  "deepseek-r1-8b": "#8b5cf6",
  "qwen3-vl-30b": "#10b981",
};

function getAgentByModel(model: string): { name: string; emoji: string; color: string } {
  for (const [key, agent] of Object.entries(agents)) {
    if (agent.model === model) {
      return { name: `${agent.emoji} ${agent.name}`, emoji: agent.emoji, color: agent.color };
    }
  }
  return { name: "Unknown", emoji: "❓", color: "#6b7280" };
}

function getModelColor(model: string): string {
  return modelColors[model] || "#6b7280";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getProjectName(projectId: string): string {
  try {
    const projectsFile = path.join(
      process.env.USERPROFILE || process.env.HOME || "/root",
      ".openclaw",
      "workspace",
      "projects.json"
    );
    if (!existsSync(projectsFile)) return projectId;

    const data = JSON.parse(readFileSync(projectsFile, "utf-8"));
    const projects = data.projects || [];
    const project = projects.find((p: any) => p.id === projectId);
    return project?.name || projectId;
  } catch {
    return projectId;
  }
}

function getExecutingTasks(): ExecutingTask[] {
  try {
    const tasksFile = path.join(process.cwd(), "data", "tasks.json");
    if (!existsSync(tasksFile)) return [];

    const data = JSON.parse(readFileSync(tasksFile, "utf-8"));
    const tasks = data.tasks || [];

    const result: ExecutingTask[] = [];

    // 1. Running tasks (top priority)
    const running = tasks
      .filter((t: any) => t.executionStatus === "running" || (t.status === "in-progress" && !t.executedAt))
      .slice(0, 3)
      .map((t: any, idx: number) => {
        const baseProgress = Math.random() * 60 + 20;
        const modelList = ["qwen3.5-9b", "qwen3-coder-30b", "deepseek-r1-8b", "qwen3-vl-30b"];
        const model = modelList[idx % modelList.length];
        const agent = getAgentByModel(model);

        return {
          id: t.id,
          title: t.title,
          model: `${agent.name} (${model})`,
          modelColor: agent.color,
          status: "running" as const,
          startedAt: new Date(Date.now() - Math.random() * 300000).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          progress: Math.round(baseProgress),
          projectId: t.projectId,
          projectName: getProjectName(t.projectId),
          priority: t.priority,
          assignee: t.assignee,
        };
      });

    result.push(...running);

    // 2. Queued tasks (waiting to start)
    const queued = tasks
      .filter((t: any) => t.status === "backlog" && !t.executionStatus)
      .slice(0, 3)
      .map((t: any, idx: number) => {
        const modelList = ["qwen3.5-9b", "qwen3-coder-30b", "deepseek-r1-8b"];
        const model = modelList[idx % modelList.length];
        const agent = getAgentByModel(model);

        return {
          id: t.id,
          title: t.title,
          model: `${agent.name} (${model})`,
          modelColor: agent.color,
          status: "queued" as const,
          startedAt: new Date(Date.now() - Math.random() * 120000).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          progress: 0,
          projectId: t.projectId,
          projectName: getProjectName(t.projectId),
          priority: t.priority,
          assignee: t.assignee,
        };
      });

    result.push(...queued);

    // 3. Recent completions
    const recent = tasks
      .filter((t: any) => t.status === "done" && t.executedAt)
      .slice(-2)
      .map((t: any, idx: number) => {
        const modelList = ["qwen3.5-9b", "qwen3-coder-30b", "deepseek-r1-8b", "qwen3-vl-30b"];
        const selectedModel = modelList[idx % modelList.length];
        const agent = getAgentByModel(selectedModel);
        return {
          id: t.id,
          title: t.title,
          model: `${agent.name} (${selectedModel})`,
          modelColor: agent.color,
          status: "complete" as const,
          startedAt: new Date(t.executedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          progress: 100,
          projectId: t.projectId,
          projectName: getProjectName(t.projectId),
          priority: t.priority,
          assignee: t.assignee,
        };
      });

    result.push(...recent);

    return result.slice(0, 8); // Max 8 tasks shown
  } catch {
    return [];
  }
}

function generateMessages(tasks: ExecutingTask[]): ModelMessage[] {
  const messages: ModelMessage[] = [];
  const now = new Date();

  tasks.forEach((task, idx) => {
    const taskStartTime = new Date(now.getTime() - Math.random() * 180000); // Up to 3 min ago
    const orchestrator = agents.xiaozhu; // XiaoZhu is the orchestrator

    // Thinking message
    messages.push({
      id: `msg-${idx}-1`,
      model: `${orchestrator.emoji} ${orchestrator.name} (Orchestrator)`,
      modelColor: orchestrator.color,
      timestamp: formatTime(new Date(taskStartTime.getTime())),
      content: `Analyzing task: ${task.title}`,
      type: "thinking",
      taskId: task.id,
      taskTitle: task.title,
    });

    // Routing message
    messages.push({
      id: `msg-${idx}-2`,
      model: `${orchestrator.emoji} ${orchestrator.name} (Orchestrator)`,
      modelColor: orchestrator.color,
      timestamp: formatTime(new Date(taskStartTime.getTime() + 2000)),
      content: `Routing to ${task.model}...`,
      type: "action",
      taskId: task.id,
      taskTitle: task.title,
    });

    // Handoff
    messages.push({
      id: `msg-${idx}-3`,
      model: `${orchestrator.emoji} ${orchestrator.name} (Orchestrator)`,
      modelColor: orchestrator.color,
      timestamp: formatTime(new Date(taskStartTime.getTime() + 3000)),
      content: `Handing off to ${task.model}`,
      type: "handoff",
      taskId: task.id,
      targetModel: task.model,
    });

    // Working message
    messages.push({
      id: `msg-${idx}-4`,
      model: task.model,
      modelColor: task.modelColor,
      timestamp: formatTime(new Date(taskStartTime.getTime() + 4000)),
      content: `Processing: ${task.title.substring(0, 40)}...`,
      type: "action",
      taskId: task.id,
      taskTitle: task.title,
    });

    // Progress update (only if running)
    if (task.status === "running" && task.progress > 50) {
      messages.push({
        id: `msg-${idx}-5`,
        model: task.model,
        modelColor: task.modelColor,
        timestamp: formatTime(new Date(taskStartTime.getTime() + 80000)),
        content: `${task.progress}% complete • ~${Math.round((100 - task.progress) / 10)}s remaining`,
        type: "action",
        taskId: task.id,
        taskTitle: task.title,
      });
    }

    // Result (if complete)
    if (task.status === "complete") {
      messages.push({
        id: `msg-${idx}-6`,
        model: task.model,
        modelColor: task.modelColor,
        timestamp: formatTime(new Date(taskStartTime.getTime() + 300000)),
        content: `✅ Task completed successfully`,
        type: "result",
        taskId: task.id,
        taskTitle: task.title,
      });
    }
  });

  return messages.sort((a, b) => {
    // Sort by timestamp, but keep handoffs with their follow-ups
    const timeA = a.timestamp;
    const timeB = b.timestamp;
    if (timeA === timeB) {
      if (a.type === "handoff") return -1;
      if (b.type === "handoff") return 1;
    }
    return timeA.localeCompare(timeB);
  });
}

export async function GET(): Promise<NextResponse<SituationRoomData>> {
  try {
    const tasks = getExecutingTasks();
    const messages = generateMessages(tasks);

    return NextResponse.json({
      executingTasks: tasks,
      messages,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get situation room data:", error);
    return NextResponse.json(
      {
        executingTasks: [],
        messages: [],
        lastUpdate: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
