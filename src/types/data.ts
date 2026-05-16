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
  type?: "projeto" | "sustentacao" | "consultoria";
  recurrenceValue?: string;
  recurrenceStartDate?: string;
  bu?: BU[];
}

export interface Task {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt?: string;
  assignees: string[];
  bu?: BU[];
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
  recurrenceValue?: string;
  recurrenceStartDate?: string;
  createdAt: string;
  signedAt?: string;
  expiresAt: string;
  documentName?: string;
  documentData?: string;
  documentType?: string;
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
  password?: string;
  url?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Observability Types
export type IntegrationType =
  | 'supabase'
  | 'openai'
  | 'sendgrid'
  | 'aws_s3'
  | 'google_cloud'
  | 'slack'
  | 'notion'
  | 'stripe'
  | 'twilio'
  | 'hetzner_vps'
  | 'coolify'
  | 'custom_api';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending_setup';

export type MetricType = 'api_calls' | 'errors' | 'latency' | 'usage_quota' | 'cost' | 'uptime' | 'custom';

export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ClientIntegration {
  id: string;
  client_id: string | 'koraflow_internal'; // Permite ID especial para Koraflow
  integration_type: IntegrationType;
  status: IntegrationStatus;
  display_name?: string;
  description?: string;
  base_url?: string;
  api_key?: string;
  config?: Record<string, unknown>; // Configurações adicionais (ex: project_id, region, etc.)
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationCredential {
  id: string;
  integration_id: string;
  credential_key: string;
  credential_value: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationMetric {
  id: string;
  integration_id: string;
  metric_type: MetricType;
  metric_value?: number;
  metric_unit?: string;
  recorded_at: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  severity: LogSeverity;
  message: string;
  context?: Record<string, unknown>;
  created_at: string;
}

export interface IntegrationHealth {
  id: string;
  integration_id: string;
  is_healthy: boolean;
  response_time_ms?: number;
  error_message?: string;
  checked_at: string;
}

export interface ClientObservabilitySummary {
  client_id: string;
  client_name: string;
  total_integrations: number;
  active_integrations: number;
  error_integrations: number;
  last_health_check?: string;
  total_logs_7d: number;
  errors_7d: number;
}

// Integration credentials for different services (for UI forms)
export interface IntegrationCredentialsConfig {
  supabase: { project_url: string; anon_key: string; service_role_key?: string };
  openai: { api_key: string; organization_id?: string };
  sendgrid: { api_key: string; webhook_secret?: string };
  aws_s3: { access_key_id: string; secret_access_key: string; region: string };
  google_cloud: { project_id: string; service_account_key: string };
  slack: { api_token: string; team_id?: string };
  stripe: { api_key: string };
  twilio: { account_sid: string; auth_token: string };
  custom_api: { base_url: string; api_key?: string; headers?: Record<string, string> };
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
