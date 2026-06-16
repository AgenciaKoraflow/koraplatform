import { logger } from "@/lib/logger";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Project, Contract } from "@/types/data";
import { BU } from "@/types/bu";
import { BUBadge } from "@/components/shared/BUBadge";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { BUSelect } from "@/components/shared/BUSelect";
import {
  Plus, FileSignature, CheckCircle, Clock, AlertCircle, Send, Download, Eye, Edit, Trash2,
  Search, Upload, FileText, X, Copy, Link2, PenTool, RefreshCw, Shield, User, Building2,
  Mail, Users, Check, Cake, CalendarClock, TrendingUp, Zap
} from "lucide-react";
import { SignaturePadPro } from "@/components/signature/SignaturePadPro";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ViewModeToggle, ViewMode } from "@/components/shared/ViewModeToggle";
import { DatePicker } from "@/components/shared/DatePicker";
import { useContractMutations } from "@/hooks/mutations/useContractMutations";
import { useContractDocument } from "@/hooks/useContractDocument";
import { useContracts } from "@/hooks/useContracts";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { parseCurrencyToNumber, formatCurrency } from "@/lib/currency";
import { calculateRecurrenceTotal } from "@/lib/recurrence";
import { parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Sócios autorizados a assinar como Koraflow
const KORAFLOW_PARTNERS: { name: string; email: string }[] = [
  { name: "James Cardoso Martinelli", email: "james@koraflow.com.br" },
];

// Updated status config with new flow
const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: FileSignature, description: "Contrato anexado sem assinaturas" },
  awaiting_koraflow_signature: { label: "Aguardando Koraflow", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock, description: "Aguardando assinatura da Koraflow" },
  awaiting_client_signature: { label: "Aguardando Cliente", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Send, description: "Enviado para cliente assinar" },
  signed: { label: "Totalmente Assinado", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle, description: "Contrato concluído" },
  expired: { label: "Expirado", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertCircle, description: "Link expirado sem assinatura" },
};

const typeConfig = {
  prestacao_servico: { label: "Prestação de Serviço", color: "bg-slate-500/10 text-slate-500" },
  projeto: { label: "Projeto", color: "bg-indigo-500/10 text-indigo-500" },
  projeto_unico: { label: "Projeto Único", color: "bg-violet-500/10 text-violet-500" },
  consultoria: { label: "Consultoria", color: "bg-amber-500/10 text-amber-500" },
  implantacao_recorrencia: { label: "Impl. + Recorrência", color: "bg-green-500/10 text-green-500" },
};

const recurrenceTypeLabel: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semi_annual: "Semestral",
  annual: "Anual",
};

// ===== Contract vigência helpers =====
type VigenciaStatus = "active" | "expiring_soon" | "critical" | "expired" | "not_set";

function parseContractDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    // Accept ISO or dd/MM/yyyy or "dd mmm yyyy"
    const iso = parseISO(dateStr);
    if (!isNaN(iso.getTime())) return iso;
  } catch { /* noop */ }
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function getDaysUntilExpiration(expiresAt?: string): number | null {
  const d = parseContractDate(expiresAt);
  if (!d) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getVigenciaStatus(contract: Contract): VigenciaStatus {
  if (contract.status !== "signed") return "not_set";
  const days = getDaysUntilExpiration(contract.expiresAt);
  if (days === null) return "not_set";
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "expiring_soon";
  return "active";
}

function getAnniversaryInfo(createdAt?: string): { daysUntil: number; monthsActive: number } | null {
  const d = parseContractDate(createdAt);
  if (!d) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const anniversary = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (anniversary < now) anniversary.setFullYear(anniversary.getFullYear() + 1);
  const daysUntil = Math.round((anniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const monthsActive = Math.max(
    0,
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  );
  return { daysUntil, monthsActive };
}

function formatVigenciaLabel(days: number): string {
  if (days < 0) return `Expirado há ${Math.abs(days)} ${Math.abs(days) === 1 ? "dia" : "dias"}`;
  if (days === 0) return "Expira hoje";
  if (days === 1) return "Expira amanhã";
  if (days <= 30) return `Expira em ${days} dias`;
  if (days <= 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "mês" : "meses"} restantes`;
  }
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "ano" : "anos"} restantes`;
}

// Signature status helper - with fallback to legacy fields
function getSignatureStatus(contract: Contract): {
  status: "draft" | "awaiting_koraflow" | "awaiting_client" | "fully_signed" | "expired";
  label: string;
  color: string;
  icon: typeof Clock;
} {
  if (contract.fullySignedAt || contract.status === "signed") {
    return { status: "fully_signed", label: "Totalmente Assinado", color: "text-green-500", icon: CheckCircle };
  }

  if (contract.status === "expired") {
    return { status: "expired", label: "Link Expirado", color: "text-red-500", icon: AlertCircle };
  }

  // Use koraflow fields or fallback to contractor fields (legacy)
  const koraflowSigned = !!contract.koraflowSignedAt || !!contract.contractorSignedAt;
  const clientSigned = !!contract.clientSignedAt;

  if (!koraflowSigned && !clientSigned) {
    // Check if has document to determine if awaiting signature
    if (contract.documentData || contract.documentStoragePath) {
      return { status: "awaiting_koraflow", label: "Aguardando Koraflow", color: "text-amber-500", icon: Clock };
    }
    return { status: "draft", label: "Rascunho", color: "text-slate-500", icon: FileSignature };
  }

  if (koraflowSigned && !clientSigned) {
    return { status: "awaiting_client", label: "Aguardando Cliente", color: "text-blue-500", icon: Send };
  }

  return { status: "draft", label: "Rascunho", color: "text-slate-500", icon: FileSignature };
}

// Helper to get combined label for contract based on projects
function getContractTypeLabel(contract: Contract, allProjects: Project[]): string {
  if (!contract.projectIds || contract.projectIds.length === 0) {
    return typeConfig[contract.type]?.label || "Contrato";
  }

  const projects = contract.projectIds.map(id => allProjects.find(p => p.id === id)).filter(Boolean) as Project[];

  const billingTypes = new Set(projects.map(p => p.billingType || "projeto"));

  if (billingTypes.size === 1) {
    const billingType = Array.from(billingTypes)[0];
    if (billingType === "implantacao_recorrencia") {
      return "Impl. + Recorrência";
    }
    const projectType = projects[0]?.type || "projeto";
    return typeConfig[projectType]?.label || "Projeto";
  }

  return "Projeto + Impl. + Recorrência";
}

export default function Contratos() {
  const { addContract, updateContract, deleteContract } = useContractMutations();
  const { upload: uploadDocument, getSignedUrl } = useContractDocument();
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const { data: contractData } = useContracts({ search: searchQuery || undefined, pageSize: 500 });
  const contracts = contractData?.contracts ?? [];
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();
  const getClient = (id: string) => clients.find((c) => c.id === id);
  const [vigenciaFilter, setVigenciaFilter] = useState<"all" | VigenciaStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [isKoraflowSignDialogOpen, setIsKoraflowSignDialogOpen] = useState(false);
  const [isSendToClientDialogOpen, setIsSendToClientDialogOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [viewingContractId, setViewingContractId] = useState<string | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [sendingContractId, setSendingContractId] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{ name: string; data: string; type: string } | null>(null);
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Koraflow signature form state
  const [koraflowSignerName, setKoraflowSignerName] = useState("");
  const [koraflowSignerEmail, setKoraflowSignerEmail] = useState("");
  const [koraflowSignatureData, setKoraflowSignatureData] = useState<string | null>(null);

  // Send to client form state
  const [clientEmail, setClientEmail] = useState("");
  const [linkExpirationDays, setLinkExpirationDays] = useState(7);
  const [isSending, setIsSending] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    projectIds: [] as string[],
    value: "", // Mantém para compatibilidade com addContract/updateContract
    implementationValue: "",
    status: "draft" as "draft" | "awaiting_koraflow_signature" | "awaiting_client_signature" | "signed" | "expired",
    type: "prestacao_servico" as "prestacao_servico" | "projeto_unico",
    billingType: "projeto" as "projeto" | "implantacao_recorrencia",
    recurrenceValue: "",
    recurrenceStartDate: "",
    recurrenceType: "" as "" | "monthly" | "quarterly" | "semi_annual" | "annual",
    recurrenceEndDate: "",
    expiresAt: "",
    documentName: "",
    documentData: "",
    documentType: "",
    documentStoragePath: "",
    documentVersion: 0,
    bu: "kora-agents" as BU,
  });

  const editingContract = editingContractId ? contracts.find(c => c.id === editingContractId) : null;
  const viewingContract = viewingContractId ? contracts.find(c => c.id === viewingContractId) : null;
  const signingContract = signingContractId ? contracts.find(c => c.id === signingContractId) : null;
  const sendingContract = sendingContractId ? contracts.find(c => c.id === sendingContractId) : null;

  const filteredContracts = contracts.filter((contract) => {
    const matchesVigencia = vigenciaFilter === "all" || getVigenciaStatus(contract) === vigenciaFilter;
    return matchesVigencia;
  });

  // Alerts: contracts needing attention
  const signedContracts = contracts.filter(c => c.status === "signed");
  const expiringCritical = signedContracts.filter(c => getVigenciaStatus(c) === "critical");
  const expiringSoon = signedContracts.filter(c => getVigenciaStatus(c) === "expiring_soon");
  const anniversariesThisMonth = signedContracts.filter(c => {
    const info = getAnniversaryInfo(c.createdAt);
    return info && info.daysUntil <= 30 && info.monthsActive > 0;
  });

  const openNewDialog = () => {
    setEditingContractId(null);
    setFormData({ title: "", clientId: "", projectIds: [], value: "", implementationValue: "", status: "draft", type: "prestacao_servico", billingType: "projeto", recurrenceValue: "", recurrenceStartDate: "", recurrenceType: "", recurrenceEndDate: "", expiresAt: "", documentName: "", documentData: "", documentType: "", documentStoragePath: "", documentVersion: 0, bu: "kora-agents" });
    setDocumentPreview(null);
    setPendingDocumentFile(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      if (contract.status === "signed" || contract.fullySignedAt) {
        toast.error("Contratos totalmente assinados não podem ser editados");
        return;
      }
      setEditingContractId(contractId);
      setFormData({
        title: contract.title,
        clientId: contract.clientId,
        projectIds: contract.projectIds || [],
        value: contract.implementationValue || contract.value,
        implementationValue: contract.implementationValue || contract.value || "",
        status: contract.status,
        type: contract.type,
        billingType: contract.billingType || "projeto",
        recurrenceValue: contract.recurrenceValue || "",
        recurrenceStartDate: contract.recurrenceStartDate || "",
        recurrenceType: contract.recurrenceType || "",
        recurrenceEndDate: contract.recurrenceEndDate || "",
        expiresAt: contract.expiresAt,
        documentName: contract.documentName || "",
        documentData: contract.documentData || "",
        documentType: contract.documentType || "",
        documentStoragePath: contract.documentStoragePath || "",
        documentVersion: contract.documentVersion ?? 0,
        bu: (Array.isArray(contract.bu) ? contract.bu[0] : contract.bu) || "kora-agents" as BU,
      });
      setPendingDocumentFile(null);
      setDocumentPreview(contract.documentName ? { name: contract.documentName, data: "", type: contract.documentType || "" } : null);
      setIsDialogOpen(true);
    }
  };

  const openViewDialog = (contractId: string) => {
    setViewingContractId(contractId);
    setIsViewDialogOpen(true);
  };

  // Open specific contract from notification deep-link (?contract=<id>)
  useEffect(() => {
    const contractId = searchParams.get("contract");
    if (!contractId || contracts.length === 0) return;
    const exists = contracts.find((c) => c.id === contractId);
    if (exists) openViewDialog(contractId);

  }, [searchParams, contracts]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 20MB.");
        return;
      }
      // Revoke previous object URL to avoid memory leaks
      if (pendingDocumentFile && documentPreview?.data?.startsWith("blob:")) {
        URL.revokeObjectURL(documentPreview.data);
      }
      const objectUrl = URL.createObjectURL(file);
      setPendingDocumentFile(file);
      setFormData(prev => ({
        ...prev,
        documentName: file.name,
        documentData: "",
        documentType: file.type,
        documentStoragePath: "",
        documentVersion: 0,
      }));
      setDocumentPreview({ name: file.name, data: objectUrl, type: file.type });
      toast.success("Documento anexado com sucesso!");
    }
  };

  const removeDocument = () => {
    if (pendingDocumentFile && documentPreview?.data?.startsWith("blob:")) {
      URL.revokeObjectURL(documentPreview.data);
    }
    setPendingDocumentFile(null);
    setFormData(prev => ({ ...prev, documentName: "", documentData: "", documentType: "", documentStoragePath: "", documentVersion: 0 }));
    setDocumentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openDocumentViewer = async (contract: typeof contracts[0]) => {
    const storagePath = contract.signedDocumentStoragePath || contract.documentStoragePath;
    if (storagePath) {
      try {
        const url = await getSignedUrl(storagePath);
        setDocumentPreview({
          name: contract.signedDocumentStoragePath
            ? `${contract.documentName?.replace(/\.[^/.]+$/, "") || "contrato"}_assinado.pdf`
            : contract.documentName || "Documento",
          data: url,
          type: contract.documentType || "application/pdf",
        });
        setIsDocumentViewerOpen(true);
      } catch {
        toast.error("Erro ao carregar documento");
      }
      return;
    }
    const legacyData = contract.signedDocumentData || contract.documentData;
    if (legacyData) {
      setDocumentPreview({
        name: contract.documentName || "Documento",
        data: legacyData,
        type: contract.documentType || ""
      });
      setIsDocumentViewerOpen(true);
    }
  };

  const downloadDocument = async (contract: typeof contracts[0]) => {
    const storagePath = contract.signedDocumentStoragePath || contract.documentStoragePath;
    if (storagePath) {
      try {
        const url = await getSignedUrl(storagePath, 300);
        const link = document.createElement("a");
        link.href = url;
        link.download = contract.signedDocumentStoragePath
          ? `${contract.documentName?.replace(/\.[^/.]+$/, "") || "contrato"}_assinado.pdf`
          : contract.documentName || "contrato";
        link.click();
        toast.success("Download iniciado!");
      } catch {
        toast.error("Erro ao preparar download");
      }
      return;
    }
    // Legacy: base64
    const data = contract.signedDocumentData || contract.documentData;
    if (data) {
      const link = document.createElement("a");
      link.href = data;
      link.download = contract.signedDocumentData
        ? `${contract.documentName?.replace(/\.[^/.]+$/, "") || "contrato"}_assinado.pdf`
        : contract.documentName || "contrato";
      link.click();
      toast.success("Download iniciado!");
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.clientId || !formData.implementationValue) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

    try {
      if (editingContractId) {
        let storagePath = formData.documentStoragePath || undefined;
        let version = formData.documentVersion || 0;

        if (pendingDocumentFile) {
          version = version + 1;
          storagePath = await uploadDocument(editingContractId, pendingDocumentFile, version);
        }

        await updateContract(editingContractId, {
          title: formData.title,
          clientId: formData.clientId,
          projectIds: formData.projectIds,
          value: formData.value,
          status: formData.status,
          type: formData.type,
          billingType: formData.billingType,
          recurrenceValue: formData.recurrenceValue || undefined,
          recurrenceStartDate: formData.recurrenceStartDate || undefined,
          implementationValue: formData.implementationValue || undefined,
          recurrenceType: formData.recurrenceType || undefined,
          recurrenceEndDate: formData.recurrenceEndDate || undefined,
          expiresAt: formData.expiresAt,
          documentName: formData.documentName || undefined,
          documentData: pendingDocumentFile ? null : (formData.documentData || undefined),
          documentType: formData.documentType || undefined,
          documentStoragePath: storagePath,
          documentVersion: version || undefined,
          bu: formData.bu ? [formData.bu] : undefined,
        });
      } else {
        const hasDocument = !!(pendingDocumentFile || formData.documentStoragePath);
        const newContract = await addContract({
          title: formData.title,
          clientId: formData.clientId,
          projectIds: formData.projectIds,
          value: formData.value,
          status: hasDocument ? "awaiting_koraflow_signature" : "draft",
          type: formData.type,
          billingType: formData.billingType,
          recurrenceValue: formData.recurrenceValue || undefined,
          recurrenceStartDate: formData.recurrenceStartDate || undefined,
          implementationValue: formData.implementationValue || undefined,
          recurrenceType: formData.recurrenceType || undefined,
          recurrenceEndDate: formData.recurrenceEndDate || undefined,
          createdAt: today,
          expiresAt: formData.expiresAt,
          documentName: formData.documentName || undefined,
          documentData: undefined,
          documentType: formData.documentType || undefined,
          bu: formData.bu ? [formData.bu] : undefined,
        });

        if (newContract && pendingDocumentFile) {
          const path = await uploadDocument(newContract.id, pendingDocumentFile, 1);
          await updateContract(newContract.id, {
            documentStoragePath: path,
            documentVersion: 1,
          });
        }
      }
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }

    setPendingDocumentFile(null);
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingContractId) {
      deleteContract(deletingContractId);
      setIsDeleteDialogOpen(false);
      setDeletingContractId(null);
    }
  };

  // Open Koraflow sign dialog
  const openKoraflowSignDialog = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setSigningContractId(contractId);
      setKoraflowSignerName("");
      setKoraflowSignerEmail("");
      setKoraflowSignatureData(null);
      setIsKoraflowSignDialogOpen(true);
    }
  };

  // Open send to client dialog
  const openSendToClientDialog = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    const client = contract ? getClient(contract.clientId) : null;
    if (!contract) return;
    if (!contract.koraflowSignedAt && !contract.contractorSignedAt) {
      toast.error("A Koraflow precisa assinar antes de enviar ao cliente");
      return;
    }
    if (client) {
      setSendingContractId(contractId);
      setClientEmail(client.email || "");
      setLinkExpirationDays(7);
      setIsSendToClientDialogOpen(true);
    }
  };

  // Generate signature link
  const generateSignatureLink = (contract: Contract): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/sign/${contract.signatureLinkToken}`;
  };

  // Copy signature link
  const copySignatureLink = (contract: Contract) => {
    const link = generateSignatureLink(contract);
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  // Handle Koraflow signature
  const handleKoraflowSign = async () => {
    if (!koraflowSignerName || !koraflowSignerEmail) {
      toast.error("Selecione o sócio signatário");
      return;
    }

    const authorized = KORAFLOW_PARTNERS.find(
      (p) => p.name === koraflowSignerName && p.email === koraflowSignerEmail,
    );
    if (!authorized) {
      toast.error("Sócio não autorizado a assinar pela Koraflow");
      return;
    }

    if (!koraflowSignatureData) {
      toast.error("Por favor, adicione sua assinatura");
      return;
    }

    if (!signingContract) return;

    const now = new Date().toISOString();

    // Update contract with signature data
    await updateContract(signingContract.id, {
      status: "awaiting_client_signature",
      koraflowSignedAt: now,
      koraflowSignatureData: koraflowSignatureData,
      koraflowSignerName: koraflowSignerName,
      koraflowSignerEmail: koraflowSignerEmail,
    });

    toast.success("Contrato assinado pela Koraflow!");
    setIsKoraflowSignDialogOpen(false);
    setSigningContractId(null);
  };

  // Handle send to client
  const handleSendToClient = async () => {
    if (!clientEmail) {
      toast.error("Informe o e-mail do cliente");
      return;
    }

    if (!sendingContract) return;

    setIsSending(true);

    try {
      // Generate token if not exists
      let token = sendingContract.signatureLinkToken;
      if (!token) {
        token = crypto.randomUUID();
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + linkExpirationDays);

      // Update contract with token and expiration
      await updateContract(sendingContract.id, {
        signatureLinkToken: token,
        signatureLinkExpiresAt: expiresAt.toISOString(),
        signatureSentAt: new Date().toISOString(),
      });

      // Call edge function to send email
      const { error } = await supabase.functions.invoke("signature-notifications", {
        body: {
          action: "send_signature_link",
          contractId: sendingContract.id,
          recipientEmail: clientEmail,
          recipientName: getClient(sendingContract.clientId)?.name,
          signatureLink: generateSignatureLink({ ...sendingContract, signatureLinkToken: token }),
        },
      });

      if (error) {
        logger.error("Error sending email:", error instanceof Error ? error : undefined);
        // Still show success as the contract was updated
        toast.warning("Link gerado, mas houve erro ao enviar o e-mail. Copie o link manualmente.");
      } else {
        toast.success("E-mail enviado para o cliente!");
      }

      setIsSendToClientDialogOpen(false);
      setSendingContractId(null);
    } catch (error) {
      logger.error("Error:", error instanceof Error ? error : undefined);
      toast.error("Erro ao enviar para cliente");
    } finally {
      setIsSending(false);
    }
  };

  const clientProjects = formData.clientId ? projects.filter(p => p.clientId === formData.clientId) : [];

  const selectedProjects = formData.projectIds.map(id => projects.find(p => p.id === id)).filter(Boolean) as Project[];
  const totalProjectValue = selectedProjects.reduce((sum, p) => {
    const value = p.value ? parseCurrencyToNumber(p.value) : 0;
    return sum + value;
  }, 0);

  const totalRecurrenceProjected = React.useMemo(() => {
    if (!formData.expiresAt) return 0;

    return selectedProjects.reduce((sum, project) => {
      if (!project.recurrenceValue || !project.recurrenceStartDate) return sum;

      const recurrenceTotal = calculateRecurrenceTotal(
        project.recurrenceValue,
        project.recurrenceStartDate,
        formData.expiresAt
      );

      return sum + recurrenceTotal;
    }, 0);
  }, [selectedProjects, formData.expiresAt]);

  const totalContractValue = totalProjectValue + totalRecurrenceProjected;

  React.useEffect(() => {
    if (selectedProjects.length > 0) {
      const formattedValue = formatCurrency(totalContractValue);
      const firstProjectBillingType = selectedProjects[0]?.billingType || "projeto";

      setFormData(prev => ({
        ...prev,
        value: formattedValue,
        type: "projeto_unico",
        billingType: firstProjectBillingType
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        value: "",
        type: "prestacao_servico",
        billingType: "projeto"
      }));
    }
  }, [formData.projectIds.join(','), totalContractValue, selectedProjects.length]);

  const totalContractsValue = contracts
    .filter(c => c.status === "signed")
    .reduce((sum, c) => {
      const v = c.projectIds && c.projectIds.length > 0
        ? c.projectIds.reduce((s, pid) => {
          const proj = projects.find(p => p.id === pid);
          return s + (proj?.value ? parseCurrencyToNumber(proj.value) : 0);
        }, 0)
        : parseCurrencyToNumber(c.value || "0");
      return sum + v;
    }, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6">
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <FileSignature className="w-7 h-7 text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Contratos</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Gestão profissional de contratos e assinaturas digitais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground leading-none">Total ativo</p>
                  <p className="font-bold text-foreground">{formatCurrency(totalContractsValue)}</p>
                </div>
              </div>
              <button
                onClick={openNewDialog}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all shadow-glow"
              >
                <Plus className="w-4 h-4" />
                Novo Contrato
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {(expiringCritical.length > 0 || expiringSoon.length > 0 || anniversariesThisMonth.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {expiringCritical.length > 0 && (
              <button
                onClick={() => setVigenciaFilter("critical")}
                className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 text-left hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-600">
                      {expiringCritical.length} {expiringCritical.length === 1 ? "contrato crítico" : "contratos críticos"}
                    </p>
                    <p className="text-xs text-red-500/80 mt-0.5">Expiram em 7 dias ou menos</p>
                  </div>
                </div>
              </button>
            )}
            {expiringSoon.length > 0 && (
              <button
                onClick={() => setVigenciaFilter("expiring_soon")}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 text-left hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-600">
                      {expiringSoon.length} próximos de expirar
                    </p>
                    <p className="text-xs text-amber-500/80 mt-0.5">Expiram em até 30 dias</p>
                  </div>
                </div>
              </button>
            )}
            {anniversariesThisMonth.length > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-muted/10 to-pink-500/5 border border-purple-500/30">
                <div className="flex items-start gap-3">
                  <Cake className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      {anniversariesThisMonth.length} {anniversariesThisMonth.length === 1 ? "aniversário" : "aniversários"} próximos
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">Renovação nos próximos 30 dias</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = contracts.filter(c => c.status === key).length;
            const Icon = config.icon;
            const isActive = count > 0;
            return (
              <div
                key={key}
                className={cn(
                  "group p-4 rounded-xl bg-card border transition-all cursor-default",
                  isActive
                    ? "border-border hover:shadow-md hover:-translate-y-0.5"
                    : "border-border/50 opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", config.color.split(" ")[0])}>
                    <Icon className={cn("w-4 h-4", config.color.split(" ")[1])} />
                  </div>
                  <span className="text-xl font-bold text-foreground leading-none">{count}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">{config.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar contratos..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
            {([
              { v: "all", l: "Todos" },
              { v: "active", l: "Ativos" },
              { v: "expiring_soon", l: "Próximos" },
              { v: "critical", l: "Críticos" },
              { v: "expired", l: "Expirados" },
            ] as const).map((o) => (
              <button
                key={o.v}
                onClick={() => setVigenciaFilter(o.v)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  vigenciaFilter === o.v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <ViewModeToggle modes={["table", "grid"]} currentMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Empty State */}
        {filteredContracts.length === 0 && (
          <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileSignature className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {contracts.length === 0 ? "Nenhum contrato ainda" : "Nenhum contrato encontrado"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {contracts.length === 0
                ? "Comece criando seu primeiro contrato. Você pode anexar documentos e coletar assinaturas digitais."
                : "Tente ajustar os filtros ou busca."}
            </p>
            {contracts.length === 0 && (
              <button
                onClick={openNewDialog}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar primeiro contrato
              </button>
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && filteredContracts.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contrato</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assinaturas</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vigência</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recorrência</th>
                  <th className="text-right px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredContracts.map((contract, index) => {
                  const StatusIcon = statusConfig[contract.status]?.icon || FileSignature;
                  const client = getClient(contract.clientId);
                  const sigStatus = getSignatureStatus(contract);
                  return (
                    <tr
                      key={contract.id}
                      onClick={() => openViewDialog(contract.id)}
                      className="hover:bg-muted/30 transition-colors animate-slide-up cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <FileSignature className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{contract.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ClientAvatar client={client} size="sm" />
                          <span className="text-foreground text-sm">{client?.company || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", (() => {
                          const label = getContractTypeLabel(contract, projects);
                          if (label === "Impl. + Recorrência") return typeConfig.implantacao_recorrencia?.color;
                          if (label === "Projeto") return typeConfig.projeto?.color;
                          if (label === "Consultoria") return typeConfig.consultoria?.color;
                          if (label === "Projeto + Impl. + Recorrência") return "bg-gradient-to-r from-indigo-500/10 to-green-500/10 text-indigo-500 border border-indigo-500/20";
                          return typeConfig.prestacao_servico?.color;
                        })())}>
                          {getContractTypeLabel(contract, projects)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit border", statusConfig[contract.status]?.color || statusConfig.draft.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[contract.status]?.label || "Rascunho"}
                          </span>
                          {contract.bu?.[0] && <BUBadge bu={contract.bu[0]} showLabel={false} />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                            (contract.koraflowSignedAt || contract.contractorSignedAt) ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-500"
                          )} title={(contract.koraflowSignedAt || contract.contractorSignedAt) ? `Koraflow: ${contract.koraflowSignerName || contract.contractorSignerName}` : "Koraflow: Pendente"}>
                            {(contract.koraflowSignedAt || contract.contractorSignedAt) ? <Check className="w-4 h-4" /> : <Building2 className="w-3 h-3" />}
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                            contract.clientSignedAt ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-500"
                          )} title={contract.clientSignedAt ? `Cliente: ${contract.clientSignerName}` : "Cliente: Pendente"}>
                            {contract.clientSignedAt ? <Check className="w-4 h-4" /> : <User className="w-3 h-3" />}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const vigStatus = getVigenciaStatus(contract);
                          const days = getDaysUntilExpiration(contract.expiresAt);
                          if (vigStatus === "not_set" || days === null) {
                            return <span className="text-xs text-muted-foreground">—</span>;
                          }
                          const colorMap: Record<VigenciaStatus, string> = {
                            active: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                            expiring_soon: "text-amber-600 bg-amber-500/10 border-amber-500/20",
                            critical: "text-red-600 bg-red-500/10 border-red-500/20 animate-pulse",
                            expired: "text-slate-500 bg-slate-500/10 border-slate-500/20",
                            not_set: "text-slate-500 bg-slate-500/10 border-slate-500/20",
                          };
                          return (
                            <div className="flex flex-col gap-1">
                              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border w-fit", colorMap[vigStatus])}>
                                <CalendarClock className="w-3 h-3" />
                                {formatVigenciaLabel(days)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                até {contract.expiresAt}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {(() => {
                          if (contract.projectIds && contract.projectIds.length > 0) {
                            const projectsValue = contract.projectIds.reduce((sum, pid) => {
                              const proj = projects.find(p => p.id === pid);
                              return sum + (proj?.value ? parseCurrencyToNumber(proj.value) : 0);
                            }, 0);
                            return formatCurrency(projectsValue);
                          }
                          return contract.value;
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {contract.recurrenceValue ? (
                          <span className="text-sm font-medium text-primary">{contract.recurrenceValue}</span>
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Koraflow sign button - must sign before sending to client */}
                          {!contract.koraflowSignedAt && !contract.contractorSignedAt && (
                            <button onClick={() => openKoraflowSignDialog(contract.id)} className="p-2 rounded-lg hover:bg-amber-500/10 transition-colors" title="Assinar como Koraflow">
                              <PenTool className="w-4 h-4 text-amber-500" />
                            </button>
                          )}
                          {/* Send to client button - show if Koraflow signed but client hasn't */}
                          {(contract.koraflowSignedAt || contract.contractorSignedAt) && !contract.clientSignedAt && (
                            <button onClick={() => openSendToClientDialog(contract.id)} className="p-2 rounded-lg hover:bg-primary/10 transition-colors" title="Enviar para cliente">
                              <Send className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          {/* Copy link button */}
                          {contract.signatureLinkToken && !contract.clientSignedAt && (
                            <button onClick={() => copySignatureLink(contract)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Copiar link de assinatura">
                              <Link2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                          <button onClick={() => openViewDialog(contract.id)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Visualizar">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {(contract.documentData || contract.signedDocumentData || contract.documentStoragePath || contract.signedDocumentStoragePath) && (
                            <button onClick={() => downloadDocument(contract)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Download">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                          <ActionMenu items={[
                            ...(contract.status !== "signed" && !contract.fullySignedAt
                              ? [{ label: "Editar", icon: Edit, onClick: () => openEditDialog(contract.id) }]
                              : []),
                            { label: "Excluir", icon: Trash2, onClick: () => { setDeletingContractId(contract.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && filteredContracts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract, index) => {
              const StatusIcon = statusConfig[contract.status]?.icon || FileSignature;
              const client = getClient(contract.clientId);
              const sigStatus = getSignatureStatus(contract);
              return (
                <div
                  key={contract.id}
                  onClick={() => openViewDialog(contract.id)}
                  className="group p-5 rounded-xl bg-card border border-border hover:border-primary/30 shadow-soft hover:shadow-lg hover:-translate-y-0.5 transition-all animate-scale-in cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSignature className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={[
                        { label: "Visualizar", icon: Eye, onClick: () => openViewDialog(contract.id) },
                        ...(contract.status !== "signed" && !contract.fullySignedAt
                          ? [{ label: "Editar", icon: Edit, onClick: () => openEditDialog(contract.id) }]
                          : []),
                        { label: "Excluir", icon: Trash2, onClick: () => { setDeletingContractId(contract.id); setIsDeleteDialogOpen(true); }, variant: "destructive" },
                      ]} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{contract.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <ClientAvatar client={client} size="xs" />
                    <p className="text-sm text-muted-foreground">{client?.company || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={cn("inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", statusConfig[contract.status]?.color || statusConfig.draft.color)}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusConfig[contract.status]?.label || "Rascunho"}
                    </span>
                    {contract.bu?.[0] && <BUBadge bu={contract.bu[0]} />}
                  </div>

                  {/* Signature Status */}
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/30">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                        (contract.koraflowSignedAt || contract.contractorSignedAt) ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-500"
                      )}>
                        {(contract.koraflowSignedAt || contract.contractorSignedAt) ? <Check className="w-3 h-3" /> : <Building2 className="w-2.5 h-2.5" />}
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                        contract.clientSignedAt ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-500"
                      )}>
                        {contract.clientSignedAt ? <Check className="w-3 h-3" /> : <User className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <span className={cn("text-xs", sigStatus.color)}>{sigStatus.label}</span>
                  </div>

                  <p className="text-xl font-bold text-foreground mb-3">
                    {(() => {
                      if (contract.projectIds && contract.projectIds.length > 0) {
                        const projectsValue = contract.projectIds.reduce((sum, pid) => {
                          const proj = projects.find(p => p.id === pid);
                          return sum + (proj?.value ? parseCurrencyToNumber(proj.value) : 0);
                        }, 0);
                        return formatCurrency(projectsValue);
                      }
                      return contract.value;
                    })()}
                  </p>

                  <div className="pt-3 border-t border-border space-y-2">
                    {(() => {
                      const vigStatus = getVigenciaStatus(contract);
                      const days = getDaysUntilExpiration(contract.expiresAt);
                      if (vigStatus === "not_set" || days === null) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            Validade: {contract.expiresAt || "—"}
                          </p>
                        );
                      }
                      const colorMap: Record<VigenciaStatus, string> = {
                        active: "text-emerald-600 bg-emerald-500/10",
                        expiring_soon: "text-amber-600 bg-amber-500/10",
                        critical: "text-red-600 bg-red-500/10 animate-pulse",
                        expired: "text-slate-500 bg-slate-500/10",
                        not_set: "text-slate-500 bg-slate-500/10",
                      };
                      return (
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", colorMap[vigStatus])}>
                            <CalendarClock className="w-3 h-3" />
                            {formatVigenciaLabel(days)}
                          </span>
                          <span className="text-xs text-muted-foreground">até {contract.expiresAt}</span>
                        </div>
                      );
                    })()}
                    {(() => {
                      const anniv = getAnniversaryInfo(contract.createdAt);
                      if (!anniv || anniv.monthsActive === 0) return null;
                      return (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Cake className="w-3 h-3" />
                          <span>
                            {anniv.monthsActive} {anniv.monthsActive === 1 ? "mês" : "meses"} ativo
                            {anniv.daysUntil <= 30 && ` • aniversário em ${anniv.daysUntil}d`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Action buttons for grid view */}
                  <div className="pt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {!contract.koraflowSignedAt && !contract.contractorSignedAt && (
                      <button
                        onClick={() => openKoraflowSignDialog(contract.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors text-sm font-medium"
                      >
                        <PenTool className="w-4 h-4" />
                        Assinar
                      </button>
                    )}
                    {(contract.koraflowSignedAt || contract.contractorSignedAt) && !contract.clientSignedAt && (
                      <button
                        onClick={() => openSendToClientDialog(contract.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary600 hover:bg-primary/20 transition-colors text-sm font-medium"
                      >
                        <Send className="w-4 h-4" />
                        Enviar
                      </button>
                    )}
                    {contract.signatureLinkToken && !contract.clientSignedAt && (
                      <button
                        onClick={() => copySignatureLink(contract)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-sm font-medium"
                      >
                        <Link2 className="w-4 h-4" />
                        Copiar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título do contrato" className="bg-input border-border" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value, projectIds: [] })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.company} - {client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.clientId && (
              <div className="space-y-2">
                <Label htmlFor="projectIds">Projetos</Label>
                {clientProjects.length > 0 ? (
                  <div className="space-y-3">
                    <MultiSelect
                      options={clientProjects.map(p => ({ value: p.id, label: p.name }))}
                      value={formData.projectIds}
                      onChange={(ids) => setFormData({ ...formData, projectIds: ids })}
                      placeholder="Selecione um ou mais projetos"
                    />
                    {selectedProjects.length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                        <p className="text-sm font-medium text-foreground">Resumo dos Projetos Selecionados:</p>
                        {selectedProjects.map(project => (
                          <div key={project.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{project.name}</span>
                            <span className="font-medium">{project.value || "R$ 0,00"}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-border flex justify-between font-medium">
                          <span>Total</span>
                          <span>{formatCurrency(totalContractValue)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum projeto encontrado para este cliente</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="implementationValue">Valor Fechado</Label>
              <CurrencyInput
                id="implementationValue"
                value={formData.implementationValue}
                onChange={(value) => setFormData({ ...formData, implementationValue: value, value })}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrenceType">Recorrência</Label>
              <Select value={formData.recurrenceType || "none"} onValueChange={(value) => setFormData({ ...formData, recurrenceType: value === "none" ? "" : value })}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Sem recorrência" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="none">Sem recorrência</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="semi_annual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recurrenceType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="recurrenceValue">Valor da Recorrência *</Label>
                  <CurrencyInput
                    id="recurrenceValue"
                    value={formData.recurrenceValue}
                    onChange={(value) => setFormData({ ...formData, recurrenceValue: value })}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceStartDate">Data de Início da Recorrência</Label>
                  <DatePicker
                    value={formData.recurrenceStartDate}
                    onChange={(date) => setFormData({ ...formData, recurrenceStartDate: date })}
                    placeholder="Selecione a data de início"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">Data de Término da Recorrência (Opcional)</Label>
                  <DatePicker
                    value={formData.recurrenceEndDate}
                    onChange={(date) => setFormData({ ...formData, recurrenceEndDate: date })}
                    placeholder="Selecione a data de término"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Data de Validade *</Label>
              <DatePicker
                value={formData.expiresAt}
                onChange={(date) => setFormData({ ...formData, expiresAt: date })}
                placeholder="Selecione a data de validade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bu">BU</Label>
              <BUSelect value={formData.bu} onChange={(bu) => setFormData({ ...formData, bu })} />
            </div>

            <div className="space-y-2">
              <Label>Documento do Contrato</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {documentPreview ? "Trocar arquivo" : "Anexar documento"}
                </button>
                {documentPreview && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm truncate max-w-[150px]">{documentPreview.name}</span>
                    <button onClick={removeDocument} className="p-1 hover:bg-muted rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {isSaving ? (pendingDocumentFile ? "Enviando arquivo..." : "Salvando...") : (editingContract ? "Salvar" : "Criar Contrato")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Contract Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle className="text-foreground">{viewingContract?.title}</DialogTitle>
            <DialogDescription>Detalhes do contrato</DialogDescription>
          </DialogHeader>
          {viewingContract && (
            <DialogBody className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border", statusConfig[viewingContract.status]?.color || statusConfig.draft.color)}>
                  {React.createElement(statusConfig[viewingContract.status]?.icon || FileSignature, { className: "w-4 h-4" })}
                  {statusConfig[viewingContract.status]?.label || "Rascunho"}
                </span>
                <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium", typeConfig[viewingContract.type]?.color || typeConfig.prestacao_servico.color)}>
                  {getContractTypeLabel(viewingContract, projects)}
                </span>
                {viewingContract.bu?.[0] && <BUBadge bu={viewingContract.bu[0]} size="md" />}
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                  <p className="font-medium">{getClient(viewingContract.clientId)?.company || "—"}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">Valor</p>
                  <p className="font-medium text-lg">{viewingContract.value}</p>
                </div>
              </div>

              {/* Signature Status */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Status das Assinaturas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn(
                    "p-4 rounded-lg border-2 transition-colors",
                    viewingContract.koraflowSignedAt ? "border-green-500 bg-green-500/5" : "border-dashed border-slate-300"
                  )}>
                    <div className="flex items-center gap-3">
                      {viewingContract.koraflowSignedAt ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Koraflow</p>
                        {viewingContract.koraflowSignedAt ? (
                          <p className="text-sm text-green-600">
                            Assinado em {viewingContract.koraflowSignedAt}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aguardando assinatura</p>
                        )}
                        {viewingContract.koraflowSignerName && (
                          <p className="text-xs text-muted-foreground">{viewingContract.koraflowSignerName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "p-4 rounded-lg border-2 transition-colors",
                    viewingContract.clientSignedAt ? "border-green-500 bg-green-500/5" : "border-dashed border-slate-300"
                  )}>
                    <div className="flex items-center gap-3">
                      {viewingContract.clientSignedAt ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{getClient(viewingContract.clientId)?.company || "Cliente"}</p>
                        {viewingContract.clientSignedAt ? (
                          <p className="text-sm text-green-600">
                            Assinado em {viewingContract.clientSignedAt}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aguardando assinatura</p>
                        )}
                        {viewingContract.clientSignerName && (
                          <p className="text-xs text-muted-foreground">{viewingContract.clientSignerName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Actions */}
              {!viewingContract.fullySignedAt && (
                <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Próximos passos
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!viewingContract.koraflowSignedAt && (
                      <Button
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          openKoraflowSignDialog(viewingContract.id);
                        }}
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        Assinar como Koraflow
                      </Button>
                    )}
                    {viewingContract.koraflowSignedAt && !viewingContract.clientSignedAt && !viewingContract.signatureLinkToken && (
                      <Button
                        className="flex-1 bg-primary hover:bg-primary text-white"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          openSendToClientDialog(viewingContract.id);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar para cliente
                      </Button>
                    )}
                    {viewingContract.signatureLinkToken && !viewingContract.clientSignedAt && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => copySignatureLink(viewingContract)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar link do cliente
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Signature Link */}
              {viewingContract.signatureLinkToken && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Link de Assinatura</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generateSignatureLink(viewingContract)}
                      readOnly
                      className="bg-input border-border text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={() => copySignatureLink(viewingContract)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {viewingContract.signatureLinkExpiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expira em: {new Date(viewingContract.signatureLinkExpiresAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              )}

              {/* Recorrência */}
              {viewingContract.recurrenceType && (
                <div className="pt-4 border-t border-border space-y-3">
                  <h4 className="font-medium text-foreground">Recorrência</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">{recurrenceTypeLabel[viewingContract.recurrenceType] || viewingContract.recurrenceType}</p>
                    </div>
                    {viewingContract.recurrenceValue && (
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-medium">{viewingContract.recurrenceValue}</p>
                      </div>
                    )}
                    {viewingContract.recurrenceStartDate && (
                      <div>
                        <p className="text-muted-foreground">Início</p>
                        <p className="font-medium">{viewingContract.recurrenceStartDate}</p>
                      </div>
                    )}
                    {viewingContract.recurrenceEndDate && (
                      <div>
                        <p className="text-muted-foreground">Término</p>
                        <p className="font-medium">{viewingContract.recurrenceEndDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{viewingContract.createdAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validade</p>
                  <p className="font-medium">{viewingContract.expiresAt}</p>
                </div>
                {viewingContract.fullySignedAt && (
                  <div>
                    <p className="text-muted-foreground">Totalmente assinado em</p>
                    <p className="font-medium text-green-500">{viewingContract.fullySignedAt}</p>
                  </div>
                )}
              </div>

              {/* Document */}
              {(viewingContract.documentData || viewingContract.signedDocumentData || viewingContract.documentStoragePath || viewingContract.signedDocumentStoragePath) && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {(viewingContract.signedDocumentData || viewingContract.signedDocumentStoragePath) ? `${viewingContract.documentName?.replace(/\.[^/.]+$/, '')}_assinado.pdf` : viewingContract.documentName}
                      </span>
                      {(viewingContract.signedDocumentData || viewingContract.signedDocumentStoragePath) && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">Assinado</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDocumentViewer(viewingContract)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadDocument(viewingContract)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>

      {/* Koraflow Sign Dialog */}
      <Dialog open={isKoraflowSignDialogOpen} onOpenChange={setIsKoraflowSignDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-3xl mx-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-foreground">Assinar como Koraflow</DialogTitle>
                <DialogDescription>
                  Preencha seus dados e adicione sua assinatura
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogBody className="space-y-5 py-4">
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-700">
              <strong>Sócio signatário:</strong> apenas sócios autorizados podem assinar pela Koraflow.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="koraflowName">Sócio *</Label>
                <Select
                  value={koraflowSignerName}
                  onValueChange={(v) => {
                    setKoraflowSignerName(v);
                    const partner = KORAFLOW_PARTNERS.find((p) => p.name === v);
                    if (partner) setKoraflowSignerEmail(partner.email);
                  }}
                >
                  <SelectTrigger id="koraflowName">
                    <SelectValue placeholder="Selecione um sócio" />
                  </SelectTrigger>
                  <SelectContent>
                    {KORAFLOW_PARTNERS.map((p) => (
                      <SelectItem key={p.email} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="koraflowEmail">E-mail *</Label>
                <Input
                  id="koraflowEmail"
                  type="email"
                  value={koraflowSignerEmail}
                  readOnly
                  className="bg-muted/40"
                  placeholder="Preenchido ao selecionar o sócio"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assinatura *</Label>
                {koraflowSignatureData && (
                  <div className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Assinatura capturada
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-border bg-slate-50/50 p-4">
                <SignaturePadPro
                  initialName={koraflowSignerName}
                  onSave={(dataUrl) => setKoraflowSignatureData(dataUrl)}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-blue-500/20">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-muted-foreground">Validade Jurídica</p>
                <p className="text-muted-foreground text-xs">
                  Sua assinatura será registrada com data, hora e IP para garantir a autenticidade.
                </p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKoraflowSignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleKoraflowSign}
              disabled={!koraflowSignatureData || !koraflowSignerName || !koraflowSignerEmail}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Client Dialog */}
      <Dialog open={isSendToClientDialogOpen} onOpenChange={setIsSendToClientDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="text-foreground">Enviar para Assinatura do Cliente</DialogTitle>
            <DialogDescription>
              O cliente receberá um e-mail com o link para assinar o contrato
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">E-mail do Cliente *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="email@cliente.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Expiração do Link</Label>
              <Select value={linkExpirationDays.toString()} onValueChange={(v) => setLinkExpirationDays(parseInt(v))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="7">7 dias (padrão)</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sendingContract && (
              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <p className="text-sm font-medium text-foreground">Resumo:</p>
                <p className="text-sm text-muted-foreground">Contrato: {sendingContract.title}</p>
                <p className="text-sm text-muted-foreground">Cliente: {getClient(sendingContract.clientId)?.company}</p>
                <p className="text-sm text-muted-foreground">Valor: {sendingContract.value}</p>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
              <Mail className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">E-mail Automático</p>
                <p className="text-muted-foreground">
                  O cliente receberá um e-mail com o link seguro para assinar o contrato.
                </p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendToClientDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendToClient} disabled={isSending || !clientEmail}>
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para Cliente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{documentPreview?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {documentPreview?.type.includes("pdf") ? (
              <iframe
                src={documentPreview.data}
                className="w-full h-[70vh]"
                title="Document Preview"
              />
            ) : documentPreview?.type.includes("image") ? (
              <img src={documentPreview.data} alt="Document" className="max-w-full" />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Visualização não disponível para este tipo de documento
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Contrato"
        description="Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AppLayout>
  );
}
