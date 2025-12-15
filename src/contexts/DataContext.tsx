import React, { createContext, useContext, useState, ReactNode } from "react";
import { Client, Project, Task, Proposal, Contract, KnowledgeItem, SupportTicket } from "@/types/data";

interface DataContextType {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  proposals: Proposal[];
  contracts: Contract[];
  knowledgeItems: KnowledgeItem[];
  tickets: SupportTicket[];
  
  // Client methods
  addClient: (client: Omit<Client, "id">) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  
  // Project methods
  addProject: (project: Omit<Project, "id">) => Project;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectsByClient: (clientId: string) => Project[];
  
  // Task methods
  addTask: (task: Omit<Task, "id">) => Task;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksByClient: (clientId: string) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  
  // Proposal methods
  addProposal: (proposal: Omit<Proposal, "id">) => Proposal;
  updateProposal: (id: string, proposal: Partial<Proposal>) => void;
  deleteProposal: (id: string) => void;
  getProposalsByClient: (clientId: string) => Proposal[];
  
  // Contract methods
  addContract: (contract: Omit<Contract, "id">) => Contract;
  updateContract: (id: string, contract: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  getContractsByClient: (clientId: string) => Contract[];
  
  // Knowledge methods
  addKnowledgeItem: (item: Omit<KnowledgeItem, "id">) => KnowledgeItem;
  updateKnowledgeItem: (id: string, item: Partial<KnowledgeItem>) => void;
  deleteKnowledgeItem: (id: string) => void;
  getKnowledgeByClient: (clientId: string) => KnowledgeItem[];
  
  // Support ticket methods
  addTicket: (ticket: Omit<SupportTicket, "id">) => SupportTicket;
  updateTicket: (id: string, ticket: Partial<SupportTicket>) => void;
  deleteTicket: (id: string) => void;
  getTicketsByClient: (clientId: string) => SupportTicket[];
}

const initialClients: Client[] = [
  { id: "1", name: "Carlos Silva", company: "TechCorp", email: "carlos@techcorp.com", phone: "(11) 99999-0001", stage: "cliente", value: "R$ 45.000", lastContact: "Há 2 dias", anniversary: "2024-01-15" },
  { id: "2", name: "Ana Santos", company: "InnovateLab", email: "ana@innovatelab.com", phone: "(11) 99999-0002", stage: "proposta", value: "R$ 80.000", lastContact: "Há 1 dia" },
  { id: "3", name: "Pedro Costa", company: "DataFlow Inc", email: "pedro@dataflow.com", phone: "(11) 99999-0003", stage: "qualificacao", value: "R$ 35.000", lastContact: "Hoje" },
  { id: "4", name: "Maria Oliveira", company: "SmartRetail", email: "maria@smartretail.com", phone: "(11) 99999-0004", stage: "negociacao", value: "R$ 120.000", lastContact: "Há 3 dias" },
  { id: "5", name: "Lucas Mendes", company: "AIStartup", email: "lucas@aistartup.com", phone: "(11) 99999-0005", stage: "prospeccao", value: "R$ 25.000", lastContact: "Há 1 semana" },
  { id: "6", name: "Juliana Ferreira", company: "FinTech Plus", email: "juliana@fintechplus.com", phone: "(11) 99999-0006", stage: "cliente", value: "R$ 95.000", lastContact: "Há 4 dias", anniversary: "2024-06-01" },
];

const initialProjects: Project[] = [
  { id: "1", clientId: "1", name: "Chatbot Atendimento", description: "Desenvolvimento de chatbot para atendimento ao cliente", status: "in_progress", progress: 65, dueDate: "15 Jan 2025", team: ["João", "Maria"], tasks: 24, completedTasks: 18 },
  { id: "2", clientId: "4", name: "Automação RPA", description: "Automação de processos internos com RPA", status: "planning", progress: 20, dueDate: "28 Fev 2025", team: ["Pedro", "Ana"], tasks: 15, completedTasks: 3 },
  { id: "3", clientId: "6", name: "Sistema ML Previsão", description: "Sistema de machine learning para previsão de vendas", status: "review", progress: 90, dueDate: "20 Dez 2024", team: ["Carlos", "Lucas"], tasks: 30, completedTasks: 28 },
  { id: "4", clientId: "1", name: "Dashboard Analytics", description: "Dashboard de analytics em tempo real", status: "completed", progress: 100, dueDate: "10 Dez 2024", team: ["João"], tasks: 12, completedTasks: 12 },
];

const initialTasks: Task[] = [
  { id: "1", clientId: "1", projectId: "1", title: "Definir fluxos de conversa", description: "Mapear todos os fluxos de conversa do chatbot", status: "done", priority: "high", dueDate: "20 Dez 2024", assignee: "João Silva" },
  { id: "2", clientId: "1", projectId: "1", title: "Implementar NLP", description: "Integrar processamento de linguagem natural", status: "in_progress", priority: "high", dueDate: "22 Dez 2024", assignee: "Maria Santos" },
  { id: "3", clientId: "4", projectId: "2", title: "Levantar requisitos RPA", description: "Documentar todos os processos a serem automatizados", status: "todo", priority: "medium", dueDate: "25 Dez 2024", assignee: "Pedro Costa" },
  { id: "4", clientId: "6", projectId: "3", title: "Revisar modelo ML", description: "Fazer revisão final do modelo de machine learning", status: "review", priority: "high", dueDate: "18 Dez 2024", assignee: "Carlos Lima" },
  { id: "5", clientId: "1", projectId: "1", title: "Testes de integração", description: "Realizar testes de integração com sistemas existentes", status: "todo", priority: "medium", dueDate: "28 Dez 2024", assignee: "João Silva" },
];

const initialProposals: Proposal[] = [
  { id: "1", clientId: "2", title: "Proposta Automação Completa", value: "R$ 80.000", status: "sent", services: ["Automação RPA", "Consultoria", "Treinamento"], createdAt: "10 Dez 2024", validUntil: "10 Jan 2025" },
  { id: "2", clientId: "3", title: "Proposta Chatbot Básico", value: "R$ 35.000", status: "viewed", services: ["Chatbot", "Integração WhatsApp"], createdAt: "12 Dez 2024", validUntil: "12 Jan 2025" },
  { id: "3", clientId: "4", title: "Proposta RPA Financeiro", value: "R$ 120.000", status: "accepted", services: ["RPA", "Automação", "Suporte 12 meses"], createdAt: "05 Dez 2024", validUntil: "05 Jan 2025" },
  { id: "4", clientId: "5", title: "Proposta Consultoria IA", value: "R$ 25.000", status: "draft", services: ["Consultoria", "Análise de Viabilidade"], createdAt: "15 Dez 2024", validUntil: "15 Jan 2025" },
];

const initialContracts: Contract[] = [
  { id: "1", clientId: "1", projectId: "1", title: "Contrato de Desenvolvimento - Chatbot", value: "R$ 45.000", status: "signed", type: "projeto", createdAt: "01 Dez 2024", signedAt: "05 Dez 2024", expiresAt: "01 Dez 2025" },
  { id: "2", clientId: "4", title: "Contrato de Sustentação Mensal", value: "R$ 8.000/mês", status: "signed", type: "sustentacao", createdAt: "15 Nov 2024", signedAt: "18 Nov 2024", expiresAt: "15 Nov 2025" },
  { id: "3", clientId: "2", proposalId: "1", title: "Contrato de Automação", value: "R$ 80.000", status: "pending_signature", type: "projeto", createdAt: "18 Dez 2024", expiresAt: "18 Dez 2025" },
  { id: "4", clientId: "3", title: "Contrato de Consultoria IA", value: "R$ 15.000", status: "draft", type: "consultoria", createdAt: "20 Dez 2024", expiresAt: "20 Dez 2025" },
  { id: "5", clientId: "6", projectId: "3", title: "Contrato de Desenvolvimento ML", value: "R$ 95.000", status: "expired", type: "projeto", createdAt: "01 Jun 2024", signedAt: "05 Jun 2024", expiresAt: "01 Dez 2024" },
];

const initialKnowledgeItems: KnowledgeItem[] = [
  { id: "1", clientId: "1", title: "Acesso Servidor Produção", category: "credencial", content: "", username: "admin_techcorp", password: "T3chC0rp#2024", url: "https://servidor.techcorp.com", tags: ["servidor", "produção"], createdAt: "01 Dez 2024", updatedAt: "01 Dez 2024" },
  { id: "2", clientId: "1", projectId: "1", title: "Documentação API Chatbot", category: "documento", content: "Documentação completa da API do chatbot", tags: ["api", "chatbot"], createdAt: "05 Dez 2024", updatedAt: "10 Dez 2024" },
  { id: "3", clientId: "4", title: "Portal RPA SmartRetail", category: "link", content: "", url: "https://rpa.smartretail.com/portal", tags: ["rpa", "portal"], createdAt: "15 Nov 2024", updatedAt: "15 Nov 2024" },
  { id: "4", clientId: "6", title: "Credenciais AWS FinTech", category: "credencial", content: "", username: "fintech_ml_user", password: "ML#Fintech@2024", tags: ["aws", "ml"], createdAt: "01 Jun 2024", updatedAt: "01 Jun 2024" },
];

const initialTickets: SupportTicket[] = [
  { id: "1", clientId: "1", projectId: "4", title: "Dashboard não carrega dados", description: "O dashboard de analytics não está carregando os dados em tempo real", status: "open", priority: "high", createdAt: "18 Dez 2024", updatedAt: "18 Dez 2024", assignee: "João Silva" },
  { id: "2", clientId: "4", title: "Erro no processo RPA", description: "Processo de automação financeira está falhando", status: "in_progress", priority: "critical", createdAt: "17 Dez 2024", updatedAt: "18 Dez 2024", assignee: "Pedro Costa" },
  { id: "3", clientId: "6", projectId: "3", title: "Ajuste no modelo ML", description: "Modelo precisa de ajustes para melhor precisão", status: "waiting", priority: "medium", createdAt: "15 Dez 2024", updatedAt: "16 Dez 2024", assignee: "Carlos Lima" },
  { id: "4", clientId: "1", projectId: "1", title: "Chatbot resposta lenta", description: "O chatbot está demorando muito para responder", status: "resolved", priority: "medium", createdAt: "10 Dez 2024", updatedAt: "12 Dez 2024", assignee: "Maria Santos" },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(initialKnowledgeItems);
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);

