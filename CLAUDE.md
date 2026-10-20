@AGENTS.md

## Supabase: every new table in `public` needs explicit grants

From Oct 30, 2026, Supabase no longer auto-grants Data API access to new
tables in `public`. Any migration that creates a table (or view) must grant
access in the same migration, or supabase-js returns "permission denied":

```sql
grant select on public.<table> to anon;                                   -- only if anon should read it (RLS still applies)
grant select, insert, update, delete on public.<table> to authenticated;  -- trim to what the app needs
grant select, insert, update, delete on public.<table> to service_role;
```

Never run a blanket `grant all on all tables in schema public` to fix this:
`orders` deliberately has table-level UPDATE revoked from `authenticated`
(column allowlist, migration 034), and a blanket grant would undo it.
Existing tables keep their grants and are unaffected.
