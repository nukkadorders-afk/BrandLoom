/*
# Allow draft deletion

Adds a DELETE policy on the drafts table so the app can remove a draft
and its related dismissals and activity log entries (via ON DELETE CASCADE).
- DROP POLICY IF EXISTS + CREATE POLICY for idempotency
- Grants DELETE to anon and authenticated (no-auth single-tenant app)
*/

DROP POLICY IF EXISTS "anon_delete_drafts" ON drafts;
CREATE POLICY "anon_delete_drafts" ON drafts FOR DELETE
  TO anon, authenticated USING (true);

GRANT DELETE ON drafts TO anon, authenticated;