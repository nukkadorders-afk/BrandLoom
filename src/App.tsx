import { useEffect, useState } from 'react';
import { CircleAlert as AlertCircle, X } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ApprovalView from '@/components/ApprovalView';
import DraftSidebar from '@/components/DraftSidebar';
import ReviewView from '@/components/ReviewView';
import SourcesView from '@/components/SourcesView';
import { useReviewWorkflow } from '@/hooks/useReviewWorkflow';
import { applyPageMeta } from '@/lib/pageMeta';
import type { Tab } from '@/types';

const TAB_IDS: Tab[] = ['review', 'approval', 'sources'];

const TAB_META: Record<Tab, { title: string; description: string }> = {
  review: {
    title: 'Review a draft | BrandLoom',
    description:
      'Check marketing copy against brand guidelines, terminology and approved facts before you publish. Every finding cites its source.',
  },
  approval: {
    title: 'Approval workflow | BrandLoom',
    description:
      'Route brand-checked drafts to a manager or reviewer. Every request, comment and approval is logged with who decided and when.',
  },
  sources: {
    title: 'Source library | BrandLoom',
    description:
      'Browse the guidelines, terminology and approved facts behind every brand check, with versions, owners and expiry dates.',
  },
};

const tabFromHash = (): Tab => {
  const id = window.location.hash.replace('#', '');
  return TAB_IDS.find((item) => item === id) ?? 'review';
};

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const workflow = useReviewWorkflow();

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    applyPageMeta(TAB_META[tab]);
  }, [tab]);

  return (
    <div className="flex h-screen flex-col bg-stone-50 text-stone-900">
      <AppHeader
        tab={tab}
        role={workflow.role}
        draftTitle={workflow.title}
        onRoleChange={workflow.setRole}
        onTitleChange={workflow.setTitle}
        canEditTitle={workflow.canEdit}
      />

      {workflow.error && (
        <div className="flex items-center gap-3 border-b border-rose-200 bg-rose-50 px-4 py-2.5 sm:px-6">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          <p className="flex-1 text-sm text-rose-800">{workflow.error}</p>
          <button type="button" onClick={workflow.clearError} className="rounded p-1 text-rose-500 hover:bg-rose-100">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white lg:block">
          <DraftSidebar workflow={workflow} />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-stone-200 bg-white shadow-xl">
              <DraftSidebar workflow={workflow} />
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Drafts
              </button>
              <span className="truncate text-sm font-medium text-stone-600">{workflow.title}</span>
            </div>

            {workflow.loadState === 'loading' && workflow.draftList.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-stone-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-600" />
                  <p className="text-sm">Loading your workspace…</p>
                </div>
              </div>
            ) : workflow.loadState === 'error' && workflow.draftList.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-400" aria-hidden="true" />
                  <p className="text-sm text-stone-600">Could not load the workspace. {workflow.error}</p>
                </div>
              </div>
            ) : (
              <div key={tab} className="animate-fade-in">
                {tab === 'review' && <ReviewView workflow={workflow} />}
                {tab === 'approval' && <ApprovalView workflow={workflow} />}
                {tab === 'sources' && <SourcesView sources={workflow.sources} />}
              </div>
            )}
          </div>

          <footer className="border-t border-stone-200 bg-white px-4 py-5 sm:px-6">
            <div className="mx-auto flex max-w-5xl flex-col gap-2 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
              <p>BrandLoom — brand governance before publication.</p>
              <p>Drafts and activity are stored securely and persist across sessions.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
