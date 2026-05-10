import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Client, Project, Task, Contract, KnowledgeItem, SupportTicket } from "@/types/data";
import { parseCurrencyToNumber } from "@/lib/currency";
import { calculateRecurrenceTotal, calculateMonthsBetween } from "@/lib/recurrence";
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseInvokeError } from "@/lib/supabaseFunctions";
import { toast } from "sonner";

// Helper function to format values from database
function formatValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return 'R$ 0,00';
  const num = typeof val === 'number' ? val : parseCurrencyToNumber(String(val));
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

interface DataContextType {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  contracts: Contract[];
  knowledgeItems: KnowledgeItem[];
  tickets: SupportTicket[];
  loading: boolean;
  
  // Client methods
  addClient: (client: Omit<Client, "id">) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  
  // Project methods
  addProject: (project: Omit<Project, "id">) => Promise<Project | null>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectsByClient: (clientId: string) => Project[];
  
  // Task methods
  addTask: (task: Omit<Task, "id">) => Promise<Task | null>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByClient: (clientId: string) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  
  // Contract methods
  addContract: (contract: Omit<Contract, "id">) => Promise<Contract | null>;
  updateContract: (id: string, contract: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  getContractsByClient: (clientId: string) => Contract[];
  
  // Knowledge methods
  addKnowledgeItem: (item: Omit<KnowledgeItem, "id">) => Promise<KnowledgeItem | null>;
  updateKnowledgeItem: (id: string, item: Partial<KnowledgeItem>) => Promise<void>;
  deleteKnowledgeItem: (id: string) => Promise<void>;
  getKnowledgeByClient: (clientId: string) => KnowledgeItem[];
  
  // Support ticket methods
  addTicket: (ticket: Omit<SupportTicket, "id">) => Promise<SupportTicket | null>;
  updateTicket: (id: string, ticket: Partial<SupportTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  getTicketsByClient: (clientId: string) => SupportTicket[];
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to call the external-db edge function
async function callExternalDb(action: string, table: string, data?: any, id?: string, filters?: Record<string, any>) {
  const { data: result, error } = await supabase.functions.invoke('external-db', {
    body: { action, table, data, id, filters },
  });

  if (error) {
    const message = await formatSupabaseInvokeError(error);
    console.warn("External DB function error:", message);
    throw new Error(message);
  }

  if (result?.error) {
    const msg =
      typeof result.error === "string" ? result.error : JSON.stringify(result.error);
    console.warn("External DB result error:", msg);
    throw new Error(msg);
  }

  return result?.data ?? null;
}

function mutationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro desconhecido";
}

// Mappers from DB to frontend types
function mapDbClient(db: any): Client {
  return {
    id: db.id,
    name: db.name || '',
    company: db.company || '',
    email: db.email || '',
    phone: db.phone || '',
    stage: db.pipeline_stage || db.status || 'prospeccao',
    value: db.notes || 'R$ 0',
    lastContact: db.updated_at ? formatDate(db.updated_at) : 'Nunca',
    anniversary: db.anniversary,
    briefing: db.briefing || undefined,
    proposalSentDate: db.proposal_sent_date || undefined,
    head: db.head || undefined,
    bu: db.bu || undefined,
  };
}

function mapDbProject(db: any): Project {
  return {
    id: db.id,
    clientId: db.client_id,
    name: db.name || '',
    description: db.description || '',
    status: db.status || 'planning',
    progress: db.progress || 0,
    dueDate: db.end_date ? formatDate(db.end_date) : '',
    team: db.team || [],
    tasks: 0,
    completedTasks: 0,
    head: db.head || undefined,
    value: db.value ? formatValue(db.value) : undefined,
    billingType: db.billing_type || 'projeto',
    type: db.type || 'projeto',
    recurrenceValue: db.recurrence_value ? formatValue(db.recurrence_value) : undefined,
    recurrenceStartDate: db.recurrence_start_date ? formatDate(db.recurrence_start_date) : undefined,
    bu: db.bu || undefined,
  };
}

function mapDbTask(db: any): Task {
  return {
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id,
    title: db.title || '',
    description: db.description || '',
    status: db.status || 'todo',
    priority: db.priority || 'medium',
    dueDate: formatDisplayDate(db.due_date) || '',
    assignees: db.assigned_to ? db.assigned_to.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    bu: db.bu || undefined,
  };
}

function mapDbContract(db: any): Contract {
  const formatContractValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return 'R$ 0,00';

    const num = typeof val === 'number' ? val : parseCurrencyToNumber(String(val));

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(isNaN(num) ? 0 : num);
  };

  // Map status from DB to frontend type
  const mapStatus = (status: string): Contract['status'] => {
    const validStatuses = ['draft', 'awaiting_koraflow_signature', 'awaiting_client_signature', 'signed', 'expired'] as const;
    if (validStatuses.includes(status as any)) {
      return status as Contract['status'];
    }
    // Map old status to new status
    if (status === 'pending_signature') {
      return 'awaiting_client_signature';
    }
    return 'draft';
  };

  return {
    id: db.id,
    clientId: db.client_id,
    projectIds: db.project_ids ? (Array.isArray(db.project_ids) ? db.project_ids : [db.project_ids]) : (db.project_id ? [db.project_id] : []),
    title: db.title || '',
    value: formatContractValue(db.value),
    status: mapStatus(db.status),
    type: db.type || 'prestacao_servico',
    billingType: db.billing_type || 'projeto',
    recurrenceValue: db.recurrence_value ? formatContractValue(db.recurrence_value) : undefined,
    recurrenceStartDate: db.recurrence_start_date || undefined,
    createdAt: db.created_at ? formatDate(db.created_at) : '',
    signedAt: db.signed_at ? formatDate(db.signed_at) : undefined,
    expiresAt: db.end_date ? formatDate(db.end_date) : (db.expires_at ? formatDate(db.expires_at) : ''),
    documentName: db.document_name,
    documentData: db.document_data,
    documentType: db.document_type,
    // Signature link fields
    signatureLinkToken: db.signature_link_token,
    signatureLinkExpiresAt: db.signature_link_expires_at,
    signatureSentAt: db.signature_sent_at ? formatDate(db.signature_sent_at) : undefined,
    // Koraflow signature fields - use koraflow fields or fallback to contractor fields (legacy)
    koraflowSignedAt: db.koraflow_signed_at ? formatDate(db.koraflow_signed_at) : (db.contractor_signed_at ? formatDate(db.contractor_signed_at) : undefined),
    koraflowSignatureData: db.koraflow_signature_data || db.contractor_signature_data,
    koraflowSignerName: db.koraflow_signer_name || db.contractor_signer_name,
    koraflowSignerEmail: db.koraflow_signer_email || db.contractor_signer_email,
    koraflowSignerUserId: db.koraflow_signer_user_id,
    // Client signature fields
    clientSignedAt: db.client_signed_at ? formatDate(db.client_signed_at) : undefined,
    clientSignatureData: db.client_signature_data,
    clientSignerName: db.client_signer_name,
    clientSignerEmail: db.client_signer_email,
    clientCpf: db.client_cpf,
    // Final document
    signedDocumentData: db.signed_document_data,
    fullySignedAt: db.fully_signed_at ? formatDate(db.fully_signed_at) : undefined,
    // Legacy fields
    signatureOrder: db.signature_order,
    contractorSignedAt: db.contractor_signed_at ? formatDate(db.contractor_signed_at) : undefined,
    contractorSignatureData: db.contractor_signature_data,
    contractorSignerName: db.contractor_signer_name,
    contractorSignerEmail: db.contractor_signer_email,
    bu: db.bu || undefined,
  };
}

function mapDbKnowledge(db: any): KnowledgeItem {
  return {
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id,
    title: db.title || '',
    category: db.category || 'documento',
    content: db.content || '',
    username: db.username,
    password: db.password,
    url: db.url,
    tags: db.tags || [],
    createdAt: db.created_at ? formatDate(db.created_at) : '',
    updatedAt: db.updated_at ? formatDate(db.updated_at) : ''
  };
}

function mapDbTicket(db: any): SupportTicket {
  return {
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id,
    title: db.title || '',
    description: db.description || '',
    status: db.status || 'open',
    priority: db.priority || 'medium',
    createdAt: db.created_at ? formatDate(db.created_at) : '',
    updatedAt: db.updated_at ? formatDate(db.updated_at) : '',
    assignee: undefined
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function parseValue(value: string): number | null {
  if (!value) return null;
  // Remove currency symbol, spaces, and handle Brazilian number format
  // Brazilian format: 1.234,56 (dot for thousands, comma for decimals)
  const cleaned = value.replace(/[R$\s]/g, '');
  // Remove thousand separators (dots) and replace decimal comma with dot
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || null;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for PostgreSQL
function toISODate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  
  // Check if already in ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.split('T')[0];
  }
  
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  return null;
}

// Format date from database to DD/MM/YYYY
function formatDisplayDate(dbDate: string | null | undefined): string {
  if (!dbDate) return '';
  
  // If already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dbDate)) {
    return dbDate;
  }
  
  // If in ISO format (YYYY-MM-DD)
  const match = dbDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  
  return dbDate;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsData, projectsData, tasksData, contractsData, knowledgeData, ticketsData] = await Promise.all([
        callExternalDb('select', 'clients').catch(() => []),
        callExternalDb('select', 'projects').catch(() => []),
        callExternalDb('select', 'tasks').catch(() => []),
        callExternalDb('select', 'contracts').catch(() => []),
        callExternalDb('select', 'knowledge_items').catch(() => []),
        callExternalDb('select', 'support_tickets').catch(() => [])
      ]);
      
