'use client';

/**
 * EXAMPLE: How to integrate the three new features into your dashboard
 * 
 * This shows a complete example of:
 * 1. Using SearchPalette for global search
 * 2. Using TaskFilters to filter tasks
 * 3. Using ThemeToggle for theme switching
 * 4. Creating a responsive header layout
 */

import { useState } from 'react';
import SearchPalette from './SearchPalette';
import TaskFilters from './TaskFilters';
import ThemeToggle from './ThemeToggle';

interface FilterState {
  assignee: string | null;
  priority: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
}

// Mock task data
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Review PR #42',
    description: 'Frontend updates for dashboard',
    assigneeId: '1',
    priority: 'high',
    dueDate: new Date().toISOString(),
    completed: false,
  },
  {
    id: '2',
    title: 'Fix login bug',
    description: 'Users unable to login on mobile',
    assigneeId: '2',
    priority: 'critical',
    dueDate: new Date().toISOString(),
    completed: false,
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'API docs need updating',
    assigneeId: '3',
    priority: 'low',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
  },
];

export default function ExampleIntegration() {
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    priority: null,
    dateRange: 'all',
  });

  const [tasks] = useState<Task[]>(MOCK_TASKS);

  // Filter tasks based on active filters
  const filteredTasks = tasks.filter((task) => {
    // Filter by assignee
    if (filters.assignee && task.assigneeId !== filters.assignee) {
      return false;
    }

    // Filter by priority
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const taskDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filters.dateRange) {
        case 'today': {
          const taskDateOnly = new Date(taskDate);
          taskDateOnly.setHours(0, 0, 0, 0);
          if (taskDateOnly.getTime() !== today.getTime()) {
            return false;
          }
          break;
        }
        case 'week': {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          if (taskDate > weekEnd) {
            return false;
          }
          break;
        }
        case 'month': {
          const monthEnd = new Date(today);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          if (taskDate > monthEnd) {
            return false;
          }
          break;
        }
      }
    }

    return true;
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Tasks will automatically re-filter based on new filters
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    };
    return colors[priority] || colors.low;
  };

  return (
    <div className="w-full h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* HEADER: Search + Theme Toggle */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <SearchPalette />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <h1 className="text-3xl font-bold mb-6">Tasks</h1>

          {/* FILTERS */}
          <TaskFilters onFilterChange={handleFilterChange} />

          {/* TASK COUNT */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>

          {/* TASK LIST */}
          <div className="grid gap-4">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No tasks match the selected filters</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md dark:hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded capitalize ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        readOnly
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
