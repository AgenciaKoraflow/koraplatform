import React, { createContext, useContext, useCallback, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Client, Project, Task, Contract, KnowledgeItem, SupportTicket } from "@/types/data";
import { parseCurrencyToNumber } from "@/lib/currency";
import { callExternalDb } from "@/lib/externalDb";
import { mapDbClient, mapDbProject, mapDbTask, mapDbContract, mapDbKnowledge, mapDbTicket, toISODate, parseValue } from "@/lib/mappers";
import { clientKeys } from "@/hooks/useClients";
import { projectKeys } from "@/hooks/useProjects";
import { taskKeys } from "@/hooks/useTasks";
import { contractKeys } from "@/hooks/useContracts";
import { ticketKeys } from "@/hooks/useTickets";
import { knowledgeKeys } from "@/hooks/useKnowledgeItems";
import { toast } from "sonner";

// ─── Context type ─────────────────────────────────────────────────────────────

interface DataContextType {
  // Client mutations
  addClient: (client: Omit<Client, "id">) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<void>;

  // Project mutations
  addProject: (project: Omit<Project, "id">) => Promise<Project | null>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Task mutations
  addTask: (task: Omit<Task, "id">) => Promise<Task | null>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Contract mutations
  addContract: (contract: Omit<Contract, "id">) => Promise<Contract | null>;
  updateContract: (id: string, contract: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  // Knowledge mutations
  addKnowledgeItem: (item: Omit<KnowledgeItem, "id">) => Promise<KnowledgeItem | null>;
  updateKnowledgeItem: (id: string, item: Partial<KnowledgeItem>) => Promise<void>;
  deleteKnowledgeItem: (id: string) => Promise<void>;
  getKnowledgePassword: (id: string) => Promise<string | null>;

  // Ticket mutations
  addTicket: (ticket: Omit<SupportTicket, "id">) => Promise<SupportTicket | null>;
  updateTicket: (id: string, ticket: Partial<SupportTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;

  // Invalidate all cached data (e.g., after bulk import)
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function mutationErr(error: unknown): string {
  return error instanceof Error ? error.message : "Erro desconhecido";
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (...keys: string[][]) => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
    },
    [queryClient],
  );

  // ── Clients ────────────────────────────────────────────────────────────────

  const addClient = useCallback(
    async (client: Omit<Client, "id">): Promise<Client | null> => {
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
        if (client.logo?.trim()) dbData.logo = client.logo.trim();

        const result = await callExternalDb("insert", "clients", dbData);
        if (result && result[0]) {
          const newClient = mapDbClient(result[0]);
          invalidate(clientKeys.all as unknown as string[]);
          toast.success("Cliente adicionado com sucesso");
          return newClient;
        }
        toast.error("Resposta vazia ao criar cliente");
        return null;
      } catch (error) {
        toast.error(`Erro ao adicionar cliente: ${mutationErr(error)}`);
        return null;
      }
    },
    [invalidate],
  );

  const updateClient = useCallback(
    async (id: string, client: Partial<Client>): Promise<boolean> => {
      try {
        const dbData: Record<string, unknown> = {};
        if (client.name) dbData.name = client.name;
        if (client.company) dbData.company = client.company;
        if (client.email) dbData.email = client.email;
        if (client.phone) dbData.phone = client.phone;
        if (client.stage) dbData.pipeline_stage = client.stage;
        if (client.value) dbData.notes = client.value;
        if (client.anniversary) dbData.anniversary = toISODate(client.anniversary);
        if (client.briefing !== undefined) dbData.briefing = client.briefing || null;
        if (client.proposalSentDate !== undefined)
          dbData.proposal_sent_date = toISODate(client.proposalSentDate);
        if (client.head !== undefined) dbData.head = client.head?.trim() || null;
        if (client.bu !== undefined) dbData.bu = client.bu;
        if (client.logo !== undefined) dbData.logo = client.logo || null;

        await callExternalDb("update", "clients", dbData, id);
        invalidate(clientKeys.all as unknown as string[]);
        toast.success("Cliente atualizado com sucesso");
        return true;
      } catch (error) {
        toast.error(`Erro ao atualizar cliente: ${mutationErr(error)}`);
        return false;
      }
    },
    [invalidate],
  );

