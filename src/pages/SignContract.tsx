import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileSignature,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  PenTool,
  RefreshCw,
  Shield,
  User,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SignaturePadPro } from "@/components/signature/SignaturePadPro";

interface ContractData {
  id: string;
  title: string;
  value: string;
  expires_at: string;
  document_name?: string;
  document_data?: string;
  document_type?: string;
  document_storage_path?: string;
  signed_document_storage_path?: string;
  signature_link_token?: string;
  koraflow_signed_at?: string;
  koraflow_signer_name?: string;
  koraflow_signature_data?: string;
  koraflow_signer_email?: string;
  client_signed_at?: string;
  fully_signed_at?: string;
  signature_link_expires_at?: string;
  client_id: string;
  contractor_signed_at?: string;
  contractor_signer_name?: string;
  contractor_signature_data?: string;
  contractor_signer_email?: string;
  clients: {
    company: string;
    name: string;
    email: string;
  };
}

type SignatureStatus = "loading" | "ready" | "signed" | "expired" | "error" | "not_ready";
type Step = "review" | "identify" | "sign" | "confirm";

function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  return true;
}

function formatCPF(value: string): string {
  const n = value.replace(/[^\d]/g, "");
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
}

const STEPS: { id: Step; label: string; icon: typeof FileText }[] = [
  { id: "review", label: "Revisar", icon: FileText },
  { id: "identify", label: "Identificar", icon: User },
  { id: "sign", label: "Assinar", icon: PenTool },
  { id: "confirm", label: "Confirmar", icon: BadgeCheck },
];

