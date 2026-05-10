import { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, ExternalLink, Zap, Database, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_PROJECT_ID = "legslpfplxlswufjbvkp";
const N8N_API_ENDPOINT = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/n8n-api`;

const ALLOWED_TABLES = [
  'clients',
  'projects',
  'tasks',
  'contracts',
  'knowledge_items',
  'support_tickets',
  'financial_transactions'
];

export function IntegrationsTab() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'n8n_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(key);
  };

  const saveApiKey = async () => {
    if (!apiKey) {
      toast.error("Gere ou insira uma API Key primeiro");
      return;
    }

    setIsSaving(true);
    try {
      // We'll save the API key by calling the edge function to verify it works
      // The actual secret needs to be set via Lovable's secrets management
      toast.info("Para ativar a API, adicione o secret N8N_API_KEY no painel de configurações do Lovable Cloud");
      toast.success("API Key gerada! Copie e configure no Lovable Cloud.");
    } catch (error) {
      toast.error("Erro ao salvar API Key");
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!apiKey) {
      toast.error("Insira uma API Key primeiro");
      return;
    }

    setTestResult(null);
    try {
      const response = await fetch(N8N_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          action: 'select',
          table: 'clients',
          limit: 1
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ success: true, message: 'Conexão bem-sucedida!' });
        toast.success('Conexão com a API funcionando!');
      } else {
        setTestResult({ success: false, message: data.error || 'Erro na conexão' });
        toast.error(data.error || 'Erro ao testar conexão');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro de rede' });
      toast.error('Erro ao conectar com a API');
    }
  };

  const examplePayloads = {
    select: `{
  "action": "select",
  "table": "clients",
  "filters": { "pipeline_stage": "cliente" },
  "limit": 10,
  "order_by": "created_at",
  "order_direction": "desc"
}`,
    insert: `{
  "action": "insert",
  "table": "clients",
  "data": {
    "name": "João Silva",
    "company": "Empresa ABC",
    "email": "joao@empresa.com",
    "phone": "(11) 99999-0000",
    "pipeline_stage": "prospeccao"
  }
}`,
    update: `{
  "action": "update",
  "table": "clients",
  "id": "uuid-do-registro",
  "data": {
    "pipeline_stage": "cliente",
    "notes": "Contrato assinado"
  }
}`,
    delete: `{
  "action": "delete",
  "table": "clients",
  "id": "uuid-do-registro"
}`
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Integração N8N</h2>
        <p className="text-sm text-muted-foreground">
          Configure a API para conectar automações do N8N com a plataforma.
        </p>
      </div>

      {/* API Endpoint */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Endpoint da API</h3>
        </div>
        <div className="flex gap-2">
          <Input 
            value={N8N_API_ENDPOINT} 
            readOnly 
            className="font-mono text-sm bg-background"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(N8N_API_ENDPOINT, "Endpoint")}
          >
            {copied === "Endpoint" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use este endpoint nas suas automações N8N com o método POST.
        </p>
      </div>

      {/* API Key Configuration */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-medium">API Key</h3>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="n8n_xxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono text-sm pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <Button variant="outline" onClick={generateApiKey}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Gerar
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(apiKey, "API Key")}
            disabled={!apiKey}
          >
            {copied === "API Key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveApiKey} disabled={!apiKey || isSaving}>
            {isSaving ? "Salvando..." : "Salvar API Key"}
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={!apiKey}>
            Testar Conexão
          </Button>
        </div>
        {testResult && (
          <div className={`text-sm p-2 rounded-xl ${testResult.success ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-red-500/15 text-red-700 dark:text-red-400'}`}>
            {testResult.message}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Após gerar a API Key, adicione-a como secret <code className="bg-background px-1 rounded">N8N_API_KEY</code> nas configurações do Lovable Cloud.
        </p>
      </div>

      {/* Available Tables */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Tabelas Disponíveis</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALLOWED_TABLES.map((table) => (
            <span
              key={table}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-mono"
            >
              {table}
            </span>
          ))}
        </div>
      </div>

      {/* Documentation */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Documentação da API</h3>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Headers Obrigatórios</h4>
            <pre className="p-3 rounded bg-background text-xs overflow-x-auto">
{`Content-Type: application/json
x-api-key: sua_api_key`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Ações Disponíveis</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><code className="bg-background px-1 rounded">select</code> - Buscar registros</li>
              <li><code className="bg-background px-1 rounded">insert</code> - Inserir novo registro</li>
              <li><code className="bg-background px-1 rounded">update</code> - Atualizar registro existente</li>
              <li><code className="bg-background px-1 rounded">upsert</code> - Inserir ou atualizar</li>
              <li><code className="bg-background px-1 rounded">delete</code> - Excluir registro</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Exemplo: Buscar Clientes (select)</h4>
            <pre className="p-3 rounded bg-background text-xs overflow-x-auto">
              {examplePayloads.select}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => copyToClipboard(examplePayloads.select, "Select")}
            >
              {copied === "Select" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copiar
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Exemplo: Inserir Cliente (insert)</h4>
            <pre className="p-3 rounded bg-background text-xs overflow-x-auto">
              {examplePayloads.insert}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => copyToClipboard(examplePayloads.insert, "Insert")}
            >
              {copied === "Insert" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copiar
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Exemplo: Atualizar (update)</h4>
            <pre className="p-3 rounded bg-background text-xs overflow-x-auto">
              {examplePayloads.update}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => copyToClipboard(examplePayloads.update, "Update")}
            >
              {copied === "Update" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copiar
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Exemplo: Excluir (delete)</h4>
            <pre className="p-3 rounded bg-background text-xs overflow-x-auto">
              {examplePayloads.delete}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => copyToClipboard(examplePayloads.delete, "Delete")}
            >
              {copied === "Delete" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copiar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
