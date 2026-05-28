import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAllContracts } from "@/hooks/useContracts";
import { useAllClients } from "@/hooks/useClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, FileSignature, Search } from "lucide-react";
import { format, differenceInDays, isValid } from "date-fns";

const STATUS_CONFIG = {
  draft: {
    label: "Rascunho",
    cardColor: "text-muted-foreground",
    badge: "bg-muted/50 text-muted-foreground border-muted",
  },
  awaiting_koraflow_signature: {
    label: "Ag. Koraflow",
    cardColor: "text-amber-500",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  awaiting_client_signature: {
    label: "Ag. Cliente",
    cardColor: "text-blue-500",
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  signed: {
    label: "Assinado",
    cardColor: "text-green-500",
    badge: "bg-green-500/10 text-green-500 border-green-500/30",
  },
  expired: {
    label: "Expirado",
    cardColor: "text-red-500",
    badge: "bg-red-500/10 text-red-500 border-red-500/30",
  },
} as const;

const TYPE_LABELS: Record<string, string> = {
  prestacao_servico: "Prestação de Serviço",
  projeto_unico: "Projeto Único",
};

function getVigenciaInfo(expiresAt: string): { label: string; className: string } {
  const date = new Date(expiresAt);
  if (!isValid(date)) return { label: "—", className: "text-muted-foreground" };
  const days = differenceInDays(date, new Date());
  if (days < 0) return { label: "Expirado", className: "text-red-500" };
  if (days <= 7) return { label: `${days}d restantes`, className: "text-red-500 font-semibold" };
  if (days <= 30) return { label: `${days}d restantes`, className: "text-amber-500" };
  return { label: format(date, "dd/MM/yyyy"), className: "text-muted-foreground" };
}

export function EmpresaContratos() {
  const navigate = useNavigate();
  const { data: contracts = [], isLoading } = useAllContracts();
  const { data: clients = [] } = useAllClients();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [clients]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      draft: 0,
      awaiting_koraflow_signature: 0,
      awaiting_client_signature: 0,
      signed: 0,
      expired: 0,
    };
    contracts.forEach((c) => {
      if (c.status in counts) counts[c.status]++;
    });
    return counts;
  }, [contracts]);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const clientName = clientMap[c.clientId] || "";
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        clientName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [contracts, search, filterStatus, clientMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Contratos</h2>
          <p className="text-sm text-muted-foreground">
            Visão consolidada de todos os contratos da empresa
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/contratos")}>
          <ExternalLink className="w-4 h-4" />
          Gerenciar Contratos
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
          const count = statusCounts[key] ?? 0;
          const isActive = filterStatus === key;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-colors ${isActive ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
              onClick={() => setFilterStatus(isActive ? "all" : key)}
            >
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{cfg.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className={`text-2xl font-bold ${cfg.cardColor}`}>{count}</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {count === 1 ? "contrato" : "contratos"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contrato ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Nenhum contrato encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((contract) => {
                  const cfg = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG];
                  const vigencia = contract.expiresAt
                    ? getVigenciaInfo(contract.expiresAt)
                    : null;
                  return (
                    <TableRow key={contract.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{contract.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {clientMap[contract.clientId] || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {TYPE_LABELS[contract.type] ?? contract.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg?.badge}>
                          {cfg?.label || contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vigencia ? (
                          <span className={`text-sm ${vigencia.className}`}>{vigencia.label}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {contract.value || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => navigate("/contratos")}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Gerenciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
