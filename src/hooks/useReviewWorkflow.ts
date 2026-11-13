import { useCallback, useEffect, useMemo, useState } from 'react';
import { SAMPLE_CONTENT } from '@/data/demoBrand';
import { runReview } from '@/lib/reviewEngine';
import {
  addDismissal,
  addLog,
  createDraft,
  deleteDraft,
  fetchDismissals,
  fetchDrafts,
  fetchLog,
  fetchSources,
  updateDraft,
  type DraftRow,
  type DismissalRow,
  type LogRow,
} from '@/lib/database';
import type {
  Approver,
  Channel,
  Dismissal,
  Finding,
  LogEntry,
  Role,
  SourceChunk,
  WorkflowStatus,
} from '@/types';

export type LoadState = 'loading' | 'loaded' | 'error';

interface DraftMeta {
  id: string;
  title: string;
  channel: Channel;
  revision: number;
  status: WorkflowStatus;
  routed_to: Approver | null;
  updated_at: string;
}

function rowToLogEntry(row: LogRow): LogEntry {
  const time = new Date(row.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return { id: row.id, time, actor: row.actor, message: row.message };
}

function rowToDismissal(row: DismissalRow): Dismissal {
  return { key: row.dismiss_key, category: row.category, reason: row.reason };
}

export function useReviewWorkflow() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [sources, setSources] = useState<SourceChunk[]>([]);
  const [draftList, setDraftList] = useState<DraftMeta[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled draft');
  const [text, setText] = useState('');
  const [channel, setChannel] = useState<Channel>('Blog post');
  const [revision, setRevision] = useState(1);
  const [role, setRole] = useState<Role>('Creator');
  const [status, setStatus] = useState<WorkflowStatus>('draft');
  const [routedTo, setRoutedTo] = useState<Approver | null>(null);
  const [dismissals, setDismissals] = useState<Dismissal[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Initial load ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [srcs, drafts] = await Promise.all([fetchSources(), fetchDrafts()]);
        if (cancelled) return;
        setSources(srcs);

        if (drafts.length === 0) {
          const created = await createDraft('Northwind Outdoor launch blog', SAMPLE_CONTENT, 'Blog post');
          if (cancelled) return;
          await addLog(created.id, 'System', 'Draft created as revision 1.');
          const [diss, logRows] = await Promise.all([fetchDismissals(created.id), fetchLog(created.id)]);
          if (cancelled) return;
          applyDraft(created, diss, logRows);
          await refreshDraftList();
        } else {
          const first = drafts[0];
          const [diss, logRows] = await Promise.all([fetchDismissals(first.id), fetchLog(first.id)]);
          if (cancelled) return;
          applyDraft(first, diss, logRows);
          setDraftList(drafts.map(draftToMeta));
        }
        setLoadState('loaded');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoadState('error');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyDraft(row: DraftRow, diss: DismissalRow[], logRows: LogRow[]) {
    setActiveDraftId(row.id);
    setTitle(row.title);
    setText(row.text);
    setChannel(row.channel);
    setRevision(row.revision);
    setStatus(row.status);
    setRoutedTo(row.routed_to);
    setDismissals(diss.map(rowToDismissal));
    setLog(logRows.map(rowToLogEntry));
  }

  function draftToMeta(row: DraftRow): DraftMeta {
    return {
      id: row.id,
      title: row.title,
      channel: row.channel,
      revision: row.revision,
      status: row.status,
      routed_to: row.routed_to,
      updated_at: row.updated_at,
    };
  }

  async function refreshDraftList() {
    try {
      const drafts = await fetchDrafts();
      setDraftList(drafts.map(draftToMeta));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refreshLog(draftId: string) {
    try {
      const logRows = await fetchLog(draftId);
      setLog(logRows.map(rowToLogEntry));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refreshDismissals(draftId: string) {
    try {
      const diss = await fetchDismissals(draftId);
      setDismissals(diss.map(rowToDismissal));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // --- Derived values ---
  const review = useMemo(() => runReview(text, sources.length > 0 ? sources : []), [text, sources]);
  const dismissedKeys = useMemo(() => new Set(dismissals.map((item) => item.key)), [dismissals]);
  const findings: Finding[] = review.findings.filter((finding) => !dismissedKeys.has(finding.dismissKey));

  const requiredApprover: Approver = dismissals.some(
    (item) => item.category === 'Claims' || item.category === 'Facts'
  )
    ? 'Reviewer'
    : 'Manager';

  const canEdit = role === 'Creator' && (status === 'draft' || status === 'changes-requested');
  const canSubmit = canEdit && findings.length === 0 && text.trim().length > 0;

  // --- Actions ---
  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);
    },
    []
  );

  const saveText = useCallback(
    async (newText: string) => {
      if (!activeDraftId) return;
      setSaving(true);
      try {
        await updateDraft(activeDraftId, { text: newText });
        await refreshDraftList();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    },
    [activeDraftId]
  );

  const handleChannelChange = useCallback(
    async (newChannel: Channel) => {
      setChannel(newChannel);
      if (!activeDraftId) return;
      try {
        await updateDraft(activeDraftId, { channel: newChannel });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [activeDraftId]
  );

  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      setTitle(newTitle);
      if (!activeDraftId) return;
      try {
        await updateDraft(activeDraftId, { title: newTitle });
        await refreshDraftList();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [activeDraftId]
  );

  const acceptFix = useCallback(
    async (finding: Finding, replacement: string) => {
      if (!canEdit || !activeDraftId || finding.fix === null || replacement.trim() === '') return;
      const newText = text.slice(0, finding.start) + replacement + text.slice(finding.end);
      setText(newText);
      const newRevision = revision + 1;
      setRevision(newRevision);
      setSaving(true);
      try {
        await updateDraft(activeDraftId, { text: newText, revision: newRevision });
        await addLog(activeDraftId, 'Creator', `Accepted a fix: "${finding.matched}" changed to "${replacement}". Now revision ${newRevision}.`);
        await Promise.all([refreshLog(activeDraftId), refreshDraftList()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    },
    [canEdit, activeDraftId, text, revision]
  );

  const dismissFinding = useCallback(
    async (finding: Finding, reason: string) => {
      if (!canEdit || !activeDraftId || reason.trim() === '') return;
      setDismissals((prev) => [...prev, { key: finding.dismissKey, category: finding.category, reason: reason.trim() }]);
      try {
        await addDismissal(activeDraftId, finding.dismissKey, finding.category, reason.trim());
        await addLog(activeDraftId, 'Creator', `Dismissed "${finding.matched}" (${finding.category}). Reason: ${reason.trim()}`);
        await refreshLog(activeDraftId);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [canEdit, activeDraftId]
  );

  const submitForApproval = useCallback(async () => {
    if (!canSubmit || !activeDraftId) return;
    const submittedRevision = status === 'changes-requested' ? revision + 1 : revision;
    setRevision(submittedRevision);
    setStatus('in-review');
    setRoutedTo(requiredApprover);
    try {
      await updateDraft(activeDraftId, { revision: submittedRevision, status: 'in-review', routed_to: requiredApprover });
      await addLog(activeDraftId, 'Creator', `Submitted revision ${submittedRevision} for approval. Routed to ${requiredApprover}.`);
      await Promise.all([refreshLog(activeDraftId), refreshDraftList()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [canSubmit, activeDraftId, status, revision, requiredApprover]);

  const decide = useCallback(
    async (decision: 'approve' | 'request-changes', comment: string) => {
      if (status !== 'in-review' || routedTo === null || role !== routedTo || !activeDraftId) return;
      if (decision === 'approve') {
        setStatus('approved');
        try {
          await updateDraft(activeDraftId, { status: 'approved' });
          await addLog(activeDraftId, role, `Approved revision ${revision}.${comment.trim() ? ` Note: ${comment.trim()}` : ''}`);
          await Promise.all([refreshLog(activeDraftId), refreshDraftList()]);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
        return;
      }
      if (comment.trim() === '') return;
      setStatus('changes-requested');
      try {
        await updateDraft(activeDraftId, { status: 'changes-requested' });
        await addLog(activeDraftId, role, `Requested changes on revision ${revision}: ${comment.trim()}`);
        await Promise.all([refreshLog(activeDraftId), refreshDraftList()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [status, routedTo, role, activeDraftId, revision]
  );

  const selectDraft = useCallback(async (draftId: string) => {
    setLoadState('loading');
    try {
      const [diss, logRows] = await Promise.all([fetchDismissals(draftId), fetchLog(draftId)]);
      const drafts = await fetchDrafts();
      const row = drafts.find((d) => d.id === draftId);
      if (!row) return;
      applyDraft(row, diss, logRows);
      setDraftList(drafts.map(draftToMeta));
      setLoadState('loaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoadState('error');
    }
  }, []);

  const handleCreateDraft = useCallback(async () => {
    try {
      const created = await createDraft('Untitled draft', '', 'Blog post');
      await addLog(created.id, 'System', 'Draft created as revision 1.');
      const [diss, logRows] = await Promise.all([fetchDismissals(created.id), fetchLog(created.id)]);
      applyDraft(created, diss, logRows);
      await refreshDraftList();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleDeleteDraft = useCallback(async (draftId: string) => {
    try {
      await deleteDraft(draftId);
      const drafts = await fetchDrafts();
      if (drafts.length === 0) {
        const created = await createDraft('Untitled draft', '', 'Blog post');
        await addLog(created.id, 'System', 'Draft created as revision 1.');
        const [diss, logRows] = await Promise.all([fetchDismissals(created.id), fetchLog(created.id)]);
        applyDraft(created, diss, logRows);
        setDraftList([draftToMeta(created)]);
      } else {
        setDraftList(drafts.map(draftToMeta));
        const first = drafts[0];
        const [diss, logRows] = await Promise.all([fetchDismissals(first.id), fetchLog(first.id)]);
        applyDraft(first, diss, logRows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loadState,
    error,
    clearError,
    sources,
    draftList,
    activeDraftId,
    title,
    text,
    channel,
    revision,
    role,
    status,
    routedTo,
    requiredApprover,
    findings,
    dismissals,
    log,
    canEdit,
    canSubmit,
    saving,
    setText: handleTextChange,
    saveText,
    setChannel: handleChannelChange,
    setTitle: handleTitleChange,
    setRole,
    acceptFix,
    dismissFinding,
    submitForApproval,
    decide,
    selectDraft,
    createDraft: handleCreateDraft,
    deleteDraft: handleDeleteDraft,
  };
}

export type ReviewWorkflow = ReturnType<typeof useReviewWorkflow>;
