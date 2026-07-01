import { Client, Project, Task, Contract, KnowledgeItem, SupportTicket, Service, TaskSubtask, TaskComment, TaskAttachment, TaskTimeEntry, InternalWorkspace, InternalCredential, InternalInsight, InternalTask, InternalDocument, InternalDocumentFolder, InternalTaskSubtask, InternalTaskTimeEntry, ProjectDocument } from "@/types/data";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { BU } from "@/types/bu";
import type {
  DbClientRow,
  DbProjectRow,
  DbTaskRow,
  DbContractRow,
  DbKnowledgeItemRow,
  DbSupportTicketRow,
  DbServiceRow,
  DbTaskSubtaskRow,
  DbTaskCommentRow,
  DbTaskAttachmentRow,
  DbTaskTimeEntryRow,
  DbInternalWorkspaceRow,
  DbInternalCredentialRow,
  DbInternalInsightRow,
  DbInternalTaskRow,
  DbInternalDocumentRow,
  DbInternalDocumentFolderRow,
  DbInternalTaskSubtaskRow,
  DbInternalTaskTimeEntryRow,
  DbProjectDocumentRow,
} from "@/types/db";

const VALID_BUS = new Set(["kora-agents", "kora-dev", "kora-studio", "kora-corp"]);

export function sanitizeBU(raw: unknown): BU[] | undefined {
  const arr: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  const valid = arr.filter((b) => VALID_BUS.has(b)) as BU[];
  return valid.length > 0 ? valid : undefined;
}

export function formatValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "R$ 0,00";
  const num = typeof val === "number" ? val : parseCurrencyToNumber(String(val));
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

export function formatDisplayDate(dbDate: string | null | undefined): string {
  if (!dbDate) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dbDate)) return dbDate;
  const match = dbDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return dbDate;
}

export function parseValue(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[R$\s]/g, "");
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || null;
}

export function toISODate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) return dateString.split("T")[0];
  const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}

export function mapDbClient(db: DbClientRow): Client {
  return {
    id: db.id,
    name: db.name ?? "",
    company: db.company ?? "",
    email: db.email ?? "",
    phone: db.phone ?? "",
    stage: (db.pipeline_stage as Client["stage"]) ?? "prospeccao",
    value: db.notes ?? "R$ 0",
    lastContact: db.updated_at ? formatDate(db.updated_at) : "Nunca",
    anniversary: db.anniversary ?? undefined,
    briefing: db.briefing ?? undefined,
    proposalSentDate: db.proposal_sent_date ?? undefined,
    head: db.head ?? undefined,
    bu: sanitizeBU(db.bu),
    logo: db.logo ?? undefined,
  };
}

export function mapDbProject(db: DbProjectRow): Project {
  return {
    id: db.id,
    clientId: db.client_id,
    name: db.name ?? "",
    description: db.description ?? "",
    status: (db.status as Project["status"]) ?? "planning",
    progress: db.progress ?? 0,
    dueDate: db.end_date ? formatDate(db.end_date) : "",
    team: db.team ?? [],
    tasks: 0,
    completedTasks: 0,
    head: db.head ?? undefined,
    value: db.value ? formatValue(db.value) : undefined,
    billingType: (db.billing_type as Project["billingType"]) ?? "projeto",
    type: (db.type as Project["type"]) ?? "projeto",
    recurrenceValue: db.recurrence_value ? formatValue(db.recurrence_value) : undefined,
    recurrenceStartDate: db.recurrence_start_date
      ? formatDate(db.recurrence_start_date)
      : undefined,
    createdAt: db.created_at ?? undefined,
    bu: sanitizeBU(db.bu),
  };
}

