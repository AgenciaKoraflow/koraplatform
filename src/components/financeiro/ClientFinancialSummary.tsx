import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCurrencyToNumber } from "@/lib/currency";
import type { Client, Contract } from "@/types/data";
import type { FinancialTransaction } from "@/types/financial";

interface ClientFinancialSummaryProps {
  clients: Client[];
  contracts: Contract[];
  transactions: FinancialTransaction[];
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getContractTotal(contract: Contract): number {
  const main = parseCurrencyToNumber(contract.value);

  if (contract.billingType === "implantacao_recorrencia" && contract.recurrenceValue) {
    const recurrenceMonthly = parseCurrencyToNumber(contract.recurrenceValue);
    return main + recurrenceMonthly * 12;
  }

  return main;
}

export function ClientFinancialSummary({
  clients,
  contracts,
  transactions,
}: ClientFinancialSummaryProps) {
  const rows = clients
    .map((client) => {
      const clientContracts = contracts.filter((c) => c.clientId === client.id);
      const clientTx = transactions.filter((t) => t.clientId === client.id);

      const contractsTotal = clientContracts.reduce(
        (sum, c) => sum + getContractTotal(c),
        0
      );

      const paid = clientTx
        .filter((t) => t.status === "pago")
        .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

      const pending = clientTx
        .filter((t) => t.status === "pendente" || t.status === "atrasado")
        .reduce((sum, t) => sum + parseCurrencyToNumber(t.value), 0);

      return {
        clientId: client.id,
        name: client.name,
        company: client.company,
        contractsCount: clientContracts.length,
        contractsTotal,
        paid,
        pending,
      };
    })
    .filter((r) => r.contractsCount > 0 || r.paid > 0 || r.pending > 0)
    .sort((a, b) => b.contractsTotal - a.contractsTotal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo financeiro por cliente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Contratos</TableHead>
              <TableHead className="text-right">Total contratado</TableHead>
              <TableHead className="text-right">Pago</TableHead>
              <TableHead className="text-right">Pendente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum dado por cliente ainda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.clientId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{r.name}</span>
                      {r.company ? (
                        <span className="text-xs text-muted-foreground">{r.company}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{r.contractsCount}</TableCell>
                  <TableCell className="text-right font-medium">{formatBRL(r.contractsTotal)}</TableCell>
                  <TableCell className="text-right">{formatBRL(r.paid)}</TableCell>
                  <TableCell className="text-right">{formatBRL(r.pending)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
