'use client';

import { useState, useEffect } from 'react';
import { Search, X, Command } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  category: 'task' | 'document' | 'memory' | 'project';
  description?: string;
  icon?: string;
}

export default function SearchPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Mock data - replace with real data
  const mockData: SearchResult[] = [
    { id: '1', title: 'Review PR #42', category: 'task', description: 'Frontend updates' },
    { id: '2', title: 'Q1 Planning Doc', category: 'document', description: 'Strategy overview' },
    { id: '3', title: 'Team standup notes', category: 'memory', description: 'Mar 21 meeting' },
    { id: '4', title: 'Mobile App Redesign', category: 'project', description: 'In Progress' },
    { id: '5', title: 'Fix login bug', category: 'task', description: 'Critical' },
    { id: '6', title: 'Architecture notes', category: 'memory', description: 'System design' },
  ];

  // Global keyboard handler for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }

      if (isOpen) {
        switch (e.key) {
          case 'Escape':
            setIsOpen(false);
            break;
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % results.length || 0);
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + results.length) % results.length || 0);
            break;
          case 'Enter':
            if (results[selectedIndex]) {
              handleSelect(results[selectedIndex]);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults(mockData);
      setSelectedIndex(0);
      return;
    }

    const filtered = mockData.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    console.log('Selected:', item);
    setIsOpen(false);
    setQuery('');
    // TODO: Navigate to the selected item based on category
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      task: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      document: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
      memory: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
      project: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[category] || colors.task;
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Search size={16} />
        <span>Search...</span>
        <kbd className="hidden sm:inline text-xs text-gray-400 ml-auto">
          <Command size={12} className="inline mr-1" />K
        </kbd>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Search Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          <div
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Search size={20} className="text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search tasks, documents, memory, projects..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 outline-none text-lg bg-transparent dark:text-white"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </p>
                          {result.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${getCategoryColor(
                            result.category
                          )}`}
                        >
                          {result.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Info */}
            {results.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                <span>↑↓ Navigate </span>
                <span className="mx-2">•</span>
                <span>↵ Select </span>
                <span className="mx-2">•</span>
                <span>Esc Dismiss</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
