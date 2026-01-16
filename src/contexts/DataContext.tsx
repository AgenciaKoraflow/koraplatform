import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Client, Project, Task, Proposal, Contract, KnowledgeItem, SupportTicket } from "@/types/data";
import { parseCurrencyToNumber } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DataContextType {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  proposals: Proposal[];
  contracts: Contract[];
  knowledgeItems: KnowledgeItem[];
  tickets: SupportTicket[];
  loading: boolean;
  
  // Client methods
  addClient: (client: Omit<Client, "id">) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
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
  
  // Proposal methods
  addProposal: (proposal: Omit<Proposal, "id">) => Promise<Proposal | null>;
  updateProposal: (id: string, proposal: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  getProposalsByClient: (clientId: string) => Proposal[];
  
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
    body: { action, table, data, id, filters }
  });
  
  if (error) {
    console.error('External DB error:', error);
    throw error;
  }
  
  if (result.error) {
    console.error('External DB result error:', result.error);
    throw new Error(result.error);
  }
  
  return result.data;
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
    anniversary: db.anniversary
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
    dueDate: db.end_date || '',
    team: [],
    tasks: 0,
    completedTasks: 0
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
    dueDate: db.due_date || '',
    assignees: db.assigned_to ? db.assigned_to.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  };
}

function mapDbProposal(db: any): Proposal {
  const num = db.value === null || db.value === undefined ? 0 : Number(db.value);
  return {
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id,
    title: db.title || '',
    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num),
    status: db.status || 'draft',
    services: [],
    createdAt: db.created_at ? formatDate(db.created_at) : '',
    validUntil: db.valid_until || ''
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

  return {
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id,
    proposalId: db.proposal_id,
    title: db.title || '',
    value: formatContractValue(db.value),
    status: db.status || 'draft',
    type: db.type || 'projeto',
    billingType: db.billing_type || 'projeto',
    recurrenceValue: db.recurrence_value ? formatContractValue(db.recurrence_value) : undefined,
    recurrenceStartDate: db.recurrence_start_date || undefined,
    createdAt: db.created_at ? formatDate(db.created_at) : '',
    signedAt: db.signed_at ? formatDate(db.signed_at) : undefined,
    expiresAt: db.end_date || '',
    documentName: db.document_name,
    documentData: db.document_data
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

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsData, projectsData, tasksData, proposalsData, contractsData, knowledgeData, ticketsData] = await Promise.all([
        callExternalDb('select', 'clients'),
        callExternalDb('select', 'projects'),
        callExternalDb('select', 'tasks'),
        callExternalDb('select', 'proposals'),
        callExternalDb('select', 'contracts'),
        callExternalDb('select', 'knowledge_items'),
        callExternalDb('select', 'support_tickets')
      ]);
      
      setClients((clientsData || []).map(mapDbClient));
      setProjects((projectsData || []).map(mapDbProject));
      setTasks((tasksData || []).map(mapDbTask));
      setProposals((proposalsData || []).map(mapDbProposal));
      setContracts((contractsData || []).map(mapDbContract));
      setKnowledgeItems((knowledgeData || []).map(mapDbKnowledge));
      setTickets((ticketsData || []).map(mapDbTicket));
      
      console.log('Data loaded from external Supabase');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados do banco de dados');
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
      const dbData = {
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        pipeline_stage: client.stage,
        notes: client.value,
        anniversary: toISODate(client.anniversary)
      };
      const result = await callExternalDb('insert', 'clients', dbData);
      if (result && result[0]) {
        const newClient = mapDbClient(result[0]);
        setClients(prev => [...prev, newClient]);
        toast.success('Cliente adicionado com sucesso');
        return newClient;
      }
      return null;
    } catch (error) {
      toast.error('Erro ao adicionar cliente');
      return null;
    }
  };
  
  const updateClient = async (id: string, client: Partial<Client>) => {
    try {
      const dbData: any = {};
      if (client.name) dbData.name = client.name;
      if (client.company) dbData.company = client.company;
      if (client.email) dbData.email = client.email;
      if (client.phone) dbData.phone = client.phone;
      if (client.stage) dbData.pipeline_stage = client.stage;
      if (client.value) dbData.notes = client.value;
      if (client.anniversary) dbData.anniversary = toISODate(client.anniversary);
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'clients', dbData, id);
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...client } : c));
      toast.success('Cliente atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar cliente');
    }
  };
  
  const deleteClient = async (id: string) => {
    try {
      await callExternalDb('delete', 'clients', undefined, id);
      setClients(prev => prev.filter(c => c.id !== id));
      setProjects(prev => prev.filter(p => p.clientId !== id));
      setTasks(prev => prev.filter(t => t.clientId !== id));
      setProposals(prev => prev.filter(p => p.clientId !== id));
      setContracts(prev => prev.filter(c => c.clientId !== id));
      setKnowledgeItems(prev => prev.filter(k => k.clientId !== id));
      setTickets(prev => prev.filter(t => t.clientId !== id));
      toast.success('Cliente excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };
  
  const getClient = (id: string) => clients.find(c => c.id === id);

  // Project methods
  const addProject = async (project: Omit<Project, "id">): Promise<Project | null> => {
    try {
      const dbData = {
        client_id: project.clientId,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        end_date: toISODate(project.dueDate)
      };
      const result = await callExternalDb('insert', 'projects', dbData);
      if (result && result[0]) {
        const newProject = mapDbProject(result[0]);
        setProjects(prev => [...prev, newProject]);
        toast.success('Projeto adicionado com sucesso');
        return newProject;
      }
      return null;
    } catch (error) {
      toast.error('Erro ao adicionar projeto');
      return null;
    }
  };
  
  const updateProject = async (id: string, project: Partial<Project>) => {
    try {
      const dbData: any = {};
      if (project.clientId) dbData.client_id = project.clientId;
      if (project.name) dbData.name = project.name;
      if (project.description) dbData.description = project.description;
      if (project.status) dbData.status = project.status;
      if (project.progress !== undefined) dbData.progress = project.progress;
      if (project.dueDate) dbData.end_date = toISODate(project.dueDate);
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'projects', dbData, id);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...project } : p));
      toast.success('Projeto atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar projeto');
    }
  };
  
  const deleteProject = async (id: string) => {
    try {
      await callExternalDb('delete', 'projects', undefined, id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
      toast.success('Projeto excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir projeto');
    }
  };
  
  const getProjectsByClient = (clientId: string) => projects.filter(p => p.clientId === clientId);

  // Task methods
  const addTask = async (task: Omit<Task, "id">): Promise<Task | null> => {
    try {
      const dbData = {
        client_id: task.clientId,
        project_id: task.projectId || null,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: toISODate(task.dueDate),
        assigned_to: task.assignees.join(', ')
      };
      const result = await callExternalDb('insert', 'tasks', dbData);
      if (result && result[0]) {
        const newTask = mapDbTask(result[0]);
        setTasks(prev => [...prev, newTask]);
        toast.success('Tarefa adicionada com sucesso');
        return newTask;
      }
      return null;
    } catch (error) {
      toast.error('Erro ao adicionar tarefa');
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
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'tasks', dbData, id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...task } : t));
      toast.success('Tarefa atualizada com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar tarefa');
    }
  };
  
  const deleteTask = async (id: string) => {
    try {
      await callExternalDb('delete', 'tasks', undefined, id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Tarefa excluída com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir tarefa');
    }
  };
  
  const getTasksByClient = (clientId: string) => tasks.filter(t => t.clientId === clientId);
  const getTasksByProject = (projectId: string) => tasks.filter(t => t.projectId === projectId);

  // Proposal methods
  const addProposal = async (proposal: Omit<Proposal, "id">): Promise<Proposal | null> => {
    try {
      const dbData = {
        client_id: proposal.clientId,
        project_id: proposal.projectId || null,
        title: proposal.title,
        value: parseValue(proposal.value),
        status: proposal.status,
        valid_until: toISODate(proposal.validUntil)
      };
      const result = await callExternalDb('insert', 'proposals', dbData);
      if (result && result[0]) {
        const newProposal = mapDbProposal(result[0]);
        setProposals(prev => [...prev, newProposal]);
        toast.success('Proposta adicionada com sucesso');
        return newProposal;
      }
      return null;
    } catch (error) {
      toast.error('Erro ao adicionar proposta');
      return null;
    }
  };
  
  const updateProposal = async (id: string, proposal: Partial<Proposal>) => {
    try {
      const dbData: any = {};
      if (proposal.clientId) dbData.client_id = proposal.clientId;
      if (proposal.projectId !== undefined) dbData.project_id = proposal.projectId || null;
      if (proposal.title) dbData.title = proposal.title;
      if (proposal.value) dbData.value = parseValue(proposal.value);
      if (proposal.status) dbData.status = proposal.status;
      if (proposal.validUntil) dbData.valid_until = toISODate(proposal.validUntil);
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'proposals', dbData, id);
      setProposals(prev => prev.map(p => p.id === id ? { ...p, ...proposal } : p));
      toast.success('Proposta atualizada com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar proposta');
    }
  };
  
  const deleteProposal = async (id: string) => {
    try {
      await callExternalDb('delete', 'proposals', undefined, id);
      setProposals(prev => prev.filter(p => p.id !== id));
      toast.success('Proposta excluída com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir proposta');
    }
  };
  
  const getProposalsByClient = (clientId: string) => proposals.filter(p => p.clientId === clientId);

  // Contract methods
  const addContract = async (contract: Omit<Contract, "id">): Promise<Contract | null> => {
    try {
      const dbData = {
        client_id: contract.clientId,
        project_id: contract.projectId || null,
        proposal_id: contract.proposalId || null,
        title: contract.title,
        value: parseValue(contract.value),
        status: contract.status,
        start_date: toISODate(contract.createdAt),
        end_date: toISODate(contract.expiresAt),
        document_name: contract.documentName,
        document_data: contract.documentData,
        signed_at: toISODate(contract.signedAt)
      };
      const result = await callExternalDb('insert', 'contracts', dbData);
      if (result && result[0]) {
        const newContract = mapDbContract(result[0]);
        setContracts(prev => [...prev, newContract]);
        toast.success('Contrato adicionado com sucesso');
        return newContract;
      }
      return null;
    } catch (error) {
      toast.error('Erro ao adicionar contrato');
      return null;
    }
  };
  
  const updateContract = async (id: string, contract: Partial<Contract>) => {
    try {
      const dbData: any = {};
      if (contract.clientId) dbData.client_id = contract.clientId;
      if (contract.projectId !== undefined) dbData.project_id = contract.projectId || null;
      if (contract.proposalId !== undefined) dbData.proposal_id = contract.proposalId || null;
      if (contract.title) dbData.title = contract.title;
      if (contract.value) dbData.value = parseValue(contract.value);
      if (contract.status) dbData.status = contract.status;
      if (contract.expiresAt) dbData.end_date = toISODate(contract.expiresAt);
      if (contract.documentName) dbData.document_name = contract.documentName;
      if (contract.documentData) dbData.document_data = contract.documentData;
      if (contract.signedAt) dbData.signed_at = toISODate(contract.signedAt);
      dbData.updated_at = new Date().toISOString();
      
      await callExternalDb('update', 'contracts', dbData, id);
      setContracts(prev => prev.map(c => c.id === id ? { ...c, ...contract } : c));
      toast.success('Contrato atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar contrato');
    }
  };
  
  const deleteContract = async (id: string) => {
    try {
      await callExternalDb('delete', 'contracts', undefined, id);
      setContracts(prev => prev.filter(c => c.id !== id));
      toast.success('Contrato excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir contrato');
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
      toast.error('Erro ao adicionar item');
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
      toast.error('Erro ao atualizar item');
    }
  };
  
  const deleteKnowledgeItem = async (id: string) => {
    try {
      await callExternalDb('delete', 'knowledge_items', undefined, id);
      setKnowledgeItems(prev => prev.filter(k => k.id !== id));
      toast.success('Item excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir item');
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
      toast.error('Erro ao adicionar ticket');
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
      toast.error('Erro ao atualizar ticket');
    }
  };
  
  const deleteTicket = async (id: string) => {
    try {
      await callExternalDb('delete', 'support_tickets', undefined, id);
      setTickets(prev => prev.filter(t => t.id !== id));
      toast.success('Ticket excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir ticket');
    }
  };
  
  const getTicketsByClient = (clientId: string) => tickets.filter(t => t.clientId === clientId);

  return (
    <DataContext.Provider value={{
      clients, projects, tasks, proposals, contracts, knowledgeItems, tickets, loading,
      addClient, updateClient, deleteClient, getClient,
      addProject, updateProject, deleteProject, getProjectsByClient,
      addTask, updateTask, deleteTask, getTasksByClient, getTasksByProject,
      addProposal, updateProposal, deleteProposal, getProposalsByClient,
      addContract, updateContract, deleteContract, getContractsByClient,
      addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, getKnowledgeByClient,
      addTicket, updateTicket, deleteTicket, getTicketsByClient,
      refreshData: loadData,
    }}>
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
