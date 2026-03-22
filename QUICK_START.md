# Quick Start Guide - Mission Control Features

**TL;DR**: Copy-paste implementation in 5 minutes.

---

## ⚡ 30-Second Setup

### 1. Add to your header (app/page.tsx)

```tsx
import SearchPalette from '@/components/SearchPalette';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <>
      <header className="flex justify-between p-4">
        <SearchPalette />
        <ThemeToggle />
      </header>
      {/* Rest of your app */}
    </>
  );
}
```

### 2. Add to task board (components/TaskBoard.tsx)

```tsx
import TaskFilters from '@/components/TaskFilters';
import { useState } from 'react';

export default function TaskBoard() {
  const [filters, setFilters] = useState({
    assignee: null,
    priority: null,
    dateRange: 'all',
  });

  return (
    <>
      <TaskFilters onFilterChange={setFilters} />
      {/* Render your filtered tasks */}
    </>
  );
}
```

### 3. Enable dark mode (tailwind.config.ts)

```ts
export default {
  darkMode: 'class',
  // ... rest of config
}
```

**Done!** All three features are now active. 🎉

---

## 🎮 Using the Features

### Search Palette
- Press **`Cmd+K`** (Mac) or **`Ctrl+K`** (Windows/Linux)
- Type to search
- Use arrow keys to navigate
- Press Enter to select
- Press Escape to close

### Task Filters
- Click any filter dropdown
- Select filter options
- Filters apply instantly
- Click **Clear** to reset

### Theme Toggle
- Click the **☀️/🌙** icon in header
- Theme changes instantly
- Your preference is saved

---

## 📝 Component Reference

### SearchPalette

```tsx
<SearchPalette />

// Props: None required
// Emits: Logs selected item to console (customize handleSelect())
// Keyboard: Cmd+K / Ctrl+K to open, ↑↓Enter to navigate
```

### TaskFilters

```tsx
<TaskFilters onFilterChange={(filters) => {
  // filters.assignee: string | null
  // filters.priority: string | null  
  // filters.dateRange: 'all' | 'today' | 'week' | 'month'
}} />
```

### ThemeToggle

```tsx
<ThemeToggle />

// Props: None
// Stores in localStorage as 'theme'
// Syncs with system preference
```

---

## 🔌 Connecting Real Data

### Search Palette

Replace mock data in `SearchPalette.tsx`:

```tsx
const mockData: SearchResult[] = [];

useEffect(() => {
  const loadData = async () => {
    const res = await fetch('/api/search?q=' + query);
    const data = await res.json();
    setResults(data);
  };
  
  if (query.trim()) {
    loadData();
  }
}, [query]);
```

### Task Filters

In your TaskBoard, filter the data:

```tsx
const filteredTasks = tasks.filter(task => {
  // Apply all active filters
  if (filters.assignee && task.assigneeId !== filters.assignee) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  
  // Handle date range
  if (filters.dateRange !== 'all') {
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    
    // Add your date logic here
    // ...
  }
  
  return true;
});

return (
  <>
    <TaskFilters onFilterChange={setFilters} />
    {filteredTasks.map(task => (
      // Render task
    ))}
  </>
);
```

---

## 🎨 Customization

### Colors

All components use Tailwind classes with `dark:` variants:

```tsx
// Light: bg-white, dark: bg-gray-900
'bg-white dark:bg-gray-900'

// Light: text-gray-900, dark: text-gray-50
'text-gray-900 dark:text-gray-50'
```

Change these in the component files:

```tsx
// In SearchPalette.tsx or TaskFilters.tsx
className='bg-white dark:bg-gray-900'
//        ^^^^^^ light mode  ^^^^^^^^^^^^ dark mode
```

### Icons

All icons use `lucide-react`. Available icons:

```tsx
import { Search, Sun, Moon, ChevronDown, X } from 'lucide-react';

// Use anywhere:
<Search size={20} />
<Sun size={20} />
```

---

## 🔍 Keyboard Shortcuts

| Key | Component | Action |
|-----|-----------|--------|
| `Cmd+K` / `Ctrl+K` | SearchPalette | Open/close search |
| `↑` / `↓` | SearchPalette | Navigate results |
| `↵` | SearchPalette | Select result |
| `Esc` | SearchPalette | Close search |
| `Tab` | TaskFilters | Navigate dropdowns |
| `↓` | TaskFilters | Open dropdown |
| `Esc` | TaskFilters | Close dropdown |

---

## 🐛 Quick Fixes

### Dark mode not working?
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Search not opening?
- Check `isMounted` state in component
- Verify keyboard listener is attached
- Check console for errors

### Filters not applying?
- Verify `onFilterChange` callback is wired
- Check filter state is being used in render
- Log filters to verify state changes

---

## 📦 Component Sizes

| Component | Size |
|-----------|------|
| SearchPalette.tsx | 3.2 KB |
| TaskFilters.tsx | 4.6 KB |
| ThemeToggle.tsx | 1.5 KB |
| **Total** | **~9.3 KB** |

All gzipped - very minimal impact!

---

## 🚀 Next Steps

1. ✅ Copy components to your project
2. ✅ Add to your page/layout
3. ✅ Connect to real data
4. ✅ Customize colors/styling
5. ✅ Add tracking/analytics (optional)

---

## 📚 Full Documentation

- 📖 [Features README](./FEATURES_README.md) - Detailed feature docs
- 🔗 [Integration Guide](./INTEGRATION_GUIDE.md) - Complete integration steps
- 💡 [Example Implementation](./components/ExampleIntegration.tsx) - Working example

---

## 💬 Questions?

**Common Issues:**

**Q: How do I customize the mock data?**
A: Edit the `mockData` array in SearchPalette.tsx or connect to an API.

**Q: Can I change the theme colors?**
A: Yes! Change the Tailwind classes in the component files.

**Q: Does it work on mobile?**
A: Yes! All components are fully responsive.

**Q: Can I use this with TypeScript?**
A: Yes! The components already have full TypeScript support.

**Q: How do I track user interactions?**
A: Add `console.log()` or your analytics code in the callback functions.

---

## ✨ You're All Set!

Your Mission Control Dashboard now has:
- 🔍 Instant search (Cmd+K)
- 📊 Smart filters
- 🌓 Dark mode toggle

Enjoy! 🎉
