# Guia de Deployment - Kora Platform

## 🔧 Configuração Pre-Deployment

### 1. Variáveis de Ambiente
Certifique-se que as seguintes variáveis estão configuradas no seu `.env`:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 2. Banco de Dados (Supabase)

#### ✅ Tabelas Criadas:
- `clients` - Clientes e leads
- `projects` - Projetos
- `tasks` - Tarefas
- `contracts` - Contratos
- `knowledge_items` - Base de conhecimento
- `support_tickets` - Tickets de suporte
- `client_integrations` - Integrações
- `okr_objectives` - Objetivos OKR **[NOVO]**
- `okr_updates` - Atualizações de OKR **[NOVO]**

#### ✅ RLS Policies:
Todas as tabelas têm RLS (Row Level Security) ativado:
- SELECT: Permitido para usuários autenticados
- INSERT: Permitido para usuários autenticados
- UPDATE: Permitido para usuários autenticados
- DELETE: Permitido para usuários autenticados

### 3. Autenticação

#### Login Flow:
1. Usuário acessa `/login`
2. Fornece email e senha
3. Autenticação via Supabase Auth
4. Redirecionado para `/` (Funil) após sucesso

#### Protected Routes:
Todas as rotas exceto `/login` e `/sign/:token` requerem autenticação.
- Componente `ProtectedRoute` em `App.tsx` valida sessão
- Redirecionamento automático para `/login` se não autenticado

### 4. Responsividade Mobile

#### Breakpoints (Tailwind):
- **sm**: 640px (celulares pequenos)
- **md**: 768px (tablets)
- **lg**: 1024px (desktops)

#### Componentes Ajustados:
- Sidebar: Desktop (`lg:block`) / Mobile (toggle)
- Grids: Responsivos (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- Tabelas: `overflow-x-auto` para scroll horizontal
- Diálogos: 100% width em mobile, `max-w-md` em desktop

### 5. Dados Persistentes

#### OKRs **[NOVO]**:
- Hook customizado `useOKRData` em `src/hooks/useOKRData.ts`
- Dados salvos em tempo real no Supabase
- Sync automático entre abas
- Histórico de atualizações mantido

#### Outros Dados:
- `DataContext` em `src/contexts/DataContext.tsx`
- Chamadas via edge function `external-db`
- Cache local em estado React
- Refresh disponível em cada página

## 🚀 Deploy

### Build Local
```bash
npm run build
```

### Deploy em Vercel
```bash
vercel deploy --prod
```

### Deploy em Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Deploy Customizado (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📋 Checklist Pre-Deploy

- [ ] Build completa sem erros: `npm run build`
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase URL e keys validadas
- [ ] RLS policies ativadas no Supabase
- [ ] Migrations executadas (`okr_tables`)
- [ ] Responsividade testada em mobile
- [ ] Login/logout testado
- [ ] OKR CRUD testado (create, read, update, delete)
- [ ] Dados persistem após refresh de página
- [ ] Performance aceitável (<3s inicial load)
- [ ] Sem console errors ou warnings críticos

## 🔍 Monitoramento Pós-Deploy

### Verificações Diárias:
1. Login funciona
2. Dados carregam corretamente
3. Nenhum erro no console do navegador
4. Responsividade em mobile OK

### Logs Supabase:
- Database: Verificar queries lentas
- Auth: Verificar failed logins
- Functions: Verificar edge function errors

### Performance:
- Lighthouse Score (target: >80 em mobile)
- Time to Interactive < 3s
- Largest Contentful Paint < 2.5s

## 🆘 Troubleshooting

### Problema: OKRs não salvam
**Solução**: Verificar RLS policies em `okr_objectives` e `okr_updates`
```sql
SELECT * FROM okr_objectives;  -- Deve retornar dados
```

### Problema: Login não funciona
**Solução**: Verificar credenciais Supabase e CORS em dashboard

### Problema: Dados não sincronizam
**Solução**: Limpar localStorage e fazer refresh

## 📞 Suporte
Para dúvidas: ferramentas@koraflow.com.br