export default function SignContract() {
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<SignatureStatus>("loading");
  const [contract, setContract] = useState<ContractData | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("review");

  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerCpf, setSignerCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadContract();
  }, [token]);

  const loadContract = async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke("external-db", {
        body: {
          action: "select",
          table: "contracts",
          filters: { signature_link_token: token },
        },
      });

      if (error || !result?.data || result.data.length === 0) {
        setStatus("error");
        return;
      }

      const data = result.data[0];

      let clientData = null;
      if (data.client_id) {
        const { data: clientResult } = await supabase.functions.invoke("external-db", {
          body: { action: "select", table: "clients", filters: { id: data.client_id } },
        });
        if (clientResult?.data && clientResult.data.length > 0) clientData = clientResult.data[0];
      }

      const contractWithClient = {
        ...data,
        clients: clientData
          ? { company: clientData.company, name: clientData.name, email: clientData.email }
          : null,
      };

      setContract(contractWithClient as unknown as ContractData);

      if (data.client_signed_at) {
        setStatus("signed");
        return;
      }

      const koraflowSigned = data.koraflow_signed_at || data.contractor_signed_at;
      if (!koraflowSigned) {
        setStatus("not_ready");
        return;
      }

      if (data.signature_link_expires_at && new Date(data.signature_link_expires_at) < new Date()) {
        setStatus("expired");
        return;
      }

      setStatus("ready");
      if (data.clients) {
        setSignerName(data.clients.name || "");
        setSignerEmail(data.clients.email || "");
      }

      // Resolve document URL: use storage signed URL if available, fall back to base64
      const storagePath = data.signed_document_storage_path || data.document_storage_path;
      if (storagePath && token) {
        try {
          const { data: urlResult } = await supabase.functions.invoke("external-db", {
            body: { action: "get_document_url", table: "contracts", token },
          });
          if (urlResult?.signedUrl) setDocumentUrl(urlResult.signedUrl);
        } catch {
          // Fallback to base64 below
        }
      }
      if (!documentUrl && data.document_data) {
        setDocumentUrl(data.document_data);
      }
    } catch (err) {
      console.error("Error loading contract:", err);
      setStatus("error");
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setSignerCpf(formatted);
    if (formatted.length === 14) {
      setCpfError(validateCPF(formatted) ? "" : "CPF inválido");
    } else {
      setCpfError("");
    }
  };

  const canAdvanceFromIdentify =
    !!signerName && !!signerEmail && !!signerCpf && validateCPF(signerCpf) && acceptTerms;

  const handleSign = async () => {
    if (!signatureData) {
      toast.error("Por favor, adicione sua assinatura");
      return;
    }
    if (!contract) {
      toast.error("Contrato não encontrado");
      return;
    }
    setIsSigning(true);
    try {
      const now = new Date().toISOString();
      const koraflowSignatureData =
        contract.koraflow_signature_data || contract.contractor_signature_data;
      const koraflowSignerName =
        contract.koraflow_signer_name || contract.contractor_signer_name || "Koraflow";
      const koraflowSignerEmail =
        contract.koraflow_signer_email || contract.contractor_signer_email || "contato@koraflow.com.br";
      const koraflowSignedAt = contract.koraflow_signed_at || contract.contractor_signed_at || now;

      let signedDocumentData = contract.document_data;

      if (contract.document_data) {
        const pdfBase64 = contract.document_data
          .replace(/^data:application\/pdf;base64,/, "")
          .replace(/^data:application\/octet-stream;base64,/, "");

        const { data: embedResult, error: embedError } = await supabase.functions.invoke(
          "embed-signature",
          {
            body: {
              pdfBase64,
              contractTitle: contract.title,
              koraflowSignature: {
                imageData: koraflowSignatureData,
                signerName: koraflowSignerName,
                signerEmail: koraflowSignerEmail,
                signedAt: koraflowSignedAt,
              },
              clientSignature: {
                imageData: signatureData,
                signerName,
                signerEmail,
                signedAt: now,
                cpf: signerCpf.replace(/[^\d]/g, ""),
              },
              sendEmail: { to: signerEmail, fromAlias: "contratos@koraflow.com.br" },
            },
          }
        );

        if (!embedError && embedResult?.signedPdfBase64) {
          signedDocumentData = `data:application/pdf;base64,${embedResult.signedPdfBase64}`;
        }
      }

      const updateData: Record<string, unknown> = {
        client_signed_at: now,
        client_signature_data: signatureData,
        client_signer_name: signerName,
        client_signer_email: signerEmail,
        status: "signed",
        fully_signed_at: now,
        client_cpf: signerCpf.replace(/[^\d]/g, ""),
      };
      if (signedDocumentData) updateData.document_data = signedDocumentData;

      const { error } = await supabase.functions.invoke("external-db", {
        body: { action: "update", table: "contracts", data: updateData, id: contract.id },
      });
      if (error) throw error;

      setStatus("signed");
      setCurrentStep("confirm");
      toast.success("Contrato assinado com sucesso!");

      await supabase.functions.invoke("signature-notifications", {
        body: { action: "notify_fully_signed", contractId: contract.id },
      });

      loadContract();
    } catch (err) {
      console.error("Error signing contract:", err);
      toast.error("Erro ao assinar contrato");
    } finally {
      setIsSigning(false);
    }
  };

  const downloadContract = () => {
    const url = documentUrl;
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = contract?.document_name || "contrato";
    link.click();
  };

  // ====== Loading / Error / Expired / Not ready states ======
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FileSignature className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (status === "error" || status === "expired" || status === "not_ready") {
    const errorMap = {
      error: { title: "Link Inválido", msg: "Verifique se o link foi copiado corretamente." },
      expired: { title: "Link Expirado", msg: "Entre em contato com a Koraflow para um novo link." },
      not_ready: {
        title: "Aguardando Koraflow",
        msg: "Este contrato ainda será assinado pela Koraflow antes de você.",
      },
    };
    const e = errorMap[status as keyof typeof errorMap];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{e.title}</h3>
            <p className="text-muted-foreground">{e.msg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ====== Signed state ======
  if (status === "signed" && contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-primary/10 flex items-center justify-center p-4">
        <Card className="max-w-xl w-full border-emerald-200 shadow-xl">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <BadgeCheck className="w-14 h-14 text-emerald-500" strokeWidth={2.5} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-emerald-700 mb-2">Contrato assinado!</h1>
            <p className="text-muted-foreground mb-6">
              Todas as partes assinaram este contrato em
              <br />
              <strong className="text-foreground">
                {contract.fully_signed_at
                  ? format(new Date(contract.fully_signed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })
                  : ""}
              </strong>
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Contrato:</span>
                <span className="font-medium">{contract.title}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">{contract.value}</span>
              </div>
            </div>

            <Button onClick={downloadContract} size="lg" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar contrato assinado
            </Button>

            <p className="text-xs text-muted-foreground mt-6">
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              Documento com validade jurídica — MP 2.200-2/2001
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ====== Ready state — Stepper flow ======
  if (!contract) return null;
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/10/30">
      {/* Top bar */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSignature className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assinatura Digital</p>
              <p className="font-semibold text-sm">Koraflow</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>Conexão segura • Validade jurídica</span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentStepIndex;
            const isDone = i < currentStepIndex;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all",
                      isActive && "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                      isDone && "border-emerald-500 bg-emerald-500 text-white",
                      !isActive && !isDone && "border-border bg-white text-muted-foreground"
                    )}
                  >
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isActive && "text-primary",
                      isDone && "text-emerald-600",
                      !isActive && !isDone && "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 transition-colors -mt-6",
                      i < currentStepIndex ? "bg-emerald-500" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step: Review */}
        {currentStep === "review" && (
          <Card className="shadow-sm animate-fade-in">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">{contract.title}</h2>
                <p className="text-muted-foreground text-sm">
                  Revise os detalhes do contrato antes de continuar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Empresa
                  </div>
                  <p className="font-semibold">{contract.clients?.company}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <User className="w-3.5 h-3.5" />
                    Responsável
                  </div>
                  <p className="font-semibold">{contract.clients?.name}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Validade
                  </div>
                  <p className="font-semibold">
                    {contract.expires_at
                      ? format(new Date(contract.expires_at), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <FileSignature className="w-3.5 h-3.5" />
                    Valor
                  </div>
                  <p className="font-bold text-primary text-lg">{contract.value}</p>
                </div>
              </div>

              {contract.koraflow_signed_at && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-6 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-700">Já assinado pela Koraflow</p>
                    <p className="text-emerald-600/80 text-xs">
                      {contract.koraflow_signer_name} •{" "}
                      {format(new Date(contract.koraflow_signed_at), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                </div>
              )}

              {(contract.document_data || contract.document_storage_path || documentUrl) && (
                <div className="p-4 rounded-xl border-2 border-dashed border-border mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">{contract.document_name || "Contrato.pdf"}</p>
                      <p className="text-xs text-muted-foreground">Documento do contrato</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowDocument(true)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadContract}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button size="lg" onClick={() => setCurrentStep("identify")}>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Identify */}
        {currentStep === "identify" && (
          <Card className="shadow-sm animate-fade-in">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Identificação do signatário</h2>
                <p className="text-muted-foreground text-sm">
                  Confirme seus dados para assinar o contrato
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={signerCpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={cpfError ? "border-red-500" : ""}
                  />
                  {cpfError && <p className="text-sm text-red-500">{cpfError}</p>}
                </div>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-primary"
                  />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Concordo em assinar eletronicamente</p>
                    <p className="text-muted-foreground text-xs">
                      Confirmo que li o contrato e aceito assinar de forma eletrônica. Minha assinatura
                      terá a mesma validade de uma assinatura manuscrita, conforme MP 2.200-2/2001.
                    </p>
                  </div>
                </label>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Shield className="w-5 h-5 text-primary600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary900">Seus dados estão seguros</p>
                    <p className="text-primary700/80 text-xs mt-0.5">
                      Registramos IP, data/hora e identificação para garantir autenticidade.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep("review")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  size="lg"
                  onClick={() => setCurrentStep("sign")}
                  disabled={!canAdvanceFromIdentify}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Sign */}
        {currentStep === "sign" && (
          <Card className="shadow-sm animate-fade-in">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Sua assinatura</h2>
                <p className="text-muted-foreground text-sm">
                  Escolha como deseja assinar — desenhar, digitar ou enviar imagem
                </p>
              </div>

              <div className="space-y-4">
                {signatureData && (
                  <div className="flex items-center justify-center gap-1 text-sm text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                    Assinatura capturada
                  </div>
                )}
                <SignaturePadPro
                  onSave={(d) => setSignatureData(d)}
                  initialName={signerName}
                />
                <div className="p-4 rounded-xl bg-slate-50 border border-border text-sm space-y-1">
                  <p><strong>Nome:</strong> {signerName}</p>
                  <p><strong>CPF:</strong> {signerCpf}</p>
                  <p><strong>E-mail:</strong> {signerEmail}</p>
                  <p><strong>Data:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep("identify")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  size="lg"
                  onClick={handleSign}
                  disabled={!signatureData || isSigning}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSigning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="w-4 h-4 mr-2" />
                      Finalizar assinatura
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Document Viewer */}
      <Dialog open={showDocument} onOpenChange={setShowDocument}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{contract?.document_name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[75vh]">
            {documentUrl ? (
              contract?.document_type?.includes("image") ? (
                <img src={documentUrl} alt="Documento" className="max-w-full" />
              ) : (
                <iframe src={documentUrl} className="w-full h-[75vh]" title="Documento" />
              )
            ) : (
              <p className="text-center text-muted-foreground py-8">Visualização não disponível</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center py-8 text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Assinatura eletrônica • Koraflow • MP 2.200-2/2001
        </p>
      </div>
    </div>
  );
}
