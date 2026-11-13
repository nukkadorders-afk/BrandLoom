import { supabase } from '@/lib/supabaseClient';
import type { SourceChunk } from '@/types';
import type { Category, Channel, Role, WorkflowStatus, Approver } from '@/types';

export interface DraftRow {
  id: string;
  title: string;
  text: string;
  channel: Channel;
  revision: number;
  status: WorkflowStatus;
  routed_to: Approver | null;
  created_at: string;
  updated_at: string;
}

export interface DismissalRow {
  id: string;
  draft_id: string;
  dismiss_key: string;
  category: Category;
  reason: string;
  created_at: string;
}

export interface LogRow {
  id: string;
  draft_id: string;
  actor: Role | 'System';
  message: string;
  created_at: string;
}

export async function fetchSources(): Promise<SourceChunk[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('id, kind, title, text, version, owner, expires, value')
    .order('id');
  if (error) throw error;
  return (data ?? []) as SourceChunk[];
}

export async function fetchDrafts(): Promise<DraftRow[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('id, title, text, channel, revision, status, routed_to, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DraftRow[];
}

export async function createDraft(title: string, text: string, channel: Channel): Promise<DraftRow> {
  const { data, error } = await supabase
    .from('drafts')
    .insert({ title, text, channel })
    .select('id, title, text, channel, revision, status, routed_to, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as DraftRow;
}

export async function updateDraft(id: string, patch: Partial<Pick<DraftRow, 'title' | 'text' | 'channel' | 'revision' | 'status' | 'routed_to'>>): Promise<DraftRow> {
  const { data, error } = await supabase
    .from('drafts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, title, text, channel, revision, status, routed_to, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as DraftRow;
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase.from('drafts').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDismissals(draftId: string): Promise<DismissalRow[]> {
  const { data, error } = await supabase
    .from('dismissals')
    .select('id, draft_id, dismiss_key, category, reason, created_at')
    .eq('draft_id', draftId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DismissalRow[];
}

export async function addDismissal(draftId: string, dismissKey: string, category: Category, reason: string): Promise<void> {
  const { error } = await supabase
    .from('dismissals')
    .insert({ draft_id: draftId, dismiss_key: dismissKey, category, reason });
  if (error) throw error;
}

export async function fetchLog(draftId: string): Promise<LogRow[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id, draft_id, actor, message, created_at')
    .eq('draft_id', draftId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LogRow[];
}

export async function addLog(draftId: string, actor: Role | 'System', message: string): Promise<void> {
  const { error } = await supabase
    .from('activity_log')
    .insert({ draft_id: draftId, actor, message });
  if (error) throw error;
}

