---
name: project-external-db-security
description: Security hardening of the external-db Supabase Edge Function — architecture, new files, key decisions
metadata:
  type: project
---

Security hardening of `supabase/functions/external-db/` completed on 2026-05-16.

## New files created

- `supabase/functions/_shared/schemas.ts` — Zod request schema + per-table whitelists (writable fields, filterable fields, action/table permission matrix). Exports `Table`, `Action`, `sanitizePayload`, `sanitizeFilters`.
- `supabase/functions/_shared/rateLimit.ts` — In-memory rate limiting. 60 req/min general, 10 req/min for `get_password`. Keyed by `userId:action`.
- `supabase/functions/_shared/audit.ts` — Structured JSON audit logging to stdout (queryable in Supabase Dashboard → Edge Functions → Logs).
- `supabase/functions/import_map.json` — Deno import map for IDE resolution.
- `.vscode/settings.json` — `deno.enablePaths: ["supabase/functions"]` to enable Deno LSP for edge function files.

## Key decisions

- Auth validation uses `SUPABASE_URL` + `SUPABASE_ANON_KEY` (auto-injected by Supabase runtime) to validate the user JWT against the main project. The external DB still uses service role key.
- `migrate_encrypt_passwords` action bypasses user auth (uses `MIGRATION_SECRET` header) — it's a one-time admin op.
- Raw DB error messages are NEVER returned to the client — only opaque messages like "Query failed".
- `TABLE_ALLOWED_ACTIONS` matrix prevents privilege escalation (e.g., `get_password` only on `knowledge_items`).
- `sanitizePayload` / `sanitizeFilters` strip any fields not in per-table whitelists before DB calls.
- Rate limit headers (`Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) returned on 429.

## OWASP checklist applied

- A01 Broken Access Control: JWT auth required, action/table matrix enforced
- A03 Injection: filter and payload field whitelists, Zod schema validation
- A04 Insecure Design: mass assignment protection via field whitelists
- A07 Auth failures: auth errors logged, no token leakage in responses
- A09 Logging: structured audit trail per request with userId, ip, userAgent, outcome

**Why:** The function previously accepted any `action`, `table`, `data`, and `filters` without auth or validation — any user with the URL could query or mutate sensitive tables.

**How to apply:** When touching `external-db` or adding new tables/actions, always update `_shared/schemas.ts` whitelists before writing handler code.
