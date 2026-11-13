/*
# Add title to drafts, create sources table, seed brand sources

## Plain-English summary
This migration adds a title column to the drafts table so each draft can be named,
creates a sources table to store brand guidelines and approved facts in the database,
and seeds it with the eight Northwind Outdoor demo brand sources.

## Changes to existing tables
- `drafts`: new `title` column (text, not null, defaults to 'Untitled draft')

## New tables
- `sources`: stores brand guidelines, terminology rules, and approved facts
  - `id` (text, primary key — e.g. 'G-01', 'F-03')
  - `kind` (text: 'Guideline' or 'Fact')
  - `title` (text, the source name)
  - `text` (text, the approved passage)
  - `version` (text, e.g. 'v4')
  - `owner` (text, the team responsible)
  - `expires` (text, ISO date string or null)
  - `value` (text, the approved value for facts, or null)
  - `created_at` (timestamptz)

## Seed data
- Inserts the eight Northwind Outdoor sources (G-01, G-02, T-01, T-02, F-01–F-04)
- Uses ON CONFLICT (id) DO NOTHING so re-running is safe

## Security
- RLS enabled on `sources`
- SELECT granted to `anon` and `authenticated` (read-only library)
- No INSERT/UPDATE/DELETE granted — sources are managed via migrations only
*/

ALTER TABLE drafts ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Untitled draft';

CREATE TABLE IF NOT EXISTS sources (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('Guideline', 'Fact')),
  title text NOT NULL,
  text text NOT NULL,
  version text NOT NULL,
  owner text NOT NULL,
  expires text,
  value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON sources TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_sources" ON sources;
CREATE POLICY "anon_select_sources" ON sources FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO sources (id, kind, title, text, version, owner, expires, value) VALUES
  ('G-01', 'Guideline', 'Voice and tone', 'Our voice is confident, warm and plain. Avoid exclamation marks in product copy. Do not use all-caps words for emphasis.', 'v4', 'Brand team', NULL, NULL),
  ('G-02', 'Guideline', 'Claims policy', 'Superlatives such as ''best'', ''the only'' or ''number one'' need an approved fact behind them, or they must be removed. Absolute guarantees such as ''100%'' or ''guaranteed forever'' need legal review.', 'v2', 'Legal', NULL, NULL),
  ('T-01', 'Guideline', 'Terminology: water resistance', 'Use ''water-resistant'', not ''waterproof'', for shell jackets. No garment stays dry in sustained heavy rain.', 'v1', 'Product', NULL, NULL),
  ('T-02', 'Guideline', 'Terminology: product names', 'Write the product name as ''Trailpack'' (one word, capital T). Do not write ''trail pack''.', 'v1', 'Brand team', NULL, NULL),
  ('F-01', 'Fact', 'Company founding year', 'Northwind Outdoor was founded in 2009 in Bristol, UK.', 'v3', 'Head of Communications', '2028-12-31', '2009'),
  ('F-02', 'Fact', 'Ridgeline 40 weight', 'The Ridgeline 40 pack weighs 1.1 kg (size M, without bottle).', 'v2', 'Product', '2027-09-30', '1.1'),
  ('F-03', 'Fact', 'Ridgeline shell recycled content', 'At least 70% of the Ridgeline shell face fabric is recycled nylon.', 'v1', 'Sustainability', '2027-06-30', '70'),
  ('F-04', 'Fact', 'Ridgeline 40 UK price', 'The Ridgeline 40 retails at £189 in the UK.', 'v5', 'Ecommerce', '2026-03-31', '189')
ON CONFLICT (id) DO NOTHING;