export function mapDbTask(db: DbTaskRow): Task {
  return {
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id ?? undefined,
    title: db.title ?? "",
    description: db.description ?? "",
    status: (db.status as Task["status"]) ?? "todo",
    priority: (db.priority as Task["priority"]) ?? "medium",
    dueDate: formatDisplayDate(db.due_date) ?? "",
    createdAt: db.created_at ?? undefined,
    assignees: db.assigned_to
      ? db.assigned_to
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    bu: sanitizeBU(db.bu),
    blockedReason: db.blocked_reason ?? undefined,
    clientApproved: db.client_approved ?? false,
    clientApprovalCount: db.client_approval_count ?? 0,
    estimatedHours: db.estimated_hours ?? undefined,
  };
}

export function mapDbSubtask(db: DbTaskSubtaskRow): TaskSubtask {
  const validStatuses = ["todo", "in_progress", "review", "done", "blocked"] as const;
  const substatus = validStatuses.includes(db.substatus as typeof validStatuses[number])
    ? (db.substatus as TaskSubtask["substatus"])
    : "todo";
  return {
    id: db.id,
    taskId: db.task_id,
    title: db.title,
    done: db.done,
    position: db.position,
    substatus,
    createdAt: db.created_at,
  };
}

export function mapDbComment(db: DbTaskCommentRow): TaskComment {
  return {
    id: db.id,
    taskId: db.task_id,
    subtaskId: db.subtask_id ?? undefined,
    author: db.author,
    content: db.content,
    mentionedUsers: db.mentioned_users ?? [],
    isApprovalEvidence: db.is_approval_evidence ?? false,
    createdAt: db.created_at,
  };
}

export function mapDbTimeEntry(db: DbTaskTimeEntryRow): TaskTimeEntry {
  return {
    id: db.id,
    taskId: db.task_id,
    subtaskId: db.subtask_id ?? undefined,
    description: db.description,
    hours: db.hours,
    author: db.author,
    createdAt: db.created_at,
  };
}

export function mapDbAttachment(db: DbTaskAttachmentRow): TaskAttachment {
  return {
    id: db.id,
    taskId: db.task_id,
    subtaskId: db.subtask_id ?? undefined,
    fileName: db.file_name,
    storagePath: db.storage_path,
    mimeType: db.mime_type ?? undefined,
    fileSize: db.file_size ?? undefined,
    createdAt: db.created_at,
  };
}

