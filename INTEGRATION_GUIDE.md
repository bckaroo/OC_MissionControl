# Mission Control Dashboard - Feature Integration Guide

## Overview

Three new features have been implemented for the Mission Control dashboard:

1. **Search/Command Palette** (Cmd+K)
2. **Task Filters** (Quick filters)
3. **Dark/Light Mode Toggle** (Theme switcher)

## Component Files

- `components/SearchPalette.tsx` - Global search with keyboard shortcuts
- `components/TaskFilters.tsx` - Filter tasks by assignee, priority, date range
- `components/ThemeToggle.tsx` - Theme switcher in navigation

---

## Integration Steps

### 1. Update `app/page.tsx`

Import the new components and add theme support:

```tsx
'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TaskBoard from '@/components/TaskBoard';
import CalendarScreen from '@/components/CalendarScreen';
import ProjectsScreen from '@/components/ProjectsScreen';
import MemoryScreen from '@/components/MemoryScreen';
import DocumentsScreen from '@/components/DocumentsScreen';
import TeamScreen from '@/components/TeamScreen';
import OfficeScreen from '@/components/OfficeScreen';
import ExecutionHistoryScreen from '@/components/ExecutionHistoryScreen';
import SearchPalette from '@/components/SearchPalette';
import ThemeToggle from '@/components/ThemeToggle';

export type Screen =
  | 'tasks'
  | 'calendar'
  | 'projects'
  | 'memory'
  | 'documents'
  | 'team'
  | 'office'
  | 'execution-history';

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<Screen>('tasks');
  const [mounted, setMounted] = useState(false);

  // Initialize theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Top Navigation Bar */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between">
            <SearchPalette />
            <ThemeToggle />
          </div>

          {/* Screen Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {activeScreen === 'tasks' && <TaskBoard />}
            {activeScreen === 'calendar' && <CalendarScreen />}
            {activeScreen === 'projects' && <ProjectsScreen />}
            {activeScreen === 'memory' && <MemoryScreen />}
            {activeScreen === 'documents' && <DocumentsScreen />}
            {activeScreen === 'team' && <TeamScreen />}
            {activeScreen === 'office' && <OfficeScreen />}
            {activeScreen === 'execution-history' && <ExecutionHistoryScreen />}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 2. Update `components/TaskBoard.tsx`

Add the TaskFilters component to the tasks screen:

```tsx
import { useState } from 'react';
import TaskFilters from '@/components/TaskFilters';

interface FilterState {
  assignee: string | null;
  priority: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export default function TaskBoard() {
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    priority: null,
    dateRange: 'all',
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // TODO: Filter tasks based on selected filters
    console.log('Applying filters:', newFilters);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <TaskFilters onFilterChange={handleFilterChange} />
      
      {/* Your existing task list component */}
      {/* Tasks filtered based on: filters.assignee, filters.priority, filters.dateRange */}
    </div>
  );
}
```

### 3. Ensure Tailwind Dark Mode is Enabled

Update `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

### 4. Global CSS Setup (optional but recommended)

Add this to your global CSS file for smooth theme transitions:

```css
/* globals.css */
* {
  transition-property: background-color, border-color, color;
  transition-duration: 200ms;
}

html.dark {
  color-scheme: dark;
}

html {
  color-scheme: light;
}
```

---

## Feature Details

### Search Palette (SearchPalette.tsx)

