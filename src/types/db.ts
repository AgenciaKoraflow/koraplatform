/**
 * Raw row shapes from the business tables in the main Supabase project.
 * Use these types in mappers; never let them leak into UI components.
 */

export interface DbClientRow {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string | null;
  notes: string | null;
  anniversary: string | null;
  briefing: string | null;
  proposal_sent_date: string | null;
  head: string | null;
  bu: string[] | null;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProjectRow {
  id: string;
  client_id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  progress: number | null;
  end_date: string | null;
  team: string[] | null;
  head: string | null;
  value: number | string | null;
  billing_type: string | null;
  type: string | null;
  recurrence_value: number | string | null;
  recurrence_start_date: string | null;
  bu: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DbTaskRow {
  id: string;
  client_id: string;
  project_id: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  bu: string[] | null;
  blocked_reason: string | null;
  client_approved: boolean | null;
  estimated_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbTaskSubtaskRow {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  position: number;
  created_at: string;
}

export interface DbTaskCommentRow {
  id: string;
  task_id: string;
  subtask_id: string | null;
  author: string;
  content: string;
  mentioned_users: string[];
  created_at: string;
}

export interface DbTaskTimeEntryRow {
  id: string;
  task_id: string;
  subtask_id: string | null;
  description: string;
  hours: number;
  author: string;
  created_at: string;
}

export interface DbTaskAttachmentRow {
  id: string;
  task_id: string;
  subtask_id: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface DbContractRow {
  id: string;
  client_id: string;
  project_ids: string[] | null;
  project_id: string | null;
  title: string | null;
  value: number | string | null;
  status: string | null;
  type: string | null;
  billing_type: string | null;
  recurrence_value: number | string | null;
  recurrence_start_date: string | null;
  created_at: string | null;
  signed_at: string | null;
  end_date: string | null;
  expires_at: string | null;
  document_name: string | null;
  document_data: string | null;
  document_type: string | null;
  document_storage_path: string | null;
  document_version: number | null;
  signed_document_storage_path: string | null;
  signature_link_token: string | null;
  signature_link_expires_at: string | null;
  signature_sent_at: string | null;
  koraflow_signed_at: string | null;
  koraflow_signature_data: string | null;
  koraflow_signer_name: string | null;
  koraflow_signer_email: string | null;
  koraflow_signer_user_id: string | null;
  client_signed_at: string | null;
  client_signature_data: string | null;
  client_signer_name: string | null;
  client_signer_email: string | null;
  client_cpf: string | null;
  signed_document_data: string | null;
  fully_signed_at: string | null;
  signature_order: string | null;
  contractor_signed_at: string | null;
  contractor_signature_data: string | null;
  contractor_signer_name: string | null;
  contractor_signer_email: string | null;
  bu: string[] | null;
}

export interface DbKnowledgeItemRow {
  id: string;
  client_id: string | null;
  project_ids: string[] | null;
  project_id: string | null;
  title: string | null;
  category: string | null;
  content: string | null;
  username: string | null;
  has_password: boolean | null;
  url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DbSupportTicketRow {
  id: string;
  client_id: string;
  project_ids: string[] | null;
  project_id: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
  assignee: string | null;
}
