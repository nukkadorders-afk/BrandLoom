import { CircleCheck as CheckCircle2, ShieldCheck, Inbox, TriangleAlert as AlertTriangle, Sparkles, File as FileEdit } from 'lucide-react';
import ContentEditor from '@/components/ContentEditor';
import FindingCard from '@/components/FindingCard';
import type { ReviewWorkflow } from '@/hooks/useReviewWorkflow';
import type { Category } from '@/types';

const CATEGORY_ICON: Record<Category, typeof AlertTriangle> = {
  Terminology: FileEdit,
  Tone: Sparkles,
  Claims: AlertTriangle,
  Facts: AlertTriangle,
};

export default function ReviewView({ workflow }: { workflow: ReviewWorkflow }) {
  const { findings, canEdit, sources, text, saving, status, revision, dismissals } = workflow;
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  const byCategory = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Object.keys(byCategory) as Category[];

  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${
            status === 'approved' ? 'bg-emerald-500' :
            status === 'in-review' ? 'bg-sky-500' :
            status === 'changes-requested' ? 'bg-amber-500' : 'bg-stone-400'
          }`} aria-hidden="true" />
          <span className="text-sm font-medium text-stone-700">
            {status === 'draft' && 'Draft'}
            {status === 'in-review' && 'In review'}
            {status === 'changes-requested' && 'Changes requested'}
            {status === 'approved' && 'Approved'}
          </span>
          <span className="text-xs text-stone-400">·</span>
          <span className="text-xs text-stone-500">Revision {revision}</span>
          {dismissals.length > 0 && (
            <>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-500">{dismissals.length} dismissed</span>
            </>
          )}
        </div>

        {findings.length > 0 && (
          <div className="ml-auto flex items-center gap-3 text-xs">
            {highCount > 0 && <span className="flex items-center gap-1 font-medium text-rose-700"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {highCount} high</span>}
            {mediumCount > 0 && <span className="flex items-center gap-1 font-medium text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {mediumCount} medium</span>}
            {lowCount > 0 && <span className="flex items-center gap-1 font-medium text-stone-600"><span className="h-1.5 w-1.5 rounded-full bg-stone-400" /> {lowCount} low</span>}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ContentEditor
          text={workflow.text}
          channel={workflow.channel}
          readOnly={!canEdit}
          saving={saving}
          findings={findings}
          onTextChange={workflow.setText}
          onTextBlur={workflow.saveText}
          onChannelChange={workflow.setChannel}
        />

        <section aria-labelledby="findings-heading" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="findings-heading" className="text-lg font-semibold leading-tight text-stone-900">
                Findings
              </h2>
              <p className="mt-1 text-sm text-stone-500">Each one links to the approved source it relies on.</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                findings.length === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
              }`}
            >
              {findings.length} open
            </span>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICON[cat];
                return (
                  <span key={cat} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600">
                    <Icon className="h-3 w-3 text-stone-400" aria-hidden="true" />
                    {cat} ({byCategory[cat]})
                  </span>
                );
              })}
            </div>
          )}

          {findings.length === 0 ? (
            <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                {canEdit ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="font-semibold text-emerald-950">All clear</p>
                <p className="mt-1 text-sm leading-[1.5] text-emerald-900">
                  {canEdit
                    ? 'This draft matches the approved sources. Go to Approval to send it for review.'
                    : 'This revision has no open findings.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  source={sourceById.get(finding.sourceId)}
                  canAct={canEdit}
                  onAccept={(replacement) => workflow.acceptFix(finding, replacement)}
                  onDismiss={(reason) => workflow.dismissFinding(finding, reason)}
                />
              ))}
            </div>
          )}

          {text.trim().length === 0 && canEdit && (
            <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" aria-hidden="true" />
              <p className="text-sm text-stone-600">Start writing or paste copy on the left. Findings will appear here as you type.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
