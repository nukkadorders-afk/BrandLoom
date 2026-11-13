import { Loader as Loader2 } from 'lucide-react';
import type { Channel, Finding, Severity } from '@/types';
import { CHANNELS } from '@/data/demoBrand';

const MARK_TONES: Record<Severity, string> = {
  high: 'bg-rose-100 text-rose-900',
  medium: 'bg-amber-100 text-amber-900',
  low: 'bg-stone-200 text-stone-900',
};

interface ContentEditorProps {
  text: string;
  channel: Channel;
  readOnly: boolean;
  saving: boolean;
  findings: Finding[];
  onTextChange: (text: string) => void;
  onTextBlur: (text: string) => void;
  onChannelChange: (channel: Channel) => void;
}

function HighlightedPreview({ text, findings }: { text: string; findings: Finding[] }) {
  const parts: (string | JSX.Element)[] = [];
  let cursor = 0;
  for (const finding of findings) {
    if (finding.start < cursor) continue;
    parts.push(text.slice(cursor, finding.start));
    parts.push(
      <mark key={finding.id} className={`rounded px-0.5 ${MARK_TONES[finding.severity]}`}>
        {finding.matched}
      </mark>
    );
    cursor = finding.end;
  }
  parts.push(text.slice(cursor));
  return <p className="whitespace-pre-wrap text-[15px] leading-[1.6] text-stone-800">{parts}</p>;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function ContentEditor({
  text,
  channel,
  readOnly,
  saving,
  findings,
  onTextChange,
  onTextBlur,
  onChannelChange,
}: ContentEditorProps) {
  const words = wordCount(text);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold leading-tight text-stone-900">Draft copy</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              {text.length.toLocaleString()} characters · {words} {words === 1 ? 'word' : 'words'}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            Channel
            <select
              value={channel}
              disabled={readOnly}
              onChange={(event) => onChannelChange(event.target.value as Channel)}
              className="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-900 focus:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:bg-stone-100 disabled:text-stone-500"
            >
              {CHANNELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="p-5">
          <label htmlFor="draft-text" className="sr-only">
            Draft copy
          </label>
          <textarea
            id="draft-text"
            value={text}
            readOnly={readOnly}
            onChange={(event) => onTextChange(event.target.value)}
            onBlur={(event) => onTextBlur(event.target.value)}
            rows={10}
            className="w-full resize-y rounded-lg border border-stone-300 bg-white p-4 text-[15px] leading-[1.6] text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 read-only:bg-stone-50 read-only:text-stone-700"
            placeholder="Paste or write your copy here. Findings will appear on the right as you type."
          />
          <div className="mt-2 flex items-center justify-between">
            {readOnly ? (
              <p className="text-xs text-stone-500">This revision is locked while it is being reviewed.</p>
            ) : saving ? (
              <p className="flex items-center gap-1.5 text-xs text-stone-400">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Saving…
              </p>
            ) : (
              <p className="text-xs text-stone-400">Changes save automatically.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold leading-tight text-stone-900">Highlighted preview</h2>
            <p className="mt-0.5 text-xs text-stone-500">Flagged text is coloured by severity.</p>
          </div>
          {findings.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-medium">
              <span className="flex items-center gap-1 text-rose-700"><span className="h-2 w-2 rounded bg-rose-300" /> High</span>
              <span className="flex items-center gap-1 text-amber-700"><span className="h-2 w-2 rounded bg-amber-300" /> Medium</span>
              <span className="flex items-center gap-1 text-stone-600"><span className="h-2 w-2 rounded bg-stone-300" /> Low</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-stone-50 p-4 min-h-[80px]">
          {text.trim() ? (
            <HighlightedPreview text={text} findings={findings} />
          ) : (
            <p className="text-sm text-stone-400">Nothing to show yet. Start typing above.</p>
          )}
        </div>
      </section>
    </div>
  );
}
