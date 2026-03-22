'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

/**
 * SidebarNav — Dashboard Navigation Component
 * Shows Notes link above XiaoZhu (Chief Agent) entry
 */
export default function SidebarNav({ agents }: { agents: Array<{ name: string; emoji: string }> }) {
  const pathname = usePathname();

  const navItems = [
    {
      title: '📝 Notes',
      href: '/reports',
      description: 'Development log & release notes',
    },
    {
      title: '🖥️ System Monitor',
      href: '/dashboard/system',
      description: 'CPU, RAM, Load, Uptime',
    },
    // ... other agents would be rendered here in parent
  ];

  return (
    <div className="space-y-4 mb-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors hover:text-white ${
            pathname === item.href ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <span className="text-base">{item.title.split(' ')[0]}</span>
          <span className="truncate">{item.title}</span>
        </Link>
      ))}
    </div>
  );
}