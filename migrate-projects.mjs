import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECTS_FILE = path.join(process.env.USERPROFILE, '.openclaw', 'workspace', 'projects.json');
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');

try {
  // Read projects
  const projectsRaw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  const projectsData = JSON.parse(projectsRaw);
  const projects = projectsData.projects || [];

  // Extract all tasks and add projectId
  const allTasks = [];
  projects.forEach(project => {
    if (project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach(task => {
        allTasks.push({
          ...task,
          projectId: project.id,
        });
      });
    }
  });

  // Write tasks to Mission Control
  fs.mkdirSync(path.dirname(TASKS_FILE), { recursive: true });
  fs.writeFileSync(TASKS_FILE, JSON.stringify({ tasks: allTasks }, null, 2));
  console.log(`✅ Wrote ${allTasks.length} tasks to Mission Control`);

  // Update projects.json with taskIds references
  const updatedProjects = projects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    taskIds: (p.tasks || []).map(t => t.id),
  }));

  fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects: updatedProjects }, null, 2));
  console.log(`✅ Updated projects.json with taskIds references`);

  console.log('\n✨ Migration successful!');
  updatedProjects.forEach(p => {
    console.log(`   ${p.name}: ${p.taskIds.length} tasks`);
  });
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
}
