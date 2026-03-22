'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface FilterState {
  assignee: string | null;
  priority: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface TaskFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
}

export default function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    priority: null,
    dateRange: 'all',
  });

  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  // Mock data
  const assignees = [
    { id: '1', name: 'Andrew' },
    { id: '2', name: 'Sarah' },
    { id: '3', name: 'Mike' },
    { id: '4', name: 'Jane' },
  ];

  const priorities = [
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== null && v !== 'all'
  ).length;

  const clearFilters = () => {
    const cleared = {
      assignee: null,
      priority: null,
      dateRange: 'all' as const,
    };
    setFilters(cleared);
    onFilterChange?.(cleared);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      {/* Assignee Filter */}
      <div className="relative">
        <button
          onClick={() =>
            setExpandedDropdown(expandedDropdown === 'assignee' ? null : 'assignee')
          }
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            filters.assignee
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <span className="text-gray-600 dark:text-gray-400">Assignee</span>
          {filters.assignee && (
            <span className="font-medium text-blue-700 dark:text-blue-300">
              {assignees.find((a) => a.id === filters.assignee)?.name}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${
              expandedDropdown === 'assignee' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedDropdown === 'assignee' && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                handleFilterChange({ ...filters, assignee: null });
                setExpandedDropdown(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            >
              All
            </button>
            {assignees.map((person) => (
              <button
                key={person.id}
                onClick={() => {
                  handleFilterChange({ ...filters, assignee: person.id });
                  setExpandedDropdown(null);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  filters.assignee === person.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {person.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority Filter */}
      <div className="relative">
        <button
          onClick={() =>
            setExpandedDropdown(expandedDropdown === 'priority' ? null : 'priority')
          }
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            filters.priority
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <span className="text-gray-600 dark:text-gray-400">Priority</span>
          {filters.priority && (
            <span className="font-medium text-blue-700 dark:text-blue-300 capitalize">
              {filters.priority}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${
              expandedDropdown === 'priority' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedDropdown === 'priority' && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                handleFilterChange({ ...filters, priority: null });
                setExpandedDropdown(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            >
              All
            </button>
            {priorities.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  handleFilterChange({ ...filters, priority: p.value });
                  setExpandedDropdown(null);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  filters.priority === p.value
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${p.color}`}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="relative">
        <button
          onClick={() =>
            setExpandedDropdown(expandedDropdown === 'dateRange' ? null : 'dateRange')
          }
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            filters.dateRange !== 'all'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <span className="text-gray-600 dark:text-gray-400">Date</span>
          {filters.dateRange !== 'all' && (
            <span className="font-medium text-blue-700 dark:text-blue-300">
              {dateRanges.find((d) => d.value === filters.dateRange)?.label}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${
              expandedDropdown === 'dateRange' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedDropdown === 'dateRange' && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            {dateRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  handleFilterChange({
                    ...filters,
                    dateRange: range.value as FilterState['dateRange'],
                  });
                  setExpandedDropdown(null);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  filters.dateRange === range.value
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filter Badge and Clear Button */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="ml-2 flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <X size={16} />
          Clear ({activeFilterCount})
        </button>
      )}
    </div>
  );
}