**Keyboard Shortcuts:**
- `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) - Open/Close
- `Arrow Up/Down` - Navigate results
- `Enter` - Select result
- `Escape` - Close palette

**Features:**
- Global search across tasks, documents, memory, and projects
- Real-time filtering
- Category badges
- Keyboard navigation support
- Dark mode support

**Usage:**
```tsx
<SearchPalette />
```

**Customization:**
Update the `mockData` array in `SearchPalette.tsx` with your actual data source:

```tsx
const mockData: SearchResult[] = [
  { id: '1', title: 'Review PR #42', category: 'task', description: 'Frontend updates' },
  // ... more items
];
```

Or connect to a real API:
```tsx
useEffect(() => {
  fetchSearchData().then(setResults);
}, []);
```

---

### Task Filters (TaskFilters.tsx)

**Filter Options:**
- **Assignee** - Filter by team member
- **Priority** - Critical, High, Medium, Low
- **Date Range** - All Time, Today, This Week, This Month

**Features:**
- Dropdown-based UI
- Multi-select friendly design
- Active filter badges
- Clear all filters button
- Callback on filter change

**Usage:**
```tsx
<TaskFilters onFilterChange={(filters) => {
  console.log('New filters:', filters);
  // Apply filters to task list
}} />
```

**Filter State:**
```tsx
interface FilterState {
  assignee: string | null;
  priority: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
}
```

---

### Theme Toggle (ThemeToggle.tsx)

**Features:**
- Detects system preference
- Persists user preference to localStorage
- Respects manual selection over system preference
- Smooth icon transitions
- Full keyboard accessibility

**Usage:**
```tsx
<ThemeToggle />
```

**How it Works:**
1. On first load, checks for stored preference in localStorage
2. Falls back to system preference (`prefers-color-scheme`)
3. Stores user's choice in localStorage
4. Listens for system theme changes when no preference is set
5. Applies theme by adding/removing `dark` class on `<html>` element

---

## Styling Guide

All components use **Tailwind CSS** with full dark mode support. The color scheme:

### Light Mode
- Background: white (`bg-white`)
- Text: gray-900 (`text-gray-900`)
- Borders: gray-200 (`border-gray-200`)

### Dark Mode
- Background: gray-900/950 (`dark:bg-gray-900`)
- Text: gray-50 (`dark:text-gray-50`)
- Borders: gray-700/800 (`dark:border-gray-700`)

### Status Colors
- Critical: Red (`bg-red-100 dark:bg-red-900`)
- High: Orange (`bg-orange-100 dark:bg-orange-900`)
- Medium: Yellow (`bg-yellow-100 dark:bg-yellow-900`)
- Low: Green (`bg-green-100 dark:bg-green-900`)

---

## Data Integration

### SearchPalette

Connect to your data source:

```tsx
// In SearchPalette.tsx, replace mockData with:
const [results, setResults] = useState<SearchResult[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const data = await api.search(query);
    setResults(data);
  };
  
  if (query.trim()) {
    fetchData();
  }
}, [query]);
```

### TaskFilters

Pass filters to your API/component:

```tsx
// In TaskBoard.tsx
const filteredTasks = tasks.filter(task => {
  if (filters.assignee && task.assigneeId !== filters.assignee) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  
  // Date range filtering
  if (filters.dateRange !== 'all') {
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    
    switch (filters.dateRange) {
      case 'today':
        if (taskDate.toDateString() !== today.toDateString()) return false;
        break;
      case 'week':
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (taskDate > weekEnd) return false;
        break;
      // ... handle other ranges
    }
  }
  
  return true;
});
```

---

## Accessibility Features

✅ **Keyboard Navigation**
- Search Palette: Full keyboard control
- Task Filters: Dropdown accessible via keyboard
- Theme Toggle: Proper focus states

✅ **ARIA Labels**
- Theme toggle has `aria-label`
- Search input has placeholder text
- All buttons have proper labels

✅ **Dark Mode**
- Full color contrast compliance
- No hard-coded colors that break in dark mode

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

---

## Troubleshooting

### Theme not persisting
- Check that `localStorage` is enabled
- Verify `dark` class is being added to `<html>` element

### Search Palette not opening
- Ensure the component is mounted (`isMounted` check)
- Verify keyboard event listener is attached
- Check browser console for errors

### Filters not working
- Ensure `onFilterChange` callback is connected to task filtering logic
- Check that filter state is being passed correctly
- Verify data structure matches expected format

---

## Next Steps

1. **Connect real data sources** - Replace mock data with API calls
2. **Add more search categories** - Extend search to include more content types
3. **Add filter presets** - Save/load filter combinations
4. **Add export functionality** - Export filtered results
5. **Analytics** - Track which filters are most used

---

## Files Summary

| File | Size | Purpose |
|------|------|---------|
| `SearchPalette.tsx` | 3.2 KB | Global search with keyboard shortcuts |
| `TaskFilters.tsx` | 4.6 KB | Multi-filter dropdown interface |
| `ThemeToggle.tsx` | 1.5 KB | Dark/light mode switcher |

**Total Implementation Time**: ~30 minutes including integration
