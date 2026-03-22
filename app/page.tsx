"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TaskBoard from "@/components/TaskBoard";
import CalendarScreen from "@/components/CalendarScreen";
import ProjectsScreen from "@/components/ProjectsScreen";
import MemoryScreen from "@/components/MemoryScreen";
import DocumentsScreen from "@/components/DocumentsScreen";
import TeamScreen from "@/components/TeamScreen";
import OfficeScreen from "@/components/OfficeScreen";
import ExecutionHistoryScreen from "@/components/ExecutionHistoryScreen";
import ModeScreen from "@/components/ModeScreen";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import SkillsScreen from "@/components/SkillsScreen";
import SystemMonitor from "@/components/SystemMonitor";
import OverviewScreen from "@/components/OverviewScreen";
import SituationRoom from "@/components/SituationRoom";

export type Screen =
  | "overview"
  | "tasks"
  | "calendar"
  | "projects"
  | "memory"
  | "documents"
  | "team"
  | "situation-room"
  | "execution-history"
  | "models"
  | "maintenance"
  | "skills";

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<Screen>("tasks");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "12px 0" }}>
          <SystemMonitor />
        </div>
        {activeScreen === "overview" && <OverviewScreen />}
        {activeScreen === "tasks" && <TaskBoard />}
        {activeScreen === "calendar" && <CalendarScreen />}
        {activeScreen === "projects" && <ProjectsScreen />}
        {activeScreen === "memory" && <MemoryScreen />}
        {activeScreen === "documents" && <DocumentsScreen />}
        {activeScreen === "team" && <TeamScreen />}
        {activeScreen === "situation-room" && <SituationRoom />}
        {activeScreen === "execution-history" && <ExecutionHistoryScreen />}
        {activeScreen === "models" && <ModeScreen />}
        {activeScreen === "maintenance" && <MaintenanceScreen />}
        {activeScreen === "skills" && <SkillsScreen />}
      </main>
    </div>
  );
}
