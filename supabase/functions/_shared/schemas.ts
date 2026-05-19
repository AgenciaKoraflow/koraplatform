import { z } from "https://esm.sh/zod@3.23.8";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ALLOWED_TABLES = [
  "clients",
  "projects",
  "tasks",
  "contracts",
  "knowledge_items",
  "support_tickets",
] as const;

export const ALLOWED_ACTIONS = [
  "select",
  "insert",
  "update",
  "delete",
  "get_password",
  "migrate_encrypt_passwords",
  "get_document_url",
] as const;

export type Table = (typeof ALLOWED_TABLES)[number];
export type Action = (typeof ALLOWED_ACTIONS)[number];

// ─── Writable field whitelists (anti-mass-assignment) ────────────────────────

export const TABLE_WRITABLE_FIELDS: Record<Table, Set<string>> = {
  clients: new Set([
    "name", "company", "email", "phone", "pipeline_stage", "notes",
    "anniversary", "briefing", "proposal_sent_date", "head", "bu", "logo",
  ]),
  projects: new Set([
    "client_id", "name", "description", "status", "progress", "end_date",
    "team", "head", "value", "billing_type", "type",
    "recurrence_value", "recurrence_start_date", "bu",
  ]),
  tasks: new Set([
    "client_id", "project_id", "title", "description", "status",
    "priority", "due_date", "assignees", "bu",
  ]),
  contracts: new Set([
    "client_id", "project_ids", "title", "value", "status", "type",
    "billing_type", "recurrence_value", "recurrence_start_date", "expires_at",
    "document_name", "document_data", "document_type",
    "document_storage_path", "document_version", "signed_document_storage_path",
    "signature_link_token", "signature_link_expires_at", "signature_sent_at",
    "koraflow_signed_at", "koraflow_signature_data", "koraflow_signer_name",
    "koraflow_signer_email", "koraflow_signer_user_id",
    "client_signed_at", "client_signature_data", "client_signer_name",
    "client_signer_email", "client_cpf",
    "signed_document_data", "fully_signed_at",
    "signature_order", "contractor_signed_at", "contractor_signature_data",
    "contractor_signer_name", "contractor_signer_email",
  ]),
  knowledge_items: new Set([
    "client_id", "project_ids", "title", "category", "content",
    "username", "password", "url", "tags",
  ]),
  support_tickets: new Set([
    "client_id", "project_ids", "title", "description", "status",
    "priority", "assignee",
  ]),
};

// ─── Filterable field whitelists (anti-filter-injection) ─────────────────────

export const TABLE_FILTER_FIELDS: Record<Table, Set<string>> = {
  clients: new Set(["id", "pipeline_stage", "head", "bu"]),
  projects: new Set(["id", "client_id", "status", "head", "bu"]),
  tasks: new Set(["id", "client_id", "project_id", "status", "priority", "bu"]),
  contracts: new Set(["id", "client_id", "status", "type", "signature_link_token"]),
  knowledge_items: new Set(["id", "client_id", "category"]),
  support_tickets: new Set(["id", "client_id", "status", "priority"]),
};

// ─── Searchable fields (used for ilike text search) ───────────────────────────

export const TABLE_SEARCH_FIELDS: Record<Table, string[]> = {
  clients: ["name", "company", "email"],
  projects: ["name", "description"],
  tasks: ["title", "description"],
  contracts: ["title"],
  knowledge_items: ["title", "content"],
  support_tickets: ["title", "description"],
};

// ─── Orderable fields (anti-injection whitelist) ──────────────────────────────

export const TABLE_ORDERABLE_FIELDS: Record<Table, Set<string>> = {
  clients: new Set(["name", "company", "created_at", "updated_at", "pipeline_stage"]),
  projects: new Set(["name", "status", "created_at", "end_date"]),
  tasks: new Set(["title", "status", "priority", "created_at", "due_date"]),
  contracts: new Set(["title", "value", "status", "created_at"]),
  knowledge_items: new Set(["title", "category", "created_at", "updated_at"]),
  support_tickets: new Set(["title", "status", "priority", "created_at", "updated_at"]),
};

// ─── Action/table permission matrix (anti-privilege-escalation) ───────────────

export const TABLE_ALLOWED_ACTIONS: Record<Table, Set<Action>> = {
  clients: new Set(["select", "insert", "update", "delete"]),
  projects: new Set(["select", "insert", "update", "delete"]),
  tasks: new Set(["select", "insert", "update", "delete"]),
  contracts: new Set(["select", "insert", "update", "delete", "get_document_url"]),
  knowledge_items: new Set(["select", "insert", "update", "delete", "get_password"]),
  support_tickets: new Set(["select", "insert", "update", "delete"]),
};

// ─── Request schema ───────────────────────────────────────────────────────────

export const RequestSchema = z.object({
  action: z.enum(ALLOWED_ACTIONS),
  table: z.enum(ALLOWED_TABLES),
  data: z.record(z.unknown()).optional(),
  id: z.string().uuid("id must be a valid UUID").optional(),
  filters: z.record(z.unknown()).optional(),
  // Used by get_document_url (signature link token, not user JWT)
  token: z.string().max(200).optional(),
  // Pagination
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  order_by: z.string().max(50).optional(),
  order_dir: z.enum(["asc", "desc"]).optional(),
  search: z.string().max(100).optional(),
});

export type ValidatedRequest = z.infer<typeof RequestSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip any fields not in the whitelist for the given table. */
export function sanitizePayload(
  table: Table,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = TABLE_WRITABLE_FIELDS[table];
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => allowed.has(key)),
  );
}

/** Strip any filter keys not in the whitelist for the given table. */
export function sanitizeFilters(
  table: Table,
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = TABLE_FILTER_FIELDS[table];
  return Object.fromEntries(
    Object.entries(filters).filter(([key]) => allowed.has(key)),
  );
}