export function mapDbProjectDocument(db: DbProjectDocumentRow): ProjectDocument {
  return {
    id: db.id,
    projectId: db.project_id,
    type: db.type,
    fileName: db.file_name,
    storagePath: db.storage_path,
    mimeType: db.mime_type ?? undefined,
    fileSize: db.file_size ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbContract(db: DbContractRow): Contract {
  const formatContractValue = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === "") return "R$ 0,00";
    const num = typeof val === "number" ? val : parseCurrencyToNumber(String(val));
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      isNaN(num) ? 0 : num,
    );
  };

  const CONTRACT_STATUSES = [
    "draft",
    "awaiting_koraflow_signature",
    "awaiting_client_signature",
    "signed",
    "expired",
  ] as const;

  const mapStatus = (status: string | null): Contract["status"] => {
    if (status && CONTRACT_STATUSES.includes(status as Contract["status"])) {
      return status as Contract["status"];
    }
    if (status === "pending_signature") return "awaiting_client_signature";
    return "draft";
  };

  return {
    id: db.id,
    clientId: db.client_id,
    projectIds: db.project_ids
      ? Array.isArray(db.project_ids)
        ? db.project_ids
        : [db.project_ids]
      : db.project_id
        ? [db.project_id]
        : [],
    title: db.title ?? "",
    value: formatContractValue(db.value),
    status: mapStatus(db.status),
    type: (db.type as Contract["type"]) ?? "prestacao_servico",
    billingType: (db.billing_type as Contract["billingType"]) ?? "projeto",
    recurrenceValue: db.recurrence_value
      ? formatContractValue(db.recurrence_value)
      : undefined,
    recurrenceType: db.recurrence_type ?? undefined,
    recurrenceStartDate: db.recurrence_start_date ?? undefined,
    recurrenceEndDate: db.recurrence_end_date ?? undefined,
    implementationValue: db.implementation_value
      ? formatContractValue(db.implementation_value)
      : undefined,
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    signedAt: db.signed_at ? formatDate(db.signed_at) : undefined,
    expiresAt: db.end_date
      ? formatDate(db.end_date)
      : db.expires_at
        ? formatDate(db.expires_at)
        : "",
    documentName: db.document_name ?? undefined,
    documentData: db.document_data ?? undefined,
    documentType: db.document_type ?? undefined,
    documentStoragePath: db.document_storage_path ?? undefined,
    documentVersion: db.document_version ?? 0,
    signedDocumentStoragePath: db.signed_document_storage_path ?? undefined,
    signatureLinkToken: db.signature_link_token ?? undefined,
    signatureLinkExpiresAt: db.signature_link_expires_at ?? undefined,
    signatureSentAt: db.signature_sent_at ? formatDate(db.signature_sent_at) : undefined,
    koraflowSignedAt: db.koraflow_signed_at
      ? formatDate(db.koraflow_signed_at)
      : db.contractor_signed_at
        ? formatDate(db.contractor_signed_at)
        : undefined,
    koraflowSignatureData: db.koraflow_signature_data ?? db.contractor_signature_data ?? undefined,
    koraflowSignerName: db.koraflow_signer_name ?? db.contractor_signer_name ?? undefined,
    koraflowSignerEmail: db.koraflow_signer_email ?? db.contractor_signer_email ?? undefined,
    koraflowSignerUserId: db.koraflow_signer_user_id ?? undefined,
    clientSignedAt: db.client_signed_at ? formatDate(db.client_signed_at) : undefined,
    clientSignatureData: db.client_signature_data ?? undefined,
    clientSignerName: db.client_signer_name ?? undefined,
    clientSignerEmail: db.client_signer_email ?? undefined,
    clientCpf: db.client_cpf ?? undefined,
    signedDocumentData: db.signed_document_data ?? undefined,
    fullySignedAt: db.fully_signed_at ? formatDate(db.fully_signed_at) : undefined,
    signatureOrder: (db.signature_order as Contract["signatureOrder"]) ?? undefined,
    contractorSignedAt: db.contractor_signed_at
      ? formatDate(db.contractor_signed_at)
      : undefined,
    contractorSignatureData: db.contractor_signature_data ?? undefined,
    contractorSignerName: db.contractor_signer_name ?? undefined,
    contractorSignerEmail: db.contractor_signer_email ?? undefined,
    bu: sanitizeBU(db.bu),
  };
}

export function mapDbKnowledge(db: DbKnowledgeItemRow): KnowledgeItem {
  return {
    id: db.id,
    clientId: db.client_id ?? undefined,
    projectIds: db.project_ids
      ? Array.isArray(db.project_ids)
        ? db.project_ids
        : [db.project_ids]
      : db.project_id
        ? [db.project_id]
        : [],
    title: db.title ?? "",
    category: (db.category as KnowledgeItem["category"]) ?? "documento",
    content: db.content ?? "",
    username: db.username ?? undefined,
    hasPassword: Boolean(db.has_password),
    url: db.url ?? undefined,
    tags: db.tags ?? [],
    storagePath: db.storage_path ?? undefined,
    fileName: db.file_name ?? undefined,
    mimeType: db.mime_type ?? undefined,
    fileSize: db.file_size ?? undefined,
    docType: db.doc_type ?? undefined,
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    updatedAt: db.updated_at ? formatDate(db.updated_at) : "",
  };
}

export function mapDbTicket(db: DbSupportTicketRow): SupportTicket {
  return {
    id: db.id,
    clientId: db.client_id,
    projectIds: db.project_ids
      ? Array.isArray(db.project_ids)
        ? db.project_ids
        : [db.project_ids]
      : db.project_id
        ? [db.project_id]
        : [],
    title: db.title ?? "",
    description: db.description ?? "",
    status: (db.status as SupportTicket["status"]) ?? "open",
    priority: (db.priority as SupportTicket["priority"]) ?? "medium",
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    updatedAt: db.updated_at ? formatDate(db.updated_at) : "",
    assignee: undefined,
  };
}

