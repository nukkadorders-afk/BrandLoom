import { useState } from 'react';
import { Send, Clock, FileText, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, MessageSquare, ArrowRight, Check, Undo2 } from 'lucide-react';
import Badge from '@/components/Badge';
import type { ReviewWorkflow } from '@/hooks/useReviewWorkflow';
import type { WorkflowStatus } from '@/types';

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  'in-review': 'Waiting for review',
  'changes-requested': 'Changes requested',
  approved: 'Approved',
};

const STATUS_TONE: Record<WorkflowStatus, 'stone' | 'sky' | 'amber' | 'emerald'> = {
  draft: 'stone',
  'in-review': 'sky',
  'changes-requested': 'amber',
  approved: 'emerald',
};

const STATUS_ICON: Record<WorkflowStatus, typeof Clock> = {
  draft: FileText,
  'in-review': Clock,
  'changes-requested': AlertTriangle,
  approved: CheckCircle2,
};

const STATUS_HELP: Record<WorkflowStatus, string> = {
  draft: 'Resolve or dismiss every finding, then send this draft to your approver.',
  'in-review': 'Your approver is reading this revision. It stays locked until they respond.',
  'changes-requested': 'Your approver asked for changes. Edit the draft in the Review tab, then resubmit.',
  approved: 'This revision is approved and ready to publish. The decision is in the activity log.',
};

const ACTOR_ICON: Record<string, typeof Clock> = {
  Creator: FileText,
  Manager: CheckCircle2,
  Reviewer: CheckCircle2,
  System: ArrowRight,
};

export default function ApprovalView({ workflow }: { workflow: ReviewWorkflow }) {
  const { status, role, routedTo, requiredApprover, findings, log, canSubmit, revision } = workflow;
  const [comment, setComment] = useState('');
  const isApprover = status === 'in-review' && routedTo !== null && role === routedTo;
  const canDecide = isApprover && comment.trim() !== '';
  const StatusIcon = STATUS_ICON[status];

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="space-y-5">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
              status === 'in-review' ? 'bg-sky-100 text-sky-700' :
              status === 'changes-requested' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
            }`}>
              <StatusIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold leading-tight text-stone-900">Revision {revision}</h2>
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
          </div>
          <p className="text-sm leading-[1.5] text-stone-700">{STATUS_HELP[status]}</p>

          <dl className="mt-5 grid gap-4 border-t border-stone-100 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">Open findings</dt>
              <dd className="mt-1 text-lg font-semibold text-stone-900">{findings.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">Approver</dt>
              <dd className="mt-1 text-lg font-semibold text-stone-900">
                {routedTo ?? requiredApprover}
                {routedTo === null && <span className="text-sm font-normal text-stone-400"> (if submitted now)</span>}
              </dd>
            </div>
          </dl>
          {requiredApprover === 'Reviewer' && routedTo === null && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-[1.5] text-amber-900">
              You dismissed a claim or fact finding, so a Reviewer must approve this copy.
            </p>
          )}
        </div>

        {role === 'Creator' && (status === 'draft' || status === 'changes-requested') && (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-semibold text-stone-900">Send for approval</h3>
            <p className="mb-4 text-sm leading-[1.5] text-stone-600">
              {findings.length > 0
                ? `Resolve or dismiss the ${findings.length} open ${findings.length === 1 ? 'finding' : 'findings'} first.`
                : 'Nothing is blocking submission.'}
            </p>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={workflow.submitForApproval}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit for approval
            </button>
          </div>
        )}

        {isApprover && (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-semibold text-stone-900">Decision</h3>
            <p className="mb-4 text-sm leading-[1.5] text-stone-600">
              Add a note for the creator. A note is required to request changes.
            </p>
            <label htmlFor="decision-note" className="sr-only">
              Comment
            </label>
            <textarea
              id="decision-note"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              placeholder="For example: Confirm the 2009 founding year with Communications."
              className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  workflow.decide('approve', comment);
                  setComment('');
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Approve
              </button>
              <button
                type="button"
                disabled={!canDecide}
                onClick={() => {
                  workflow.decide('request-changes', comment);
                  setComment('');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition-all hover:bg-stone-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Request changes
              </button>
            </div>
          </div>
        )}

        {status === 'in-review' && !isApprover && (
          <p className="rounded-xl bg-sky-50 p-4 text-sm leading-[1.5] text-sky-900">
            Waiting for a {routedTo} to decide. Switch to that role in the header to review it.
          </p>
        )}
      </section>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="mb-1 text-base font-semibold leading-tight text-stone-900">
          Activity timeline
        </h2>
        <p className="mb-4 text-sm text-stone-500">A record of every edit, decision and comment.</p>
        {log.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-stone-300" aria-hidden="true" />
            <p className="text-sm text-stone-500">No activity yet.</p>
          </div>
        ) : (
          <ol className="relative space-y-0.5 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-stone-200">
            {log.map((entry) => {
              const Icon = ACTOR_ICON[entry.actor] ?? ArrowRight;
              return (
                <li key={entry.id} className="relative flex gap-3 pb-1">
                  <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-stone-50 ${
                    entry.actor === 'System' ? 'bg-stone-100 text-stone-400' :
                    entry.actor === 'Creator' ? 'bg-sky-100 text-sky-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 pt-1.5 pb-3">
                    <div className="mb-0.5 flex items-center gap-2 text-xs">
                      <span className="font-medium text-stone-700">{entry.actor}</span>
                      <time className="text-stone-400">{entry.time}</time>
                    </div>
                    <p className="text-sm leading-[1.5] text-stone-800">{entry.message}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
