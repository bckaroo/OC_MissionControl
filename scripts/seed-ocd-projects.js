#!/usr/bin/env node

/**
 * Seed OCD projects from projects.json into Mission Control
 * Run: node scripts/seed-ocd-projects.js
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_FILE = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'workspace', 'projects.json');
const TASKS_FILE = path.join(__dirname, '../data/tasks.json');

// Ensure data dir exists
const DATA_DIR = path.dirname(TASKS_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read projects from workspace
let projects = [];
try {
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  const data = JSON.parse(raw);
  projects = data.projects || [];
  console.log(`✅ Loaded ${projects.length} projects from ${PROJECTS_FILE}`);
} catch (err) {
  console.error('❌ Failed to read projects.json:', err.message);
  process.exit(1);
}

// Flatten all tasks from all projects
const allTasks = [];
projects.forEach(project => {
  if (project.tasks && Array.isArray(project.tasks)) {
    project.tasks.forEach(task => {
      allTasks.push({
        ...task,
        projectId: project.id, // Add projectId reference
      });
    });
  }
});

console.log(`📝 Extracted ${allTasks.length} tasks from projects`);

// Write tasks to Mission Control database
const tasksStore = { tasks: allTasks };
try {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksStore, null, 2), 'utf-8');
  console.log(`✅ Wrote ${allTasks.length} tasks to ${TASKS_FILE}`);
} catch (err) {
  console.error('❌ Failed to write tasks.json:', err.message);
  process.exit(1);
}

// Update projects.json to use taskIds array instead of nested tasks
const updatedProjects = projects.map(project => ({
  id: project.id,
  name: project.name,
  description: project.description,
  status: project.status,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  taskIds: (project.tasks || []).map(t => t.id), // Convert to ID array
}));

try {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects: updatedProjects }, null, 2), 'utf-8');
  console.log(`✅ Updated ${PROJECTS_FILE} with taskIds references`);
} catch (err) {
  console.error('❌ Failed to update projects.json:', err.message);
  process.exit(1);
}

console.log('\n✨ Migration complete!');
console.log(`📊 Summary:`);
console.log(`   Projects: ${updatedProjects.length}`);
console.log(`   Total tasks: ${allTasks.length}`);
console.log(`   Task distribution:`);
updatedProjects.forEach(p => {
  const taskCount = (p.taskIds || []).length;
  console.log(`   - ${p.name}: ${taskCount} tasks`);
});
