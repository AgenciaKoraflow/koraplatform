# 🔧 Correções Pendentes - Priorizado

**Data:** 11 de Maio de 2026  
**Status:** 🔴 Bloqueado - Aguardando ação no Supabase

---

## 🚨 CRÍTICO - OKR Error 404

**Problema:** Ao tentar criar OKR, recebe erro:
```
Could not find the table 'public.okr_objectives' in the schema cache
```

**Causa Raiz:** A migração SQL foi criada mas a tabela não foi executada no banco de dados.

### Como Resolver:

#### Opção A: Via Supabase Dashboard (Mais Fácil)

1. Acesse: https://app.supabase.com
2. Selecione projeto: **Kora System**
3. Vá para: **SQL Editor**
4. Clique em: **"New query"**
5. Cole o conteúdo do arquivo: `supabase/migrations/20260503160000_create_okr_tables.sql`
6. Clique em: **"Run"**
7. Pronto! As tabelas `okr_objectives` e `okr_updates` foram criadas

#### Opção B: Via Supabase CLI (Recomendado)

```bash
cd /Users/jamescardosomartinelli/Downloads/koraplatform-main

# Login
supabase login

# Executar migrações
supabase db push

# Ou especificar uma migração
supabase db push --file supabase/migrations/20260503160000_create_okr_tables.sql
```

**Status após resolver:** ✅ OKR funcionará normalmente

---

## 🔗 Contratos - Erro ao Gerar Link

**Problema:** Ao gerar link para cliente assinar, recebe 404 ao acessar `/sign/{token}`

**Causa Provável:** A coluna `signature_link_token` ou `signature_link_expires_at` pode não existir na tabela `contracts`

### Como Resolver:

#### Verificação Rápida:

1. Dashboard > **SQL Editor**
2. Execute:
```sql
-- Verificar colunas da tabela contracts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
ORDER BY column_name;
```

3. Procure por: `signature_link_token` e `signature_link_expires_at`
   - ✅ Se aparecer = Colunas existem (problema é outro)
   - ❌ Se não aparecer = Precisa adicionar as colunas

#### Se colunas não existem:

```sql
-- Adicionar colunas de signature link
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS signature_link_token UUID UNIQUE DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS signature_link_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fully_signed_at TIMESTAMPTZ;

-- Criar índice para faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_signature_link_token 
ON contracts(signature_link_token);
```

**Status após resolver:** ✅ Links para assinatura funcionarão

---

## ✨ Novos Campos em Contratos

**Requested:**
1. Campo de valor da implementação (obrigatório)
2. Campo de recorrência (opcional) - como em Novo Projeto

### Implementação:

#### 1. Adicionar Colunas na BD:

```sql
-- Adicionar campos de implementação e recorrência
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS implementation_value NUMERIC,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('monthly', 'quarterly', 'semi_annual', 'annual', NULL)),
ADD COLUMN IF NOT EXISTS recurrence_start_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
```

#### 2. Atualizar Interface (React Component)

Local do arquivo: `src/pages/Contratos.tsx`

Adicionar após o campo de valor do contrato:

```typescript
// Campos já existem em "Create Contract Dialog", precisamos adicionar:
- Campo "Valor da Implementação" (number, obrigatório)
- Seletor "Recorrência" (select: monthly/quarterly/semi-annual/annual, opcional)
- Datas de recorrência (DatePicker, opcional)
```

---

## 💰 Financeiro - Status de Pagamento

**Requested:**
1. Marcar se despesa foi paga ou não
2. Sinalizar status na tabela/modal
3. Clicar na linha da tabela para abrir modal

### Implementação:

#### 1. Adicionar Coluna na BD:

```sql
-- Adicionar status de pagamento
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('dinheiro', 'cartao', 'transferencia', 'cheque', NULL));
```

#### 2. Atualizar Interface

Local: `src/pages/Financeiro.tsx`

Adicionar:
- Checkbox "Pago/Não Pago" na tabela (com ícone visual)
- Campo de data de pagamento (quando marcar como pago)
- Modalidade de pagamento
- Click na linha abre modal de detalhes

---

## 📋 Ordem de Execução

### Hoje (Crítico):
1. ✅ Criar tabelas OKR via Supabase
2. ✅ Verificar/adicionar colunas de signature link em contracts

### Esta semana (Alto Impacto):
1. Adicionar campos de implementação + recorrência em Contratos
2. Adicionar status de pagamento em Financeiro
3. Implementar clique na linha da tabela para abrir modal

---

## 🛠️ Checklist

### OKR Fix
- [ ] Executei migração SQL para criar tabelas
- [ ] Testei criar uma OKR
- [ ] OKR aparece na lista
- [ ] Consigo editar/deletar OKR

### Contratos Link Fix
- [ ] Verifiquei se colunas `signature_link_token` existem
- [ ] Adicionei colunas se não existiam
- [ ] Testei gerar link para cliente
- [ ] Link funciona e abre a página de assinatura

### Novos Campos Contratos
- [ ] Adicionei colunas na BD
- [ ] Atualizei interface React
- [ ] Testei criar contrato com novos campos
- [ ] Campos aparecem na tabela/modal

### Financeiro Status
- [ ] Adicionei colunas na BD
- [ ] Atualizei interface React
- [ ] Testei marcar despesa como paga
- [ ] Clique na linha abre modal

---

## 🚀 Próximos Passos

1. **Agora:** Execute a migração OKR no Supabase
2. **Próximo:** Verifique colunas de signature link
3. **Depois:** Implemente novos campos em Contratos
4. **Por fim:** Implemente status de pagamento em Financeiro
5. **Deploy:** Faça commit, push para GitHub e redeploy em Vercel

