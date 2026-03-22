"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "paused" | "completed";
  createdAt: string;
  updatedAt: string;
  taskIds: string[];
  projectLead?: string;
}

interface Task {
  id: string;
  title: string;
  status: "backlog" | "in-progress" | "review" | "done";
  projectId: string;
}

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const toggleFlip = (projectId: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(projectId)) {
      newFlipped.delete(projectId);
    } else {
      newFlipped.add(projectId);
    }
    setFlippedCards(newFlipped);
  };

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
        }),
      });

      setNewProjectName("");
      setNewProjectDesc("");
      setShowNewForm(false);
      fetchProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project? Tasks will remain.")) return;

    try {
      await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const completedTasks = projectTasks.filter(t => t.status === "done").length;
    const total = projectTasks.length || 1;
    const percentage = Math.round((completedTasks / total) * 100);

    return {
      total: projectTasks.length,
      completed: completedTasks,
      percentage,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "rgba(34,197,94,0.12)", text: "#4ade80", icon: "🚀" };
      case "planning":
        return { bg: "rgba(249,115,22,0.12)", text: "#fb923c", icon: "📋" };
      case "paused":
        return { bg: "rgba(239,68,68,0.12)", text: "#f87171", icon: "⏸" };
      case "completed":
        return { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", icon: "✅" };
      default:
        return { bg: "rgba(107,114,128,0.12)", text: "#9ca3af", icon: "📌" };
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
        Loading projects…
      </div>
    );
  }

  const statusColors = getStatusColor("active");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ padding: "20px", borderBottom: "1px solid var(--bg-tertiary)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>
            Projects
          </h1>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{
              padding: "8px 14px",
              background: "var(--accent-purple)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          {projects.length} projects • {tasks.length} tasks
        </p>
      </div>

      {/* New Project Form */}
      {showNewForm && (
        <div style={{ padding: "16px 20px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--bg-tertiary)" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Project name…"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "8px 12px",
                background: "var(--bg-primary)",
                border: "1px solid var(--bg-tertiary)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            />
            <input
              type="text"
              placeholder="Description…"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "8px 12px",
                background: "var(--bg-primary)",
                border: "1px solid var(--bg-tertiary)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "12px",
              }}
            />
            <button
              onClick={createProject}
              style={{
                padding: "8px 16px",
                background: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--bg-tertiary)",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {projects.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "var(--text-muted)",
              fontSize: "14px",
            }}
          >
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
            {projects.map((project) => {
              const stats = getProjectStats(project);
              const colors = getStatusColor(project.status);
              const isFlipped = flippedCards.has(project.id);
              const projectTasks = tasks.filter(t => t.projectId === project.id);

              return (
                <div
                  key={project.id}
                  onClick={() => toggleFlip(project.id)}
                  style={{
                    position: "relative",
                    minHeight: "360px",
                    cursor: "pointer",
                    perspective: "1000px",
                  }}
                >
                  {/* Flip Card Container */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      transition: "transform 0.6s",
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--bg-tertiary)",
                        borderRadius: "8px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>
                            {project.name}
                          </h3>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                            {project.description}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                          style={{
                            padding: "6px 8px",
                            background: "rgba(239,68,68,0.1)",
                            border: "none",
                            borderRadius: "4px",
                            color: "#ef4444",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                          title="Delete project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          background: colors.bg,
                          borderRadius: "4px",
                          fontSize: "11px",
                          color: colors.text,
                          fontWeight: "600",
                          width: "fit-content",
                        }}
                      >
                        <span>{colors.icon}</span>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </div>

                      {/* Project Lead */}
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        <span style={{ fontWeight: "600" }}>Lead:</span> {project.projectLead || "XiaoZhu"}
                      </div>

                      {/* Tasks Count */}
                      <div
                        style={{
                          padding: "10px",
                          background: "rgba(124,90,244,0.08)",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                          {stats.total} Tasks
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {stats.completed} completed • {stats.total - stats.completed} remaining
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>Progress</span>
                          <span style={{ fontSize: "11px", color: "var(--accent-purple)", fontWeight: "600" }}>
                            {stats.percentage}%
                          </span>
                        </div>
                        <div style={{ height: "6px", background: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              background: "var(--accent-purple)",
                              width: `${stats.percentage}%`,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: "auto", fontSize: "10px", color: "var(--text-muted)", textAlign: "center" }}>
                        Click to see all tasks
                      </div>
                    </div>

                    {/* Back - Task List */}
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--bg-tertiary)",
                        borderRadius: "8px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
                        Tasks ({projectTasks.length})
                      </h3>

                      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {projectTasks.length === 0 ? (
                          <div style={{ color: "var(--text-muted)", fontSize: "11px", textAlign: "center", paddingTop: "20px" }}>
                            No tasks in this project
                          </div>
                        ) : (
                          projectTasks.map((task) => (
                            <div
                              key={task.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px",
                                background: task.status === "done" ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                                borderRadius: "4px",
                                fontSize: "11px",
                                color: task.status === "done" ? "#4ade80" : "var(--text-secondary)",
                              }}
                            >
                              <span style={{ fontSize: "12px" }}>
                                {task.status === "done" ? "✅" : "⭕"}
                              </span>
                              <span style={{ textDecoration: task.status === "done" ? "line-through" : "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {task.title}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", borderTop: "1px solid var(--bg-tertiary)", paddingTop: "8px" }}>
                        Click to flip back
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
