import { useState } from 'react';
import { Search, X, BookOpen, FileCheck } from 'lucide-react';
import Badge from '@/components/Badge';
import type { SourceChunk } from '@/types';

function isExpired(source: SourceChunk) {
  return Boolean(source.expires) && new Date(source.expires as string) < new Date();
}

function SourceCard({ source }: { source: SourceChunk }) {
  const expired = isExpired(source);
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-stone-600">
          {source.id}
        </span>
        <h3 className="font-semibold leading-tight text-stone-900">{source.title}</h3>
        {source.expires && (
          <Badge tone={expired ? 'rose' : 'emerald'}>
            {expired ? `Expired ${source.expires}` : `Valid until ${source.expires}`}
          </Badge>
        )}
      </div>
      <p className="text-[15px] leading-[1.5] text-stone-700">{source.text}</p>
      <p className="mt-3 text-xs text-stone-500">
        Version {source.version} · Owner: {source.owner}
      </p>
    </article>
  );
}

const HOW_IT_WORKS = [
  'Every check runs against the sources on this page. Nothing outside them is treated as a rule.',
  'Each finding shows the exact passage it relies on. A finding without a matching passage is never shown.',
  'Fixes are suggestions. You accept, edit or dismiss each one, and a dismissal needs a reason.',
  'Claims and expired facts are never corrected automatically. A person makes that call.',
];

export default function SourcesView({ sources }: { sources: SourceChunk[] }) {
  const [search, setSearch] = useState('');

  const guidelines = sources.filter((s) => s.kind === 'Guideline');
  const facts = sources.filter((s) => s.kind === 'Fact');

  const filterFn = (s: SourceChunk) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
  };

  const filteredGuidelines = guidelines.filter(filterFn);
  const filteredFacts = facts.filter(filterFn);
  const totalShown = filteredGuidelines.length + filteredFacts.length;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guidelines and facts"
          className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-8 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {totalShown === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-stone-200 bg-white">
          <p className="text-sm text-stone-500">No sources match "{search}".</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-8">
            {filteredGuidelines.length > 0 && (
              <section aria-labelledby="guidelines-heading" className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-stone-400" aria-hidden="true" />
                  <h2 id="guidelines-heading" className="text-lg font-semibold leading-tight text-stone-900">
                    Guidelines and terminology
                  </h2>
                  <span className="text-xs text-stone-400">({filteredGuidelines.length})</span>
                </div>
                <p className="text-sm text-stone-500">The rules that tone, wording and claims are checked against.</p>
                {filteredGuidelines.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </section>
            )}

            {filteredFacts.length > 0 && (
              <section aria-labelledby="facts-heading" className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-stone-400" aria-hidden="true" />
                  <h2 id="facts-heading" className="text-lg font-semibold leading-tight text-stone-900">
                    Approved facts
                  </h2>
                  <span className="text-xs text-stone-400">({filteredFacts.length})</span>
                </div>
                <p className="text-sm text-stone-500">
                  A fact past its expiry date is flagged for its owner to confirm before anything relies on it.
                </p>
                {filteredFacts.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-5 text-white">
                <h2 className="text-lg font-semibold leading-tight">How the review works</h2>
              </div>
              <div className="p-5">
                <ul className="space-y-3 text-[15px] leading-[1.5] text-stone-700">
                  {HOW_IT_WORKS.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