export function mapDbService(db: DbServiceRow): Service {
  const validBU = (["kora-agents", "kora-dev", "kora-studio", "kora-corp"] as BU[]).includes(db.bu as BU)
    ? (db.bu as BU)
    : ("kora-corp" as BU);
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? undefined,
    category: db.category ?? undefined,
    bu: validBU,
    billingType: (db.billing_type as Service["billingType"]) ?? "projeto_unico",
    priceInitial: db.price_initial != null ? formatValue(db.price_initial) : undefined,
    priceBargain: db.price_bargain != null ? formatValue(db.price_bargain) : undefined,
    recurrencePriceInitial: db.recurrence_price_initial != null ? formatValue(db.recurrence_price_initial) : undefined,
    recurrencePriceBargain: db.recurrence_price_bargain != null ? formatValue(db.recurrence_price_bargain) : undefined,
    installmentsMax: db.installments_max ?? undefined,
    status: (db.status as Service["status"]) ?? "ativo",
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    updatedAt: db.updated_at ? formatDate(db.updated_at) : "",
  };
}

export function mapDbInternalWorkspace(db: DbInternalWorkspaceRow): InternalWorkspace {
  return {
    id: db.id,
    name: db.name,
    slug: db.slug ?? undefined,
    logoUrl: db.logo_url ?? undefined,
    description: db.description ?? undefined,
    ownerUserId: db.owner_user_id ?? undefined,
    active: db.active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbInternalCredential(db: DbInternalCredentialRow): InternalCredential {
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    title: db.title ?? "",
    username: db.username ?? undefined,
    hasPassword: Boolean(db.has_password),
    url: db.url ?? undefined,
    notes: db.notes ?? undefined,
    category: db.category ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbInternalInsight(db: DbInternalInsightRow): InternalInsight {
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    title: db.title ?? "",
    content: db.content ?? undefined,
    tags: db.tags ?? [],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbInternalTask(db: DbInternalTaskRow): InternalTask {
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    title: db.title ?? "",
    description: db.description ?? undefined,
    status: (db.status as InternalTask["status"]) ?? "todo",
    priority: (db.priority as InternalTask["priority"]) ?? "medium",
    assignedTo: db.assigned_to ?? undefined,
    allInvolved: db.all_involved ?? false,
    dueDate: db.due_date ?? undefined,
    estimatedHours: db.estimated_hours ?? undefined,
    blockedReason: db.blocked_reason ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbInternalTaskSubtask(db: DbInternalTaskSubtaskRow): InternalTaskSubtask {
  return {
    id: db.id,
    taskId: db.task_id,
    title: db.title,
    done: db.done,
    position: db.position,
    createdAt: db.created_at,
  };
}

export function mapDbInternalTaskTimeEntry(db: DbInternalTaskTimeEntryRow): InternalTaskTimeEntry {
  return {
    id: db.id,
    taskId: db.task_id,
    description: db.description,
    hours: db.hours,
    author: db.author,
    createdAt: db.created_at,
  };
}

export function mapDbInternalDocument(db: DbInternalDocumentRow): InternalDocument {
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    title: db.title ?? "",
    description: db.description ?? undefined,
    content: db.content ?? undefined,
    category: db.category ?? undefined,
    docType: db.doc_type ?? undefined,
    storagePath: db.storage_path ?? undefined,
    fileName: db.file_name ?? undefined,
    mimeType: db.mime_type ?? undefined,
    fileSize: db.file_size ?? undefined,
    url: db.url ?? undefined,
    folderId: db.folder_id ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbInternalDocumentFolder(db: DbInternalDocumentFolderRow): InternalDocumentFolder {
  return {
    id: db.id,
    workspaceId: db.workspace_id,
    name: db.name,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}