  const deleteClient = useCallback(
    async (id: string) => {
      try {
        await callExternalDb("delete", "clients", undefined, id);
        invalidate(
          clientKeys.all as unknown as string[],
          projectKeys.all as unknown as string[],
          taskKeys.all as unknown as string[],
          contractKeys.all as unknown as string[],
          knowledgeKeys.all as unknown as string[],
          ticketKeys.all as unknown as string[],
        );
        toast.success("Cliente excluído com sucesso");
      } catch (error) {
        toast.error(`Erro ao excluir cliente: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  // ── Projects ───────────────────────────────────────────────────────────────

  const addProject = useCallback(
    async (project: Omit<Project, "id">): Promise<Project | null> => {
      try {
        const dbData: Record<string, unknown> = {
          client_id: project.clientId,
          name: project.name,
          description: project.description || null,
          status: project.status,
          progress: project.progress || 0,
          end_date: toISODate(project.dueDate),
          billing_type: project.billingType || "projeto",
          type: project.type || "projeto",
          head: project.head || null,
          team: project.team || [],
        };
        if (project.value) dbData.value = parseCurrencyToNumber(project.value);
        if (project.recurrenceValue)
          dbData.recurrence_value = parseCurrencyToNumber(project.recurrenceValue);
        if (project.recurrenceStartDate)
          dbData.recurrence_start_date = toISODate(project.recurrenceStartDate);
        if (project.bu) dbData.bu = project.bu;

        const result = await callExternalDb("insert", "projects", dbData);
        if (result && result[0]) {
          const newProject = mapDbProject(result[0]);
          invalidate(projectKeys.all as unknown as string[]);
          toast.success("Projeto adicionado com sucesso");
          return newProject;
        }
        return null;
      } catch (error) {
        toast.error(`Erro ao adicionar projeto: ${mutationErr(error)}`);
        return null;
      }
    },
    [invalidate],
  );

  const updateProject = useCallback(
    async (id: string, project: Partial<Project>) => {
      try {
        const dbData: Record<string, unknown> = {};
        if (project.clientId) dbData.client_id = project.clientId;
        if (project.name) dbData.name = project.name;
        if (project.description !== undefined) dbData.description = project.description;
        if (project.status) dbData.status = project.status;
        if (project.progress !== undefined) dbData.progress = project.progress;
        if (project.dueDate) dbData.end_date = toISODate(project.dueDate);
        if (project.value !== undefined)
          dbData.value = project.value ? parseCurrencyToNumber(project.value) : null;
        if (project.billingType !== undefined) dbData.billing_type = project.billingType;
        if (project.type !== undefined) dbData.type = project.type;
        if (project.recurrenceValue !== undefined)
          dbData.recurrence_value = project.recurrenceValue
            ? parseCurrencyToNumber(project.recurrenceValue)
            : null;
        if (project.recurrenceStartDate !== undefined)
          dbData.recurrence_start_date = project.recurrenceStartDate
            ? toISODate(project.recurrenceStartDate)
            : null;
        if (project.head !== undefined) dbData.head = project.head || null;
        if (project.team !== undefined) dbData.team = project.team || [];
        if (project.bu !== undefined) dbData.bu = project.bu;

        if (Object.keys(dbData).length === 0) return;

        await callExternalDb("update", "projects", dbData, id);
        invalidate(projectKeys.all as unknown as string[]);
        toast.success("Projeto atualizado com sucesso");
      } catch (error) {
        toast.error(`Erro ao atualizar projeto: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await callExternalDb("delete", "projects", undefined, id);
        invalidate(
          projectKeys.all as unknown as string[],
          taskKeys.all as unknown as string[],
        );
        toast.success("Projeto excluído com sucesso");
      } catch (error) {
        toast.error(`Erro ao excluir projeto: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  // ── Tasks ──────────────────────────────────────────────────────────────────

  const addTask = useCallback(
    async (task: Omit<Task, "id">): Promise<Task | null> => {
      try {
        const dbData: Record<string, unknown> = {
          client_id: task.clientId,
          project_id: task.projectId || null,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: toISODate(task.dueDate),
          assigned_to: task.assignees.join(", "),
        };
        if (task.bu) dbData.bu = task.bu;

        const result = await callExternalDb("insert", "tasks", dbData);
        if (result && result[0]) {
          const newTask = mapDbTask(result[0]);
          invalidate(taskKeys.all as unknown as string[]);
          if (newTask.projectId) await syncProjectProgress(newTask.projectId);
          toast.success("Tarefa adicionada com sucesso");
          return newTask;
        }
        return null;
      } catch (error) {
        toast.error(`Erro ao adicionar tarefa: ${mutationErr(error)}`);
        return null;
      }
    },
    [invalidate],
  );

  const updateTask = useCallback(
    async (id: string, task: Partial<Task>) => {
      try {
        const dbData: Record<string, unknown> = {};
        if (task.clientId) dbData.client_id = task.clientId;
        if (task.projectId !== undefined) dbData.project_id = task.projectId || null;
        if (task.title) dbData.title = task.title;
        if (task.description) dbData.description = task.description;
        if (task.status) dbData.status = task.status;
        if (task.priority) dbData.priority = task.priority;
        if (task.dueDate) dbData.due_date = toISODate(task.dueDate);
        if (task.assignees) dbData.assigned_to = task.assignees.join(", ");
        if (task.bu !== undefined) dbData.bu = task.bu;

        await callExternalDb("update", "tasks", dbData, id);
        invalidate(taskKeys.all as unknown as string[]);
        if (task.projectId) await syncProjectProgress(task.projectId);
        toast.success("Tarefa atualizada com sucesso");
      } catch (error) {
        toast.error(`Erro ao atualizar tarefa: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        // Fetch the task first to get its projectId before deleting
        const tasks = await callExternalDb("select", "tasks", undefined, id);
        const projectId = Array.isArray(tasks) ? tasks[0]?.project_id : undefined;

        await callExternalDb("delete", "tasks", undefined, id);
        invalidate(taskKeys.all as unknown as string[]);
        if (projectId) await syncProjectProgress(projectId);
        toast.success("Tarefa excluída com sucesso");
      } catch (error) {
        toast.error(`Erro ao excluir tarefa: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  // ── Contracts ──────────────────────────────────────────────────────────────

  const addContract = useCallback(
    async (contract: Omit<Contract, "id">): Promise<Contract | null> => {
      try {
        const dbData: Record<string, unknown> = {
          client_id: contract.clientId,
          title: contract.title,
          value: parseValue(contract.value),
          status: contract.status,
          type: contract.type,
          billing_type: contract.billingType,
          recurrence_value: contract.recurrenceValue
            ? parseValue(contract.recurrenceValue)
            : null,
          recurrence_start_date: contract.recurrenceStartDate
            ? toISODate(contract.recurrenceStartDate)
            : null,
          created_at: toISODate(contract.createdAt),
          document_name: contract.documentName,
          document_data: contract.documentData,
          document_type: contract.documentType,
          signed_at: toISODate(contract.signedAt),
        };
        if (contract.projectIds && contract.projectIds.length > 0) {
          dbData.project_ids = contract.projectIds;
          dbData.project_id = contract.projectIds[0];
        }
        if (contract.expiresAt) dbData.end_date = toISODate(contract.expiresAt);
        if (contract.createdAt) dbData.start_date = toISODate(contract.createdAt);
        if (contract.bu) dbData.bu = contract.bu;

        const result = await callExternalDb("insert", "contracts", dbData);
        if (result && result[0]) {
          const newContract = mapDbContract(result[0]);
          invalidate(contractKeys.all as unknown as string[]);
          toast.success("Contrato adicionado com sucesso");
          return newContract;
        }
        return null;
      } catch (error) {
        toast.error(`Erro ao adicionar contrato: ${mutationErr(error)}`);
        return null;
      }
    },
    [invalidate],
  );

  const updateContract = useCallback(
    async (id: string, contract: Partial<Contract>) => {
      try {
        const dbData: Record<string, unknown> = {};
        if (contract.clientId) dbData.client_id = contract.clientId;
        if (contract.projectIds !== undefined) {
          dbData.project_ids =
            contract.projectIds.length > 0 ? contract.projectIds : null;
          dbData.project_id =
            contract.projectIds.length > 0 ? contract.projectIds[0] : null;
        }
        if (contract.type !== undefined) dbData.type = contract.type;
        if (contract.billingType !== undefined) dbData.billing_type = contract.billingType;
        if (contract.recurrenceValue !== undefined)
          dbData.recurrence_value = contract.recurrenceValue
            ? parseValue(contract.recurrenceValue)
            : null;
        if (contract.recurrenceStartDate !== undefined)
          dbData.recurrence_start_date = contract.recurrenceStartDate
            ? toISODate(contract.recurrenceStartDate)
            : null;
        if (contract.title) dbData.title = contract.title;
        if (contract.value) dbData.value = parseValue(contract.value);
        if (contract.status) dbData.status = contract.status;
        if (contract.expiresAt) dbData.end_date = toISODate(contract.expiresAt);
        if (contract.documentName !== undefined)
          dbData.document_name = contract.documentName || null;
        if (contract.documentData !== undefined)
          dbData.document_data = contract.documentData || null;
        if (contract.documentType !== undefined)
          dbData.document_type = contract.documentType || null;
        if (contract.signedAt) dbData.signed_at = toISODate(contract.signedAt);
        if (contract.bu !== undefined) dbData.bu = contract.bu;
        if (contract.signatureLinkToken)
          dbData.signature_link_token = contract.signatureLinkToken;
        if (contract.signatureLinkExpiresAt)
          dbData.signature_link_expires_at = toISODate(contract.signatureLinkExpiresAt);
        if (contract.koraflowSignedAt)
          dbData.contractor_signed_at = toISODate(contract.koraflowSignedAt);
        if (contract.koraflowSignatureData)
          dbData.contractor_signature_data = contract.koraflowSignatureData;
        if (contract.koraflowSignerName)
          dbData.contractor_signer_name = contract.koraflowSignerName;
        if (contract.koraflowSignerEmail)
          dbData.contractor_signer_email = contract.koraflowSignerEmail;
        if (contract.contractorSignedAt)
          dbData.contractor_signed_at = toISODate(contract.contractorSignedAt);
        if (contract.contractorSignatureData)
          dbData.contractor_signature_data = contract.contractorSignatureData;
        if (contract.contractorSignerName)
          dbData.contractor_signer_name = contract.contractorSignerName;
        if (contract.contractorSignerEmail)
          dbData.contractor_signer_email = contract.contractorSignerEmail;
        if (contract.clientSignedAt)
          dbData.client_signed_at = toISODate(contract.clientSignedAt);
        if (contract.clientSignatureData)
          dbData.client_signature_data = contract.clientSignatureData;
        if (contract.clientSignerName)
          dbData.client_signer_name = contract.clientSignerName;
        if (contract.clientSignerEmail)
          dbData.client_signer_email = contract.clientSignerEmail;
        if (contract.fullySignedAt)
          dbData.fully_signed_at = toISODate(contract.fullySignedAt);

        await callExternalDb("update", "contracts", dbData, id);
        invalidate(contractKeys.all as unknown as string[]);
        toast.success("Contrato atualizado com sucesso");
      } catch (error) {
        toast.error(`Erro ao atualizar contrato: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  const deleteContract = useCallback(
    async (id: string) => {
      try {
        await callExternalDb("delete", "contracts", undefined, id);
        invalidate(contractKeys.all as unknown as string[]);
        toast.success("Contrato excluído com sucesso");
      } catch (error) {
        toast.error(`Erro ao excluir contrato: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  // ── Knowledge ──────────────────────────────────────────────────────────────

  const addKnowledgeItem = useCallback(
    async (item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem | null> => {
      try {
        const dbData: Record<string, unknown> = {
          client_id: item.clientId ?? null,
          project_id: item.projectIds?.[0] ?? null,
          title: item.title,
          category: item.category,
          content: item.content,
          username: item.username ?? null,
          url: item.url ?? null,
          tags: item.tags,
        };
        if ((item as any).password) dbData.password = (item as any).password;

        const result = await callExternalDb("insert", "knowledge_items", dbData);
        if (result && result[0]) {
          const newItem = mapDbKnowledge(result[0]);
          invalidate(knowledgeKeys.all as unknown as string[]);
          toast.success("Item adicionado com sucesso");
          return newItem;
        }
        return null;
      } catch (error) {
        toast.error(`Erro ao adicionar item: ${mutationErr(error)}`);
        return null;
      }
    },
    [invalidate],
  );

  const updateKnowledgeItem = useCallback(
    async (id: string, item: Partial<KnowledgeItem>) => {
      try {
        const dbData: Record<string, unknown> = {};
        if (item.clientId !== undefined) dbData.client_id = item.clientId ?? null;
        if (item.projectIds !== undefined) dbData.project_id = item.projectIds?.[0] ?? null;
        if (item.title) dbData.title = item.title;
        if (item.category) dbData.category = item.category;
        if (item.content !== undefined) dbData.content = item.content;
        if (item.username !== undefined) dbData.username = item.username;
        if ((item as any).password) dbData.password = (item as any).password;
        if (item.url !== undefined) dbData.url = item.url;
        if (item.tags) dbData.tags = item.tags;

        await callExternalDb("update", "knowledge_items", dbData, id);
        invalidate(knowledgeKeys.all as unknown as string[]);
        toast.success("Item atualizado com sucesso");
      } catch (error) {
        toast.error(`Erro ao atualizar item: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  const deleteKnowledgeItem = useCallback(
    async (id: string) => {
      try {
        await callExternalDb("delete", "knowledge_items", undefined, id);
        invalidate(knowledgeKeys.all as unknown as string[]);
        toast.success("Item excluído com sucesso");
      } catch (error) {
        toast.error(`Erro ao excluir item: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  const getKnowledgePassword = useCallback(async (id: string): Promise<string | null> => {
    try {
      const result = await callExternalDb("get_password", "knowledge_items", undefined, id);
      const pw = (result as { password?: string } | null)?.password;
      return typeof pw === "string" ? pw : null;
    } catch (error) {
      toast.error(`Erro ao obter senha: ${mutationErr(error)}`);
      return null;
    }
  }, []);

  // ── Tickets ────────────────────────────────────────────────────────────────

  const addTicket = useCallback(
    async (ticket: Omit<SupportTicket, "id">): Promise<SupportTicket | null> => {
      try {
        const dbData = {
          client_id: ticket.clientId,
          project_id:
            ticket.projectIds && ticket.projectIds.length > 0
              ? ticket.projectIds[0]
              : null,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
        };
        const result = await callExternalDb("insert", "support_tickets", dbData);
        if (result && result[0]) {
          const newTicket = mapDbTicket(result[0]);
          invalidate(ticketKeys.all as unknown as string[]);
          toast.success("Ticket adicionado com sucesso");
          return newTicket;
        }
        return null;
      } catch (error) {
        toast.error(`Erro ao adicionar ticket: ${mutationErr(error)}`);
        return null;
      }
    },
    [invalidate],
  );

  const updateTicket = useCallback(
    async (id: string, ticket: Partial<SupportTicket>) => {
      try {
        const dbData: Record<string, unknown> = {};
        if (ticket.clientId) dbData.client_id = ticket.clientId;
        if (ticket.projectIds !== undefined)
          dbData.project_id =
            ticket.projectIds && ticket.projectIds.length > 0 ? ticket.projectIds[0] : null;
        if (ticket.title) dbData.title = ticket.title;
        if (ticket.description) dbData.description = ticket.description;
        if (ticket.status) dbData.status = ticket.status;
        if (ticket.priority) dbData.priority = ticket.priority;

        await callExternalDb("update", "support_tickets", dbData, id);
        invalidate(ticketKeys.all as unknown as string[]);
        toast.success("Ticket atualizado com sucesso");
      } catch (error) {
        toast.error(`Erro ao atualizar ticket: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  const deleteTicket = useCallback(
    async (id: string) => {
      try {
        await callExternalDb("delete", "support_tickets", undefined, id);
        invalidate(ticketKeys.all as unknown as string[]);
        toast.success("Ticket excluído com sucesso");
      } catch (error) {
        toast.error(`Erro ao excluir ticket: ${mutationErr(error)}`);
      }
    },
    [invalidate],
  );

  // ── Refresh ────────────────────────────────────────────────────────────────

  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  // ── Context value ──────────────────────────────────────────────────────────

  const contextValue = React.useMemo(
    () => ({
      addClient, updateClient, deleteClient,
      addProject, updateProject, deleteProject,
      addTask, updateTask, deleteTask,
      addContract, updateContract, deleteContract,
      addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, getKnowledgePassword,
      addTicket, updateTicket, deleteTicket,
      refreshData,
    }),
    [
      addClient, updateClient, deleteClient,
      addProject, updateProject, deleteProject,
      addTask, updateTask, deleteTask,
      addContract, updateContract, deleteContract,
      addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem, getKnowledgePassword,
      addTicket, updateTicket, deleteTicket,
      refreshData,
    ],
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}

// ─── Project progress sync ────────────────────────────────────────────────────

async function syncProjectProgress(projectId: string): Promise<void> {
  try {
    const allTasks = await callExternalDb("select", "tasks", undefined, undefined, {
      project_id: projectId,
    });
    const tasks = (allTasks as any[]) ?? [];
    const total = tasks.length;
    if (total === 0) return;
    const completed = tasks.filter((t: any) => t.status === "done").length;
    const progress = Math.round((completed / total) * 100);
    await callExternalDb("update", "projects", { progress }, projectId);
  } catch {
    // Non-critical — progress will be corrected on next data load
  }
}
