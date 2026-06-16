import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbContract, toISODate, parseValue } from "@/lib/mappers";
import { Contract } from "@/types/data";
import { contractKeys } from "@/hooks/useContracts";
import type { DbContractRow } from "@/types/db";
import { toast } from "sonner";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Erro desconhecido";
}

export function useContractMutations() {
  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (contract: Omit<Contract, "id">): Promise<Contract> => {
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
        recurrence_type: contract.recurrenceType ?? null,
        recurrence_start_date: contract.recurrenceStartDate
          ? toISODate(contract.recurrenceStartDate)
          : null,
        recurrence_end_date: contract.recurrenceEndDate
          ? toISODate(contract.recurrenceEndDate)
          : null,
        implementation_value: contract.implementationValue
          ? parseValue(contract.implementationValue)
          : null,
        created_at: toISODate(contract.createdAt),
        document_name: contract.documentName,
        document_data: contract.documentData ?? null,
        document_type: contract.documentType,
        document_storage_path: contract.documentStoragePath ?? null,
        document_version: contract.documentVersion ?? 0,
        signed_at: toISODate(contract.signedAt),
      };
      if (contract.projectIds && contract.projectIds.length > 0) {
        dbData.project_ids = contract.projectIds;
        dbData.project_id = contract.projectIds[0];
      }
      if (contract.expiresAt) dbData.end_date = toISODate(contract.expiresAt);
      if (contract.createdAt) dbData.start_date = toISODate(contract.createdAt);
      if (contract.bu) dbData.bu = contract.bu;
      const { data: rows, error } = await supabase.from("contracts").insert(dbData).select();
      if (error) throw new Error(error.message);
      if (!rows?.[0]) throw new Error("Resposta vazia ao criar contrato");
      return mapDbContract(rows[0] as DbContractRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
      toast.success("Contrato adicionado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao adicionar contrato: ${errMsg(error)}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contract> }) => {
      const dbData: Record<string, unknown> = {};
      if (data.clientId) dbData.client_id = data.clientId;
      if (data.projectIds !== undefined) {
        dbData.project_ids = data.projectIds.length > 0 ? data.projectIds : null;
        dbData.project_id = data.projectIds.length > 0 ? data.projectIds[0] : null;
      }
      if (data.type !== undefined) dbData.type = data.type;
      if (data.billingType !== undefined) dbData.billing_type = data.billingType;
      if (data.recurrenceValue !== undefined)
        dbData.recurrence_value = data.recurrenceValue ? parseValue(data.recurrenceValue) : null;
      if (data.recurrenceType !== undefined)
        dbData.recurrence_type = data.recurrenceType || null;
      if (data.recurrenceStartDate !== undefined)
        dbData.recurrence_start_date = data.recurrenceStartDate
          ? toISODate(data.recurrenceStartDate)
          : null;
      if (data.recurrenceEndDate !== undefined)
        dbData.recurrence_end_date = data.recurrenceEndDate
          ? toISODate(data.recurrenceEndDate)
          : null;
      if (data.implementationValue !== undefined)
        dbData.implementation_value = data.implementationValue
          ? parseValue(data.implementationValue)
          : null;
      if (data.title) dbData.title = data.title;
      if (data.value) dbData.value = parseValue(data.value);
      if (data.status) dbData.status = data.status;
      if (data.expiresAt) dbData.end_date = toISODate(data.expiresAt);
      if (data.documentName !== undefined) dbData.document_name = data.documentName || null;
      if (data.documentData !== undefined) dbData.document_data = data.documentData || null;
      if (data.documentType !== undefined) dbData.document_type = data.documentType || null;
      if (data.documentStoragePath !== undefined)
        dbData.document_storage_path = data.documentStoragePath || null;
      if (data.documentVersion !== undefined) dbData.document_version = data.documentVersion;
      if (data.signedDocumentStoragePath !== undefined)
        dbData.signed_document_storage_path = data.signedDocumentStoragePath || null;
      if (data.signedAt) dbData.signed_at = toISODate(data.signedAt);
      if (data.bu !== undefined) dbData.bu = data.bu;
      if (data.signatureLinkToken) dbData.signature_link_token = data.signatureLinkToken;
      if (data.signatureLinkExpiresAt)
        dbData.signature_link_expires_at = toISODate(data.signatureLinkExpiresAt);
      if (data.koraflowSignedAt)
        dbData.contractor_signed_at = toISODate(data.koraflowSignedAt);
      if (data.koraflowSignatureData)
        dbData.contractor_signature_data = data.koraflowSignatureData;
      if (data.koraflowSignerName)
        dbData.contractor_signer_name = data.koraflowSignerName;
      if (data.koraflowSignerEmail)
        dbData.contractor_signer_email = data.koraflowSignerEmail;
      if (data.contractorSignedAt)
        dbData.contractor_signed_at = toISODate(data.contractorSignedAt);
      if (data.contractorSignatureData)
        dbData.contractor_signature_data = data.contractorSignatureData;
      if (data.contractorSignerName)
        dbData.contractor_signer_name = data.contractorSignerName;
      if (data.contractorSignerEmail)
        dbData.contractor_signer_email = data.contractorSignerEmail;
      if (data.clientSignedAt) dbData.client_signed_at = toISODate(data.clientSignedAt);
      if (data.clientSignatureData) dbData.client_signature_data = data.clientSignatureData;
      if (data.clientSignerName) dbData.client_signer_name = data.clientSignerName;
      if (data.clientSignerEmail) dbData.client_signer_email = data.clientSignerEmail;
      if (data.fullySignedAt) dbData.fully_signed_at = toISODate(data.fullySignedAt);
      const { error } = await supabase.from("contracts").update(dbData).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
      toast.success("Contrato atualizado com sucesso");
    },
    onError: (error) => toast.error(`Erro ao atualizar contrato: ${errMsg(error)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
      toast.success("Contrato excluído com sucesso");
    },
    onError: (error) => toast.error(`Erro ao excluir contrato: ${errMsg(error)}`),
  });

  return {
    addContract: (data: Omit<Contract, "id">) =>
      addMutation.mutateAsync(data).catch(() => null as Contract | null),
    updateContract: (id: string, data: Partial<Contract>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteContract: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
