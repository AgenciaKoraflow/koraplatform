import { Client, Project, Task, Contract, KnowledgeItem, SupportTicket } from "@/types/data";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { BU } from "@/types/bu";

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

export function mapDbClient(db: any): Client {
  return {
    id: db.id,
    name: db.name || "",
    company: db.company || "",
    email: db.email || "",
    phone: db.phone || "",
    stage: db.pipeline_stage || db.status || "prospeccao",
    value: db.notes || "R$ 0",
    lastContact: db.updated_at ? formatDate(db.updated_at) : "Nunca",
    anniversary: db.anniversary,
    briefing: db.briefing || undefined,
    proposalSentDate: db.proposal_sent_date || undefined,
    head: db.head || undefined,
    bu: sanitizeBU(db.bu),
    logo: db.logo || undefined,
  };
}

export function mapDbProject(db: any): Project {
  return {
    id: db.id,
    clientId: db.client_id,
    name: db.name || "",
    description: db.description || "",
    status: db.status || "planning",
    progress: db.progress || 0,
    dueDate: db.end_date ? formatDate(db.end_date) : "",
    team: db.team || [],
    tasks: 0,
    completedTasks: 0,
    head: db.head || undefined,
    value: db.value ? formatValue(db.value) : undefined,
    billingType: db.billing_type || "projeto",
    type: db.type || "projeto",
    recurrenceValue: db.recurrence_value ? formatValue(db.recurrence_value) : undefined,
    recurrenceStartDate: db.recurrence_start_date
      ? formatDate(db.recurrence_start_date)
      : undefined,
    bu: sanitizeBU(db.bu),
  };
}

export function mapDbTask(db: any): Task {
  return {
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id,
    title: db.title || "",
    description: db.description || "",
    status: db.status || "todo",
    priority: db.priority || "medium",
    dueDate: formatDisplayDate(db.due_date) || "",
    createdAt: db.created_at || undefined,
    assignees: db.assigned_to
      ? db.assigned_to
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [],
    bu: sanitizeBU(db.bu),
  };
}

export function mapDbContract(db: any): Contract {
  const formatContractValue = (val: any): string => {
    if (val === null || val === undefined || val === "") return "R$ 0,00";
    const num = typeof val === "number" ? val : parseCurrencyToNumber(String(val));
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      isNaN(num) ? 0 : num,
    );
  };

  const mapStatus = (status: string): Contract["status"] => {
    const valid = [
      "draft",
      "awaiting_koraflow_signature",
      "awaiting_client_signature",
      "signed",
      "expired",
    ] as const;
    if (valid.includes(status as any)) return status as Contract["status"];
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
    title: db.title || "",
    value: formatContractValue(db.value),
    status: mapStatus(db.status),
    type: db.type || "prestacao_servico",
    billingType: db.billing_type || "projeto",
    recurrenceValue: db.recurrence_value
      ? formatContractValue(db.recurrence_value)
      : undefined,
    recurrenceStartDate: db.recurrence_start_date || undefined,
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    signedAt: db.signed_at ? formatDate(db.signed_at) : undefined,
    expiresAt: db.end_date
      ? formatDate(db.end_date)
      : db.expires_at
        ? formatDate(db.expires_at)
        : "",
    documentName: db.document_name,
    documentData: db.document_data,
    documentType: db.document_type,
    signatureLinkToken: db.signature_link_token,
    signatureLinkExpiresAt: db.signature_link_expires_at,
    signatureSentAt: db.signature_sent_at ? formatDate(db.signature_sent_at) : undefined,
    koraflowSignedAt: db.koraflow_signed_at
      ? formatDate(db.koraflow_signed_at)
      : db.contractor_signed_at
        ? formatDate(db.contractor_signed_at)
        : undefined,
    koraflowSignatureData: db.koraflow_signature_data || db.contractor_signature_data,
    koraflowSignerName: db.koraflow_signer_name || db.contractor_signer_name,
    koraflowSignerEmail: db.koraflow_signer_email || db.contractor_signer_email,
    koraflowSignerUserId: db.koraflow_signer_user_id,
    clientSignedAt: db.client_signed_at ? formatDate(db.client_signed_at) : undefined,
    clientSignatureData: db.client_signature_data,
    clientSignerName: db.client_signer_name,
    clientSignerEmail: db.client_signer_email,
    clientCpf: db.client_cpf,
    signedDocumentData: db.signed_document_data,
    fullySignedAt: db.fully_signed_at ? formatDate(db.fully_signed_at) : undefined,
    signatureOrder: db.signature_order,
    contractorSignedAt: db.contractor_signed_at
      ? formatDate(db.contractor_signed_at)
      : undefined,
    contractorSignatureData: db.contractor_signature_data,
    contractorSignerName: db.contractor_signer_name,
    contractorSignerEmail: db.contractor_signer_email,
    bu: sanitizeBU(db.bu),
  };
}

export function mapDbKnowledge(db: any): KnowledgeItem {
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
    title: db.title || "",
    category: db.category || "documento",
    content: db.content || "",
    username: db.username,
    hasPassword: Boolean(db.has_password),
    url: db.url,
    tags: db.tags || [],
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    updatedAt: db.updated_at ? formatDate(db.updated_at) : "",
  };
}

export function mapDbTicket(db: any): SupportTicket {
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
    title: db.title || "",
    description: db.description || "",
    status: db.status || "open",
    priority: db.priority || "medium",
    createdAt: db.created_at ? formatDate(db.created_at) : "",
    updatedAt: db.updated_at ? formatDate(db.updated_at) : "",
    assignee: undefined,
  };
}
