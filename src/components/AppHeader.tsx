import { useState } from 'react';
import { ShieldCheck, ChevronDown, PanelLeft } from 'lucide-react';
import type { Role, Tab } from '@/types';

const TABS: { id: Tab; label: string }[] = [
  { id: 'review', label: 'Review' },
  { id: 'approval', label: 'Approval' },
  { id: 'sources', label: 'Sources' },
];

const ROLES: Role[] = ['Creator', 'Manager', 'Reviewer'];

interface AppHeaderProps {
  tab: Tab;
  role: Role;
  draftTitle: string;
  onRoleChange: (role: Role) => void;
  onTitleChange: (title: string) => void;
  canEditTitle: boolean;
  onToggleSidebar?: () => void;
}

export default function AppHeader({ tab, role, draftTitle, onRoleChange, onTitleChange, canEditTitle, onToggleSidebar }: AppHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(draftTitle);

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() !== '' && titleDraft !== draftTitle) {
      onTitleChange(titleDraft.trim());
    } else {
      setTitleDraft(draftTitle);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 lg:block"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          {editingTitle && canEditTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(draftTitle); } }}
              className="w-full max-w-md rounded-md border border-emerald-300 px-2 py-1 text-sm font-medium text-stone-900 focus:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            />
          ) : (
            <button
              type="button"
              onClick={() => { if (canEditTitle) { setTitleDraft(draftTitle); setEditingTitle(true); } }}
              className={`flex items-center gap-1.5 text-sm font-semibold text-stone-900 transition-colors ${canEditTitle ? 'hover:text-emerald-700' : 'cursor-default'}`}
              title={canEditTitle ? 'Click to rename' : undefined}
            >
              <span className="truncate">{draftTitle}</span>
              {canEditTitle && <ChevronDown className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />}
            </button>
          )}
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 rounded-lg bg-stone-100 p-1 sm:flex">
          {TABS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={tab === item.id ? 'page' : undefined}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                tab === item.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <div role="group" aria-label="Switch role" className="flex rounded-lg border border-stone-200 bg-white p-0.5">
            {ROLES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={role === item}
                onClick={() => onRoleChange(item)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  role === item ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav aria-label="Main" className="border-t border-stone-100 px-4 py-2 sm:hidden">
        <div className="flex gap-1">
          {TABS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={tab === item.id ? 'page' : undefined}
              className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
                tab === item.id ? 'bg-stone-100 text-stone-900' : 'text-stone-500'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
