# Setup Supabase - Hook Vault Backend

## ⚠️ IMPORTANTE: Execute ANTES de usar Hook Vault

### Passo 1: Criar Tabelas no Supabase

1. Abra Supabase Dashboard → Seu Projeto
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Cole todo o conteúdo de `supabase-migrations/create-hooks-tables.sql`
5. Clique em **Run**
6. Verifique se criou 2 tabelas: `hooks` e `audience_configs`

### Passo 2: Verificar Estrutura

**Tabelas criadas:**
- `hooks` - Banco de hooks com CRUD completo
- `audience_configs` - Configurações de audiência por workspace

**RLS (Row Level Security):**
- ✅ Habilitado para ambas as tabelas
- ✅ Usuários só veem dados do seu workspace
- ✅ Usuários só deletam seus próprios hooks

### Passo 3: Verificar Variáveis de Ambiente

Confirme que existem em `.env.local`:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxx
```

### Passo 4: Usar no Frontend

```javascript
// Importar hook para fetch
import { useHooks } from "@/hooks/queries/useHooksQuery";

// Importar mutations para CRUD
import { useHooksMutations } from "@/hooks/mutations/useHooksMutations";

// Usar em um componente
export function MyComponent() {
  const workspaceId = "xxx"; // Get from context/props
  const { data: hooks, isLoading } = useHooks(workspaceId);
  const { createHook, deleteHook, updateHook } = useHooksMutations(workspaceId);

  // Usar...
}
```

---

## 🔄 Fluxo Completo (Backend + Frontend)

### 1. Criar Hook
```javascript
const { createHook } = useHooksMutations(workspaceId);

await createHook.mutateAsync({
  text: '"Para de fazer [X]. Começa a fazer [Y]."',
  template: 'Para de fazer [X]. Começa a fazer [Y].',
  creator: 'Dan Koe',
  creator_handle: '@dan_koe',
  type: 'SWAP',
  niche: 'SaaS',
  views: 487000,
});
```

### 2. Listar Hooks
```javascript
const { data: hooks, isLoading } = useHooks(workspaceId);

hooks?.forEach(hook => {
  console.log(hook.text, hook.views);
});
```

### 3. Deletar Hook
```javascript
const { deleteHook } = useHooksMutations(workspaceId);

await deleteHook.mutateAsync(hookId);
```

### 4. Incrementar Uso
```javascript
const { incrementTimesUsed } = useHooksMutations(workspaceId);

await incrementTimesUsed.mutateAsync(hookId);
// times_used aumenta em 1
```

---

## ✅ Checklist

- [ ] SQL executado no Supabase
- [ ] Tabelas criadas (`hooks` e `audience_configs`)
- [ ] RLS habilitado
- [ ] Variáveis de ambiente confirmadas
- [ ] Hooks React importados
- [ ] Frontend conectado ao backend
- [ ] Testar CRUD (criar, ler, atualizar, deletar)

---

## 🐛 Troubleshooting

### "Table 'hooks' not found"
**Solução:** Execute o SQL novamente no Supabase Dashboard

### "RLS policy violation"
**Solução:** Verifique se o usuário está autenticado (`supabase.auth.getUser()`)

### "workspace_id is null"
**Solução:** Certifique-se de que está passando `workspaceId` correto para os hooks

### Dados não aparecendo
**Solução:** 
1. Verifique se foi inserido algum dado (`SELECT * FROM hooks;`)
2. Verifique RLS policies
3. Verifique `workspace_id` no banco vs componente

---

## 📚 Documentação

- Tipos: `src/types/hooks.ts`
- Queries: `src/hooks/queries/useHooksQuery.ts`
- Mutations: `src/hooks/mutations/useHooksMutations.ts`
- SQL: `supabase-migrations/create-hooks-tables.sql`
