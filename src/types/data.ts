export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "cliente";
  value: string;
  lastContact: string;
  anniversary?: string;
  head?: string;
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
  assignees: string[];
}

export interface Proposal {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  value: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  services: string[];
  createdAt: string;
  validUntil: string;
}

export interface Contract {
  id: string;
  clientId: string;
  proposalId?: string;
  projectId?: string;
  title: string;
  value: string;
  status: "draft" | "pending_signature" | "signed" | "expired";
  type: "projeto" | "sustentacao" | "consultoria";
  billingType: "projeto" | "implantacao_recorrencia";
  recurrenceValue?: string;
  recurrenceStartDate?: string;
  createdAt: string;
  signedAt?: string;
  expiresAt: string;
  documentName?: string;
  documentData?: string;
  documentType?: string;
}

export interface KnowledgeItem {
  id: string;
  clientId?: string;
  projectId?: string;
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

export interface SupportTicket {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  assignee?: string;
}
