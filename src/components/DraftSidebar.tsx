import { useState } from 'react';
import { Plus, FileText, Trash2, ShieldCheck, Loader as Loader2, Search, X } from 'lucide-react';
import type { ReviewWorkflow } from '@/hooks/useReviewWorkflow';
import type { WorkflowStatus } from '@/types';
import { BRAND_NAME } from '@/data/demoBrand';

const STATUS_DOT: Record<WorkflowStatus, string> = {
  draft: 'bg-stone-400',
  'in-review': 'bg-sky-500',
  'changes-requested': 'bg-amber-500',
  approved: 'bg-emerald-500',
};

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  'changes-requested': 'Changes requested',
  approved: 'Approved',
};

const CHANNEL_SHORT: Record<string, string> = {
  'Blog post': 'Blog',
  'Product page': 'Product',
  'Social post': 'Social',
  'Email': 'Email',
};

interface DraftSidebarProps {
  workflow: ReviewWorkflow;
}

export default function DraftSidebar({ workflow }: DraftSidebarProps) {
  const { draftList, activeDraftId, selectDraft, createDraft, deleteDraft, loadState } = workflow;
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = search.trim()
    ? draftList.filter((d) => d.title.toLowerCase().includes(search.trim().toLowerCase()))
    : draftList;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-stone-900">BrandLoom</span>
            <span className="text-[10px] text-stone-400">{BRAND_NAME}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={createDraft}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New draft
        </button>
      </div>

      {draftList.length > 3 && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drafts"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-8 pr-7 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:text-stone-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {loadState === 'loading' && draftList.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-stone-400" aria-hidden="true" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-stone-400">
            {search ? 'No matching drafts.' : 'No drafts yet.'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((draft) => {
              const isActive = draft.id === activeDraftId;
              const showConfirm = confirmDelete === draft.id;
              return (
                <li key={draft.id}>
                  {showConfirm ? (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 ring-1 ring-rose-200">
                      <span className="flex-1 text-xs text-rose-800">Delete this draft?</span>
                      <button
                        type="button"
                        onClick={() => { deleteDraft(draft.id); setConfirmDelete(null); }}
                        className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      role={isActive ? undefined : 'button'}
                      tabIndex={isActive ? undefined : 0}
                      onClick={isActive ? undefined : () => selectDraft(draft.id)}
                      onKeyDown={isActive ? undefined : (e) => { if (e.key === 'Enter') selectDraft(draft.id); }}
                      className={`group relative flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-all ${
                        isActive ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-stone-100'
                      }`}
                    >
                      <FileText className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-stone-400'}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${isActive ? 'text-emerald-900' : 'text-stone-700'}`}>
                          {draft.title}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[draft.status]}`} aria-hidden="true" />
                          <span className="text-xs text-stone-500">{STATUS_LABEL[draft.status]}</span>
                          <span className="text-xs text-stone-300">·</span>
                          <span className="text-xs text-stone-500">{CHANNEL_SHORT[draft.channel] ?? draft.channel}</span>
                          <span className="text-xs text-stone-300">·</span>
                          <span className="text-xs text-stone-500">v{draft.revision}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete ${draft.title}`}
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(draft.id); }}
                        className="shrink-0 rounded p-1 text-stone-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-stone-100 px-4 py-3">
        <p className="text-[10px] leading-tight text-stone-400">
          Drafts are saved automatically and persist across sessions.
        </p>
      </div>
    </div>
  );
}
