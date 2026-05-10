# 🔐 Configuração de Autenticação Supabase

## 📋 Situação Atual

- ✅ Autenticação integrada com Supabase Auth (via `signInWithPassword`)
- ✅ Apenas usuários criados no Supabase podem fazer login
- ✅ Chaves sensíveis removidas do Git (.env privado)

---

## 🔧 Como Criar Usuários no Supabase

### Via Dashboard (Manual):

1. **Acesse**: https://app.supabase.com
2. **Projeto**: Kora System
3. **Menu**: Authentication > Users
4. **Botão**: "Create New User"
5. **Preencha**:
   - Email: `seu@email.com`
   - Password: Digite uma senha forte
6. **Create User**

### Via CLI (Recomendado):

```bash
# Install Supabase CLI
npm i -g supabase

# Login
supabase login

# Create user
supabase auth admin create --email seu@email.com --password "senha_forte"
```

### Via Edge Function:

Você pode criar um endpoint que cria usuários:

```typescript
// supabase/functions/create-user/index.ts
import { createClient } from '@supabase/supabase-js'

export default async (req: Request) => {
  const { email, password } = await req.json()
  
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirma email
  })
  
  return new Response(JSON.stringify({ data, error }))
}
```

---

## ✅ Verificação: Por que "joao" faz login?

**Possíveis razões**:

1. **Email Confirmado**: O usuário "joao" foi criado E o email foi confirmado
2. **Auto-confirmar**: Supabase pode estar auto-confirmando emails
3. **Erro de Sync**: Novo usuário criado mas não sincronizado ainda

### Como Verificar:

1. Dashboard > Authentication > Users
2. Procure por "joao@empresa.com"
3. Veja se a coluna "Confirmed At" tem data
4. Se estiver em branco = email não confirmado

---

## 🐛 Por que novos usuários NÃO fazem login?

### Causa Provável: Email não confirmado

**Supabase exige confirmação de email por padrão!**

### Solução 1: Desativar Confirmação (CUIDADO - Menos Seguro)

1. Dashboard > Authentication > Providers > Email
2. Desmarque: "Confirm email"
3. Salve

### Solução 2: Auto-confirmar Usuários (Recomendado)

```typescript
// Via supabase.auth.admin.createUser()
const { user } = await supabase.auth.admin.createUser({
  email: 'novo@email.com',
  password: 'senha123',
  email_confirm: true, // ✅ Auto-confirma
})
```

### Solução 3: Enviar Email de Confirmação

Ao criar usuário via Dashboard:
- Supabase automaticamente envia email de confirmação
- Usuário clica link no email
- Email é confirmado = pode fazer login

---

## 🔑 Fluxo de Login Correto

```
Usuário digita email/senha
         ↓
App chama: supabase.auth.signInWithPassword(email, password)
         ↓
Supabase valida credenciais
         ↓
✅ Email confirmado? → Faz login
❌ Email NÃO confirmado? → Erro: "Email not confirmed"
❌ Credenciais erradas? → Erro: "Invalid login credentials"
```

---

## 📝 Checklist para Produção

- [ ] Usuários criados no Supabase têm email confirmado
- [ ] Testou login com novo usuário
- [ ] Sem fallback ou mock users
- [ ] `.env` está no `.gitignore`
- [ ] Apenas `VITE_*` keys no `.env` público
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** no cliente

---

## 🆘 Troubleshooting

### "Invalid login credentials"
→ Email ou senha errada, ou email não confirmado

### "User does not exist"
→ Usuário não foi criado no Supabase

### "Email not confirmed"
→ Usuário criado mas email não foi confirmado
→ Solução: Dashboard > Users > [usuário] > marcar "Confirmed At"

### Login funciona no navegador mas não no Vercel
→ Variáveis de ambiente não foram definidas no Vercel
→ Solução: Settings > Environment Variables no Vercel

---

## 🔍 Verificação Rápida do Problema Atual

Se alguns usuários conseguem fazer login e outros não, siga:

### 1. Verificar Status de Confirmação no Dashboard

1. Acesse: https://app.supabase.com → Seu Projeto (Kora System)
2. Menu: **Authentication > Users**
3. Procure pelos usuários que criou
4. Verifique coluna **Confirmed At**:
   - ✅ Com data = Email confirmado = **PODE fazer login**
   - ❌ Em branco = Email NÃO confirmado = **NÃO consegue fazer login**

### 2. Entender por que "joao" consegue fazer login

Se o usuário "joao" consegue fazer login:
- Provavelmente foi criado COM confirmação automática
- Ou alguém confirmou o email manualmente
- Veja no dashboard se tem data em "Confirmed At" para esse usuário

### 3. Verificar Configuração de Confirmação de Email

1. Dashboard > **Authentication > Providers > Email**
2. Procure por: **"Confirm email"** ou **"Email confirmation"**
   - ✅ Se estiver MARCADO = Requer confirmação (seguro mas exige ação)
   - ❌ Se estiver DESMARCADO = Permite login sem confirmar (menos seguro)

---

## ✨ Solução Recomendada: Usar Edge Function

Criamos uma Edge Function para criar usuários com email auto-confirmado:

```bash
# Deploy da edge function (a partir da raiz do projeto)
supabase functions deploy create-user

# Depois, use via API:
curl -X POST https://seu-projeto.functions.supabase.co/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo@email.com",
    "password": "senha123",
    "email_confirm": true
  }'
```

### Como usar no seu app:

```typescript
const createNewUser = async (email: string, password: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true
      })
    }
  )
  
  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data.user
}
```

---

## 🛠️ Ações Imediatas

### Opção A: Corrigir usuários existentes no Dashboard (Manual)

1. Dashboard > Authentication > Users
2. Para cada usuário que NÃO consegue fazer login:
   - Clique no usuário
   - Procure por um botão/checkbox para confirmar email
   - Marque "Confirmed At" ou clique em "Confirm Email"
3. Salve as mudanças

### Opção B: Recriar usuários com a Edge Function (Automático)

1. Delete ou desative usuários antigos que não conseguem fazer login
2. Use a edge function para recriar com `email_confirm: true`
3. Novos usuários conseguem fazer login imediatamente

### Opção C: Desativar Confirmação de Email (Menos Seguro)

Se preferir permitir login sem confirmação de email:

1. Dashboard > **Authentication > Providers > Email**
2. Desmarque: **"Confirm email"**
3. Clique em **"Save"**

⚠️ Isso significa qualquer pessoa consegue fazer login após criar a conta, mesmo sem confirmar email. Recomendamos a Opção B.

---

## ✨ Para Produção

Use sempre o padrão:

```typescript
// ✅ BOM - Usuários conseguem fazer login imediatamente
const { user } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // Auto-confirma email
})
```

Assim novos usuários conseguem fazer login imediatamente! ✅