      setClients((clientsData || []).map(mapDbClient));
      setProjects((projectsData || []).map((project: any) => {
        // Calculate progress from tasks
        const projectTasks = (tasksData || []).filter((t: any) => t.project_id === project.id);
        const completedTasks = projectTasks.filter((t: any) => t.status === 'done').length;
        const totalTasks = projectTasks.length;
        // If there are tasks, calculate progress; otherwise use the stored value
        const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0);
        return { ...project, progress: calculatedProgress };
      }));
      setTasks((tasksData || []).map(mapDbTask));
      setContracts((contractsData || []).map(mapDbContract));
      setKnowledgeItems((knowledgeData || []).map(mapDbKnowledge));
      setTickets((ticketsData || []).map(mapDbTicket));
      
      console.log('Data loaded from external Supabase');
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show toast on initial load error to avoid UI flickering
      // toast.error('Erro ao carregar dados do banco de dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Client methods
  const addClient = async (client: Omit<Client, "id">): Promise<Client | null> => {
    try {
      const dbData: Record<string, unknown> = {
        name: client.name.trim(),
        company: client.company.trim(),
        email: client.email?.trim() || null,
        phone: client.phone?.trim() || null,
        pipeline_stage: client.stage,
        notes: client.value?.trim() || null,
      };
      const ann = toISODate(client.anniversary);
      if (ann) dbData.anniversary = ann;
      const prop = toISODate(client.proposalSentDate);
      if (prop) dbData.proposal_sent_date = prop;
      if (client.briefing?.trim()) dbData.briefing = client.briefing.trim();
      if (client.head?.trim()) dbData.head = client.head.trim();
      if (client.bu) dbData.bu = client.bu;

      const result = await callExternalDb("insert", "clients", dbData);
      if (result && result[0]) {
        const newClient = mapDbClient(result[0]);
        setClients((prev) => [...prev, newClient]);
        toast.success("Cliente adicionado com sucesso");
        return newClient;
      }
      toast.error("Resposta vazia ao criar cliente");
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("addClient:", error);
      toast.error(`Erro ao adicionar cliente: ${msg}`);
      return null;
    }
  };
  
  const updateClient = async (id: string, client: Partial<Client>): Promise<boolean> => {
    try {
      const dbData: any = {};
      if (client.name) dbData.name = client.name;
      if (client.company) dbData.company = client.company;
      if (client.email) dbData.email = client.email;
      if (client.phone) dbData.phone = client.phone;
      if (client.stage) dbData.pipeline_stage = client.stage;
      if (client.value) dbData.notes = client.value;
      if (client.anniversary) dbData.anniversary = toISODate(client.anniversary);
      if (client.briefing !== undefined) dbData.briefing = client.briefing || null;
      if (client.proposalSentDate !== undefined) dbData.proposal_sent_date = toISODate(client.proposalSentDate);
      if (client.head !== undefined) dbData.head = client.head?.trim() || null;
      if (client.bu !== undefined) dbData.bu = client.bu;
      dbData.updated_at = new Date().toISOString();

      console.log("updateClient - sending data:", dbData);

      await callExternalDb("update", "clients", dbData, id);
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...client } : c)));
      toast.success("Cliente atualizado com sucesso");
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("updateClient error:", error);
      toast.error(`Erro ao atualizar cliente: ${msg}`);
      return false;
    }
  };
  
  const deleteClient = async (id: string) => {
    try {
      await callExternalDb('delete', 'clients', undefined, id);
      setClients(prev => prev.filter(c => c.id !== id));
      setProjects(prev => prev.filter(p => p.clientId !== id));
      setTasks(prev => prev.filter(t => t.clientId !== id));
      setContracts(prev => prev.filter(c => c.clientId !== id));
      setKnowledgeItems(prev => prev.filter(k => k.clientId !== id));
      setTickets(prev => prev.filter(t => t.clientId !== id));
      toast.success('Cliente excluído com sucesso');
    } catch (error) {
      toast.error(`Erro ao excluir cliente: ${mutationErrorMessage(error)}`);
    }
  };
  
  const getClient = (id: string) => clients.find(c => c.id === id);

  // Project methods
  const addProject = async (project: Omit<Project, "id">): Promise<Project | null> => {
    try {
      const dbData: any = {
        client_id: project.clientId,
        name: project.name,
        description: project.description || null,
        status: project.status,
        progress: project.progress || 0,
        end_date: toISODate(project.dueDate),
        billing_type: project.billingType || 'projeto',
        type: project.type || 'projeto',
        head: project.head || null,
        team: project.team || [],
      };
      if (project.value) {
        dbData.value = parseCurrencyToNumber(project.value);
      }
      if (project.recurrenceValue) {
        dbData.recurrence_value = parseCurrencyToNumber(project.recurrenceValue);
      }
      if (project.recurrenceStartDate) {
        dbData.recurrence_start_date = toISODate(project.recurrenceStartDate);
      }
      if (project.bu) dbData.bu = project.bu;

      const result = await callExternalDb('insert', 'projects', dbData);
      if (result && result[0]) {
        const newProject = mapDbProject(result[0]);
        setProjects(prev => [...prev, newProject]);
        toast.success('Projeto adicionado com sucesso');
        return newProject;
      }
      return null;
    } catch (error) {
      toast.error(`Erro ao adicionar projeto: ${mutationErrorMessage(error)}`);
      return null;
    }
  };
  
  const updateProject = async (id: string, project: Partial<Project>) => {
    try {
      const dbData: any = {};
      if (project.clientId) dbData.client_id = project.clientId;
      if (project.name) dbData.name = project.name;
      if (project.description !== undefined) dbData.description = project.description;
      if (project.status) dbData.status = project.status;
      if (project.progress !== undefined) dbData.progress = project.progress;
      if (project.dueDate) dbData.end_date = toISODate(project.dueDate);
      if (project.value !== undefined) {
        dbData.value = project.value ? parseCurrencyToNumber(project.value) : null;
      }
      if (project.billingType !== undefined) {
        dbData.billing_type = project.billingType;
      }
      if (project.type !== undefined) {
        dbData.type = project.type;
      }
      if (project.recurrenceValue !== undefined) {
        dbData.recurrence_value = project.recurrenceValue ? parseCurrencyToNumber(project.recurrenceValue) : null;
      }
      if (project.recurrenceStartDate !== undefined) {
        dbData.recurrence_start_date = project.recurrenceStartDate ? toISODate(project.recurrenceStartDate) : null;
      }
      if (project.head !== undefined) {
        dbData.head = project.head || null;
      }
      if (project.team !== undefined) {
        dbData.team = project.team || [];
      }
      if (project.bu !== undefined) {
        dbData.bu = project.bu;
      }

      // Only update if there's data to update
      if (Object.keys(dbData).length === 0) {
        console.warn('No valid fields to update');
        return;
      }
      
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'projects', dbData, id);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...project } : p));
      toast.success('Projeto atualizado com sucesso');
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(`Erro ao atualizar projeto: ${mutationErrorMessage(error)}`);
    }
  };
  
  const deleteProject = async (id: string) => {
    try {
      await callExternalDb('delete', 'projects', undefined, id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      toast.success('Projeto excluído com sucesso');
    } catch (error) {
      toast.error(`Erro ao excluir projeto: ${mutationErrorMessage(error)}`);
    }
  };
  
  const getProjectsByClient = (clientId: string) => projects.filter(p => p.clientId === clientId);

  // Task methods
  const addTask = async (task: Omit<Task, "id">): Promise<Task | null> => {
    try {
      const dbData: any = {
        client_id: task.clientId,
        project_id: task.projectId || null,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: toISODate(task.dueDate),
        assigned_to: task.assignees.join(', '),
      };
      if (task.bu) dbData.bu = task.bu;
      const result = await callExternalDb('insert', 'tasks', dbData);
      if (result && result[0]) {
        const newTask = mapDbTask(result[0]);
        setTasks(prev => [...prev, newTask]);
        toast.success('Tarefa adicionada com sucesso');
        return newTask;
      }
      return null;
    } catch (error) {
      toast.error(`Erro ao adicionar tarefa: ${mutationErrorMessage(error)}`);
      return null;
    }
  };
  
  const updateTask = async (id: string, task: Partial<Task>) => {
    try {
      const dbData: any = {};
      if (task.clientId) dbData.client_id = task.clientId;
      if (task.projectId !== undefined) dbData.project_id = task.projectId || null;
      if (task.title) dbData.title = task.title;
      if (task.description) dbData.description = task.description;
      if (task.status) dbData.status = task.status;
      if (task.priority) dbData.priority = task.priority;
      if (task.dueDate) dbData.due_date = toISODate(task.dueDate);
      if (task.assignees) dbData.assigned_to = task.assignees.join(', ');
      if (task.bu !== undefined) dbData.bu = task.bu;
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'tasks', dbData, id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...task } : t));
      toast.success('Tarefa atualizada com sucesso');
    } catch (error) {
      toast.error(`Erro ao atualizar tarefa: ${mutationErrorMessage(error)}`);
    }
  };
  
  const deleteTask = async (id: string) => {
    try {
      await callExternalDb('delete', 'tasks', undefined, id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Tarefa excluída com sucesso');
    } catch (error) {
      toast.error(`Erro ao excluir tarefa: ${mutationErrorMessage(error)}`);
    }
  };
  
  const getTasksByClient = (clientId: string) => tasks.filter(t => t.clientId === clientId);
  const getTasksByProject = (projectId: string) => tasks.filter(t => t.projectId === projectId);

// Contract methods
  const addContract = async (contract: Omit<Contract, "id">): Promise<Contract | null> => {
    try {
      const dbData: any = {
        client_id: contract.clientId,
        title: contract.title,
        value: parseValue(contract.value),
        status: contract.status,
        type: contract.type,
        billing_type: contract.billingType,
        recurrence_value: contract.recurrenceValue ? parseValue(contract.recurrenceValue) : null,
        recurrence_start_date: contract.recurrenceStartDate ? toISODate(contract.recurrenceStartDate) : null,
        created_at: toISODate(contract.createdAt),
        document_name: contract.documentName,
        document_data: contract.documentData,
        document_type: contract.documentType,
        signed_at: toISODate(contract.signedAt)
      };
      
      // Use project_ids array for multiple projects
      if (contract.projectIds && contract.projectIds.length > 0) {
        dbData.project_ids = contract.projectIds;
        // Also set project_id for backwards compatibility
        dbData.project_id = contract.projectIds[0];
      }
      
      // Use end_date (not expires_at)
      if (contract.expiresAt) {
        dbData.end_date = toISODate(contract.expiresAt);
      }
      
      // Set start_date from createdAt
      if (contract.createdAt) {
        dbData.start_date = toISODate(contract.createdAt);
      }
      if (contract.bu) dbData.bu = contract.bu;
      const result = await callExternalDb('insert', 'contracts', dbData);
      if (result && result[0]) {
        const newContract = mapDbContract(result[0]);
        setContracts(prev => [...prev, newContract]);
        toast.success('Contrato adicionado com sucesso');
        return newContract;
      }
      return null;
    } catch (error) {
      toast.error(`Erro ao adicionar contrato: ${mutationErrorMessage(error)}`);
      return null;
    }
  };
  
  const updateContract = async (id: string, contract: Partial<Contract>) => {
    try {
      const dbData: any = {};
      if (contract.clientId) dbData.client_id = contract.clientId;
      if (contract.projectIds !== undefined) {
        // Use project_ids array for multiple projects
        dbData.project_ids = contract.projectIds.length > 0 ? contract.projectIds : null;
        // Also set project_id for backwards compatibility
        dbData.project_id = contract.projectIds.length > 0 ? contract.projectIds[0] : null;
      }
      if (contract.type !== undefined) dbData.type = contract.type;
      if (contract.billingType !== undefined) dbData.billing_type = contract.billingType;
      if (contract.recurrenceValue !== undefined) dbData.recurrence_value = contract.recurrenceValue ? parseValue(contract.recurrenceValue) : null;
      if (contract.recurrenceStartDate !== undefined) dbData.recurrence_start_date = contract.recurrenceStartDate ? toISODate(contract.recurrenceStartDate) : null;
      if (contract.title) dbData.title = contract.title;
      if (contract.value) dbData.value = parseValue(contract.value);
      if (contract.status) dbData.status = contract.status;
      if (contract.expiresAt) dbData.end_date = toISODate(contract.expiresAt);
      if (contract.documentName !== undefined) dbData.document_name = contract.documentName || null;
      if (contract.documentData !== undefined) dbData.document_data = contract.documentData || null;
      if (contract.documentType !== undefined) dbData.document_type = contract.documentType || null;
      if (contract.signedAt) dbData.signed_at = toISODate(contract.signedAt);
      if (contract.bu !== undefined) dbData.bu = contract.bu;
      
      // Signature link fields
      if (contract.signatureLinkToken) dbData.signature_link_token = contract.signatureLinkToken;
      if (contract.signatureLinkExpiresAt) dbData.signature_link_expires_at = toISODate(contract.signatureLinkExpiresAt);
      
      // Use legacy contractor fields for Koraflow signature
      if (contract.koraflowSignedAt) dbData.contractor_signed_at = toISODate(contract.koraflowSignedAt);
      if (contract.koraflowSignatureData) dbData.contractor_signature_data = contract.koraflowSignatureData;
      if (contract.koraflowSignerName) dbData.contractor_signer_name = contract.koraflowSignerName;
      if (contract.koraflowSignerEmail) dbData.contractor_signer_email = contract.koraflowSignerEmail;
      
      // Also support direct contractor fields
      if (contract.contractorSignedAt) dbData.contractor_signed_at = toISODate(contract.contractorSignedAt);
      if (contract.contractorSignatureData) dbData.contractor_signature_data = contract.contractorSignatureData;
      if (contract.contractorSignerName) dbData.contractor_signer_name = contract.contractorSignerName;
      if (contract.contractorSignerEmail) dbData.contractor_signer_email = contract.contractorSignerEmail;
      
      // Client signature fields
      if (contract.clientSignedAt) dbData.client_signed_at = toISODate(contract.clientSignedAt);
      if (contract.clientSignatureData) dbData.client_signature_data = contract.clientSignatureData;
      if (contract.clientSignerName) dbData.client_signer_name = contract.clientSignerName;
      if (contract.clientSignerEmail) dbData.client_signer_email = contract.clientSignerEmail;
      
      // Final document
      if (contract.fullySignedAt) dbData.fully_signed_at = toISODate(contract.fullySignedAt);
      
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'contracts', dbData, id);
      setContracts(prev => prev.map(c => c.id === id ? { ...c, ...contract } : c));
      toast.success('Contrato atualizado com sucesso');
    } catch (error) {
      toast.error(`Erro ao atualizar contrato: ${mutationErrorMessage(error)}`);
    }
  };
  
  const deleteContract = async (id: string) => {
    try {
      await callExternalDb('delete', 'contracts', undefined, id);
      setContracts(prev => prev.filter(c => c.id !== id));
      toast.success('Contrato excluído com sucesso');
    } catch (error) {
      toast.error(`Erro ao excluir contrato: ${mutationErrorMessage(error)}`);
    }
  };
  
  const getContractsByClient = (clientId: string) => contracts.filter(c => c.clientId === clientId);

  // Knowledge methods
  const addKnowledgeItem = async (item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem | null> => {
    try {
      const dbData = {
        client_id: item.clientId || null,
        project_id: item.projectId || null,
        title: item.title,
        category: item.category,
        content: item.content,
        username: item.username,
        password: item.password,
        url: item.url,
        tags: item.tags
      };
      const result = await callExternalDb('insert', 'knowledge_items', dbData);
      if (result && result[0]) {
        const newItem = mapDbKnowledge(result[0]);
        setKnowledgeItems(prev => [...prev, newItem]);
        toast.success('Item adicionado com sucesso');
        return newItem;
      }
      return null;
    } catch (error) {
      toast.error(`Erro ao adicionar item: ${mutationErrorMessage(error)}`);
      return null;
    }
  };
  
  const updateKnowledgeItem = async (id: string, item: Partial<KnowledgeItem>) => {
    try {
      const dbData: any = {};
      if (item.clientId !== undefined) dbData.client_id = item.clientId || null;
      if (item.projectId !== undefined) dbData.project_id = item.projectId || null;
      if (item.title) dbData.title = item.title;
      if (item.category) dbData.category = item.category;
      if (item.content !== undefined) dbData.content = item.content;
      if (item.username !== undefined) dbData.username = item.username;
      if (item.password !== undefined) dbData.password = item.password;
      if (item.url !== undefined) dbData.url = item.url;
      if (item.tags) dbData.tags = item.tags;
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'knowledge_items', dbData, id);
      setKnowledgeItems(prev => prev.map(k => k.id === id ? { ...k, ...item } : k));
      toast.success('Item atualizado com sucesso');
    } catch (error) {
      toast.error(`Erro ao atualizar item: ${mutationErrorMessage(error)}`);
    }
  };
  
  const deleteKnowledgeItem = async (id: string) => {
    try {
      await callExternalDb('delete', 'knowledge_items', undefined, id);
      setKnowledgeItems(prev => prev.filter(k => k.id !== id));
      toast.success('Item excluído com sucesso');
    } catch (error) {
      toast.error(`Erro ao excluir item: ${mutationErrorMessage(error)}`);
    }
  };
  
  const getKnowledgeByClient = (clientId: string) => knowledgeItems.filter(k => k.clientId === clientId);

  // Support ticket methods
  const addTicket = async (ticket: Omit<SupportTicket, "id">): Promise<SupportTicket | null> => {
    try {
      const dbData = {
        client_id: ticket.clientId,
        project_id: ticket.projectId || null,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority
      };
      const result = await callExternalDb('insert', 'support_tickets', dbData);
      if (result && result[0]) {
        const newTicket = mapDbTicket(result[0]);
        setTickets(prev => [...prev, newTicket]);
        toast.success('Ticket adicionado com sucesso');
        return newTicket;
      }
      return null;
    } catch (error) {
      toast.error(`Erro ao adicionar ticket: ${mutationErrorMessage(error)}`);
      return null;
    }
  };
  
  const updateTicket = async (id: string, ticket: Partial<SupportTicket>) => {
    try {
      const dbData: any = {};
      if (ticket.clientId) dbData.client_id = ticket.clientId;
      if (ticket.projectId !== undefined) dbData.project_id = ticket.projectId || null;
      if (ticket.title) dbData.title = ticket.title;
      if (ticket.description) dbData.description = ticket.description;
      if (ticket.status) dbData.status = ticket.status;
      if (ticket.priority) dbData.priority = ticket.priority;
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'support_tickets', dbData, id);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...ticket } : t));
      toast.success('Ticket atualizado com sucesso');
    } catch (error) {
      toast.error(`Erro ao atualizar ticket: ${mutationErrorMessage(error)}`);
    }
  };
  
  const deleteTicket = async (id: string) => {
    try {
      await callExternalDb('delete', 'support_tickets', undefined, id);
      setTickets(prev => prev.filter(t => t.id !== id));
      toast.success('Ticket excluído com sucesso');
    } catch (error) {
      toast.error(`Erro ao excluir ticket: ${mutationErrorMessage(error)}`);
    }
  };
  
  const getTicketsByClient = (clientId: string) => tickets.filter(t => t.clientId === clientId);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    clients, projects, tasks, contracts, knowledgeItems, tickets, loading,
    addClient, updateClient, deleteClient, getClient,
    addProject, updateProject, deleteProject, getProjectsByClient,
    addTask, updateTask, deleteTask, getTasksByClient, getTasksByProject,
    addContract, updateContract, deleteContract, getContractsByClient,
    addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, getKnowledgeByClient,
    addTicket, updateTicket, deleteTicket, getTicketsByClient,
    refreshData: loadData,
  }), [clients, projects, tasks, contracts, knowledgeItems, tickets, loading]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