  const generateId = () => Date.now().toString();

  // Client methods
  const addClient = (client: Omit<Client, "id">) => {
    const newClient = { ...client, id: generateId() };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };
  
  const updateClient = (id: string, client: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...client } : c));
  };
  
  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    // Also delete related items
    setProjects(prev => prev.filter(p => p.clientId !== id));
    setTasks(prev => prev.filter(t => t.clientId !== id));
    setProposals(prev => prev.filter(p => p.clientId !== id));
    setContracts(prev => prev.filter(c => c.clientId !== id));
    setKnowledgeItems(prev => prev.filter(k => k.clientId !== id));
    setTickets(prev => prev.filter(t => t.clientId !== id));
  };
  
  const getClient = (id: string) => clients.find(c => c.id === id);

  // Project methods
  const addProject = (project: Omit<Project, "id">) => {
    const newProject = { ...project, id: generateId() };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };
  
  const updateProject = (id: string, project: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...project } : p));
  };
  
  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };
  
  const getProjectsByClient = (clientId: string) => projects.filter(p => p.clientId === clientId);

  // Task methods
  const addTask = (task: Omit<Task, "id">) => {
    const newTask = { ...task, id: generateId() };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };
  
  const updateTask = (id: string, task: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...task } : t));
  };
  
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };
  
  const getTasksByClient = (clientId: string) => tasks.filter(t => t.clientId === clientId);
  const getTasksByProject = (projectId: string) => tasks.filter(t => t.projectId === projectId);

  // Proposal methods
  const addProposal = (proposal: Omit<Proposal, "id">) => {
    const newProposal = { ...proposal, id: generateId() };
    setProposals(prev => [...prev, newProposal]);
    return newProposal;
  };
  
  const updateProposal = (id: string, proposal: Partial<Proposal>) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, ...proposal } : p));
  };
  
  const deleteProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };
  
  const getProposalsByClient = (clientId: string) => proposals.filter(p => p.clientId === clientId);

  // Contract methods
  const addContract = (contract: Omit<Contract, "id">) => {
    const newContract = { ...contract, id: generateId() };
    setContracts(prev => [...prev, newContract]);
    return newContract;
  };
  
  const updateContract = (id: string, contract: Partial<Contract>) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...contract } : c));
  };
  
  const deleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  };
  
  const getContractsByClient = (clientId: string) => contracts.filter(c => c.clientId === clientId);

  // Knowledge methods
  const addKnowledgeItem = (item: Omit<KnowledgeItem, "id">) => {
    const newItem = { ...item, id: generateId() };
    setKnowledgeItems(prev => [...prev, newItem]);
    return newItem;
  };
  
  const updateKnowledgeItem = (id: string, item: Partial<KnowledgeItem>) => {
    setKnowledgeItems(prev => prev.map(k => k.id === id ? { ...k, ...item } : k));
  };
  
  const deleteKnowledgeItem = (id: string) => {
    setKnowledgeItems(prev => prev.filter(k => k.id !== id));
  };
  
  const getKnowledgeByClient = (clientId: string) => knowledgeItems.filter(k => k.clientId === clientId);

  // Support ticket methods
  const addTicket = (ticket: Omit<SupportTicket, "id">) => {
    const newTicket = { ...ticket, id: generateId() };
    setTickets(prev => [...prev, newTicket]);
    return newTicket;
  };
  
  const updateTicket = (id: string, ticket: Partial<SupportTicket>) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...ticket } : t));
  };
  
  const deleteTicket = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
  };
  
  const getTicketsByClient = (clientId: string) => tickets.filter(t => t.clientId === clientId);

  return (
    <DataContext.Provider value={{
      clients, projects, tasks, proposals, contracts, knowledgeItems, tickets,
      addClient, updateClient, deleteClient, getClient,
      addProject, updateProject, deleteProject, getProjectsByClient,
      addTask, updateTask, deleteTask, getTasksByClient, getTasksByProject,
      addProposal, updateProposal, deleteProposal, getProposalsByClient,
      addContract, updateContract, deleteContract, getContractsByClient,
      addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, getKnowledgeByClient,
      addTicket, updateTicket, deleteTicket, getTicketsByClient,
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
