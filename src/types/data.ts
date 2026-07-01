import type { BU } from "./bu";

export type ProcessCategory = BU;

export interface Process {
  id: string;
  name: string;
  description?: string;
  category: ProcessCategory;
  subcategory?: string;
  status: "pendente" | "em_andamento" | "concluido";
  assigned_to?: string;
  due_date?: string;
  client_id?: string;
  documents?: string[];
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "cliente" | "cancelado";
  value: string;
  lastContact: string;
  anniversary?: string;
  head?: string;
  briefing?: string;
  proposalSentDate?: string;
  bu?: BU[];
  logo?: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: "planning" | "in_progress" | "review" | "completed" | "on_hold";
  progress: number;
  dueDate: string;
  team: string[];
  tasks: number;
  completedTasks: number;
  head?: string;
  value?: string;
  billingType?: "projeto" | "implantacao_recorrencia";
  type?: "projeto" | "consultoria";
  recurrenceValue?: string;
  recurrenceStartDate?: string;
  createdAt?: string;
  bu?: BU[];
}

export interface Task {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done" | "blocked" | "client_review";
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt?: string;
  assignees: string[];
  bu?: BU[];
  blockedReason?: string;
  clientApproved?: boolean;
  clientApprovalCount?: number;
  estimatedHours?: number;
}

export type SubtaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";

export interface TaskSubtask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
  substatus: SubtaskStatus;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  subtaskId?: string;
  author: string;
  content: string;
  mentionedUsers: string[];
  isApprovalEvidence?: boolean;
  createdAt: string;
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  subtaskId?: string;
  description: string;
  hours: number;
  author: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  subtaskId?: string;
  fileName: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
  createdAt: string;
}

export type ProjectDocumentType = "planejamento" | "tecnico";

export interface ProjectDocument {
  id: string;
  projectId: string;
  type: ProjectDocumentType;
  fileName: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  projectIds?: string[];
  title: string;
  value: string;
  status: "draft" | "awaiting_koraflow_signature" | "awaiting_client_signature" | "signed" | "expired";
  type: "prestacao_servico" | "projeto_unico";
  billingType: "projeto" | "implantacao_recorrencia";
  implementationValue?: string;
  recurrenceValue?: string;
  recurrenceStartDate?: string;
  recurrenceType?: string;
  recurrenceEndDate?: string;
  createdAt: string;
  signedAt?: string;
  expiresAt: string;
  documentName?: string;
  documentData?: string;
  documentType?: string;
  // Storage-based document (replaces base64 documentData after migration)
  documentStoragePath?: string;
  documentVersion?: number;
  signedDocumentStoragePath?: string;
  // Signature link fields
  signatureLinkToken?: string;
  signatureLinkExpiresAt?: string;
  signatureSentAt?: string;
  // Koraflow signature fields
  koraflowSignedAt?: string;
  koraflowSignatureData?: string;
  koraflowSignerName?: string;
  koraflowSignerEmail?: string;
  koraflowSignerUserId?: string;
  // Client signature fields
  clientSignedAt?: string;
  clientSignatureData?: string;
  clientSignerName?: string;
  clientSignerEmail?: string;
  clientCpf?: string;
  // Final document
  signedDocumentData?: string;
  fullySignedAt?: string;
  // Legacy fields (kept for backwards compatibility)
  signatureOrder?: "simultaneous" | "client_first" | "contractor_first";
  contractorSignedAt?: string;
  contractorSignatureData?: string;
  contractorSignerName?: string;
  contractorSignerEmail?: string;
  bu?: BU[];
}

// Signature status for tracking
export type SignatureStatus = 
  | "draft" 
  | "awaiting_koraflow" 
  | "awaiting_client" 
  | "koraflow_signed" 
  | "client_signed" 
  | "fully_signed"
  | "expired";

// Signature settings for contract
export interface SignatureSettings {
  id: string;
  contractId: string;
  signatureOrder: "simultaneous" | "client_first" | "contractor_first";
  requireClientSignature: boolean;
  requireContractorSignature: boolean;
  autoNotifyOnSignature: boolean;
  createdAt: string;
  updatedAt: string;
}

// Individual signature record
export interface ContractSignature {
  id: string;
  contractId: string;
  signerType: "client" | "koraflow";
  signerName: string;
  signerEmail: string;
  signerCpf?: string;
  signatureToken: string;
  signedAt?: string;
  signatureData?: string;
  signatureIp?: string;
  signatureUserAgent?: string;
  createdAt: string;
  expiresAt?: string;
  reminderSentAt?: string;
}

// Audit log for signature events
export interface SignatureAuditLog {
  id: string;
  contractId: string;
  eventType: "koraflow_signed" | "client_signed" | "fully_signed" | "link_sent" | "reminder_sent" | "expired" | "email_sent";
  eventData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Email log for tracking sent emails
export interface SignatureEmailLog {
  id: string;
  contractId: string;
  recipientEmail: string;
  recipientName?: string;
  emailType: "signature_request" | "signature_confirmation" | "reminder";
  sentAt: string;
  messageId?: string;
  status: "sent" | "delivered" | "opened" | "failed";
  errorMessage?: string;
}

export interface KnowledgeItem {
  id: string;
  clientId?: string;
  projectIds?: string[];
  title: string;
  category: "credencial" | "documento" | "link";
  content: string;
  username?: string;
  /**
   * Never populated from list responses — the edge function strips it.
   * Only present when the caller explicitly fetches it via get_password,
   * or when providing a new value on create/update.
   */
  password?: string;
  /** True when the DB record has an encrypted password, without exposing the value. */
  hasPassword?: boolean;
  url?: string;
  tags: string[];
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  docType?: string;
  createdAt: string;
  updatedAt: string;
}


// Integration credentials for different services (for UI forms)
export interface IntegrationCredentialsConfig {
  supabase: { project_url: string; anon_key: string; service_role_key?: string };
  coolify: { base_url: string; api_token: string; team_id?: string };
}

export interface Process {
  id: string;
  name: string;
  description?: string;
  category: ProcessCategory;
  subcategory?: string;
  status: "pendente" | "em_andamento" | "concluido";
  assigned_to?: string;
  due_date?: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  clientId: string;
  projectIds?: string[];
  title: string;
  description: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  assignee?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  bu: BU;
  billingType: "projeto_unico" | "recorrencia" | "hora" | "combo" | "adicional";
  priceInitial?: string;
  priceBargain?: string;
  recurrencePriceInitial?: string;
  recurrencePriceBargain?: string;
  installmentsMax?: number;
  status: "ativo" | "inativo";
  createdAt: string;
  updatedAt: string;
}

// ─── Internal Workspace ───────────────────────────────────────────────────────

export interface InternalWorkspace {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  ownerUserId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InternalCredential {
  id: string;
  workspaceId: string;
  title: string;
  username?: string;
  /** Never populated from list queries — fetched on demand via edge function */
  password?: string;
  hasPassword?: boolean;
  url?: string;
  notes?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalInsight {
  id: string;
  workspaceId: string;
  title: string;
  content?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type InternalTaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type InternalTaskPriority = 'low' | 'medium' | 'high';

export interface InternalTask {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: InternalTaskStatus;
  priority: InternalTaskPriority;
  assignedTo?: string;
  allInvolved?: boolean;
  dueDate?: string;
  estimatedHours?: number;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalTaskSubtask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
}

export interface InternalTaskTimeEntry {
  id: string;
  taskId: string;
  description: string;
  hours: number;
  author: string;
  createdAt: string;
}

export interface InternalDocumentFolder {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalDocument {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  docType?: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  url?: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}
