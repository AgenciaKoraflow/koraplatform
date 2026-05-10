# 🔍 Guia de Verificação da Configuração Supabase

## Passo 1: Verificar Email Confirmation Setting

**No Supabase Dashboard:**

1. Acesse: https://app.supabase.com
2. Selecione o projeto: **Kora System**
3. Vá para: **Authentication (Autenticação)**
4. No menu esquerdo, clique em: **Providers**
5. Clique em: **Email** (provider padrão)
6. Procure pela opção: **"Confirm email"**

**O que significa:**

- ✅ **Se estiver MARCADO (habilitado):**
  - Supabase exige confirmação de email
  - Novos usuários recebem email de confirmação
  - Precisam clicar no link para fazer login
  - **Isso explica por que seus usuários não conseguem fazer login!**

- ❌ **Se estiver DESMARCADO (desabilitado):**
  - Novos usuários conseguem fazer login imediatamente
  - Sem precisar confirmar email (menos seguro)

---

## Passo 2: Verificar Status dos Usuários Existentes

**No Supabase Dashboard:**

1. Vá para: **Authentication > Users**
2. Veja a lista de usuários

**Verificar cada usuário:**

| Usuário | Coluna "Confirmed At" | Status | Pode fazer login? |
|---------|----------------------|--------|------------------|
| joao    | Com data (ex: 2026-05-10) | ✅ Confirmado | **SIM** |
| seu_usuario_1 | Em branco | ❌ Pendente | **NÃO** |
| seu_usuario_2 | Em branco | ❌ Pendente | **NÃO** |

**Isso explica tudo!** Os usuários sem "Confirmed At" não conseguem fazer login.

---

## Passo 3: Corrigir o Problema

### Solução A: Confirmar Manualmente (Rápido para poucos usuários)

1. Dashboard > **Authentication > Users**
2. Clique no usuário que quer confirmar
3. Procure pelo campo/botão de confirmação (varia por versão do Supabase)
4. Marque como "Confirmed" ou clique em "Confirm email"
5. Salve

Agora o usuário consegue fazer login!

### Solução B: Usar a Edge Function (Para criar novos usuários)

Já criamos a edge function `create-user` que auto-confirma emails.

**Passo 1: Deploy da Edge Function**

```bash
cd /Users/jamescardosomartinelli/Downloads/koraplatform-main

# Login no Supabase
supabase login

# Deploy
supabase functions deploy create-user
```

**Passo 2: Usar a Function para Criar Novos Usuários**

Ao invés de criar manualmente no dashboard, use:

```bash
# Via Supabase CLI
supabase functions invoke create-user --body '{
  "email": "novo@email.com",
  "password": "senha123",
  "email_confirm": true
}'
```

**Passo 3: Testar Login**

O novo usuário agora consegue fazer login imediatamente!

### Solução C: Desativar Confirmação de Email (Menos Seguro)

Se não quer exigir confirmação:

1. Dashboard > **Authentication > Providers > Email**
2. Desmarque: **"Confirm email"**
3. Clique em **"Save"**

**Prós:** Usuários conseguem fazer login imediatamente
**Contras:** Qualquer um consegue fazer login com qualquer email (menos seguro)

---

## Passo 4: Testar o Login

Depois de aplicar a solução:

1. Vá ao app em: https://seu-dominio/login (ou localhost:5173)
2. Digite email e senha de um usuário confirmado
3. Clique em "Entrar"
4. Teste se consegue acessar o dashboard

**Se conseguir:** ✅ Tudo funcionando!
**Se não conseguir:** Veja a seção de Troubleshooting abaixo

---

## 🆘 Troubleshooting

### "Invalid login credentials"
- Email ou senha está errado
- OU o email não foi confirmado

**Solução:** Verifique "Confirmed At" no dashboard

### "Email not confirmed"
- O usuário existe mas não confirmou o email

**Solução:** Confirme manualmente no dashboard ou use a edge function

### Edge function não funciona
- Pode estar não deployada

**Solução:**
```bash
supabase functions list  # Ver funções deployadas
supabase functions deploy create-user  # Redeploy
```

---

## 📋 Checklist de Resolução

- [ ] Verifiquei "Confirm email" setting no dashboard
- [ ] Verifiquei "Confirmed At" para cada usuário
- [ ] Confirmei manualmente os usuários existentes OU
- [ ] Deploy da edge function `create-user`
- [ ] Testei login com um usuário confirmado
- [ ] Documentei qual solução vai usar para novos usuários

---

## 🎯 Resumo Rápido

**Por que alguns usuários conseguem fazer login:**
→ Seu email tem "Confirmed At" com data

**Por que novos usuários NÃO conseguem fazer login:**
→ Supabase exige confirmação de email por padrão, e "Confirmed At" está em branco

**Como resolver:**
1. Dashboard: Confirme usuários existentes manualmente
2. Futuros: Use edge function com `email_confirm: true`
3. Ou: Desative "Confirm email" (menos seguro)
