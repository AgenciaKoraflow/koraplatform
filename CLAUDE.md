# Marketing Dashboard - Documentação Técnica

## Stack & Arquitetura

**Framework:** React 18 + TypeScript + React Router DOM
**Styling:** Tailwind CSS + shadcn/ui
**Package Manager:** Bun
**Theme:** Dark mode nativo + Accent terracota (#B8532E)

## Decisões Arquiteturais

### 1. Navegação em Tabs
- Marketing é uma subsecção da página Empresa com 6 sub-páginas
- Usamos um sistema de sub-tabs interno para navegar entre as 6 páginas
- Estado de aba mantido via query parameter (`?subpage=hook-vault`)
- Permite deep-linking e volta do navegador funciona

### 2. Componentes Reutilizáveis
- Cada sub-página é um componente isolado em `src/components/empresa/marketing/`
- Estrutura consistente com outros módulos da aplicação (Tarefas, Financeiro, etc)
- Props: `workspaceId` é passado para cada componente

### 3. Cores & Tema
- **Accent Principal (Marketing):** Terracota (#B8532E) - mais quente que laranja, mais relevante para conteúdo
- Segue padrão de cores do projeto (HSL variables no CSS)
- Dark mode automático via `html.dark` class
- Acessibilidade: contrast ratio >= WCAG AA em ambos os temas

### 4. Estrutura de Pasta
```
src/components/empresa/
├── EmpresaMarketing.tsx          (container principal)
└── marketing/
    ├── HookVault.tsx              (Page 1)
    ├── Analytics.tsx              (Page 2)
    ├── Concorrentes.tsx           (Page 3)
    ├── Agendador.tsx              (Page 4)
    ├── Calendario.tsx             (Page 5)
    └── EmAlta.tsx                 (Page 6)
```

## Páginas do Dashboard

### 0. **Visão Geral** (`/empresa?tab=marketing&marketing=visao-geral`)
- Dashboard principal com metrics de alto nível
- Cards com views, stripe revenue, DMs filtradas
- Status de conteúdo (publicados, rascunho, agendados, em análise)
- Quick links para outras páginas

### 1. **Hook Vault** (`/empresa?tab=marketing&marketing=hook-vault`)
- Banco de dados de hooks/chamativos com categorias (SWAP, BUILD, CLAIM, LIST, CONTRARIAN)
- Listagem com contador de uso (ex: 38×, 24×)
- Busca em tempo real
- Cards com ações (copiar, deletar)

### 2. **Analytics** (`/empresa?tab=marketing&marketing=analytics`)
- Métricas principais: Views, Saves, Visitas ao Perfil
- Top 5 Heaters (últimos 7 dias) com crescimento percentual
- Cards de performance com deltas positivos

### 3. **Concorrentes** (`/empresa?tab=marketing&marketing=concorrentes`)
- Lista de 8+ criadores monitorados
- Follower count em grandes números (1.2M, 478K, etc)
- Contador de novos posts por criador
- Atualização automática (DOM 06:00)

### 4. **Agendador** (`/empresa?tab=marketing&marketing=agendador`)
- Seleção de plataformas (Instagram, TikTok, YT Shorts, LinkedIn)
- Form com data, hora e via de publicação
- Botão "AGENDAR TUDO" para múltiplas plataformas

### 5. **Calendario** (`/empresa?tab=marketing&marketing=calendario`)
- Calendário visual do mês com grid 7x semana
- Dias agendados destacados com contador
- Navegação mês anterior/próximo
- Legenda com status (agendado, disponível)

### 6. **Trending** (`/empresa?tab=marketing&marketing=trending`)
- Feed de tendências do dia
- 12+ fontes monitoradas
- Classificação por potencial (COM POTENCIAL, HOOK, EXPLICAR, PULAR)
- Contador de fontes por tendência

## Padrões de Desenvolvimento

### Query Parameters
- Navegação via URL: `?tab=marketing&marketing=hook-vault`
- Exemplo completo: `/empresa?tab=marketing&marketing=analytics`
- Permite preservar estado durante navegação
- Suporta deep-linking e botão voltar do navegador

### Loading States
- Cada página possui seu próprio state de loading
- Placeholder com ícone e mensagem descritiva
- Dados carregados via React Query (padrão do projeto)

### Responsividade
- Mobile-first design com Tailwind
- Tabs se adaptam a screens menores
- Conteúdo sempre legível em mobile

## Garantia de Qualidade (QA) ✅

**Status:** 24/24 testes automatizados passando

### Antes de qualquer commit ou push:
1. ✅ Executar `npm run build` (deve suceder sem erros)
2. ✅ Executar `./test-marketing-dashboard.sh` (deve ter 24/24 testes passando)
3. ✅ Verificar console do navegador (zero erros)
4. ✅ Testar 3 funcionalidades principais manualmente

### Documentação de QA
- `TESTING.md` - Checklist completo de testes (13 suites, 50+ items)
- `QUALITY_ASSURANCE.md` - Certificação formal de qualidade e SLA
- `test-marketing-dashboard.sh` - Script automatizado de validação

### Processo de QA:
```bash
# Antes de cada commit:
npm run build && ./test-marketing-dashboard.sh
```

Se algum teste falhar: NÃO comitar até corrigir

## Próximos Passos

1. Integrar com backend (API endpoints)
2. Adicionar hooks de mutação para CRUD operations
3. Implementar permissões por papel
4. Adicionar cache e sincronização em tempo real (se necessário)
5. Telemetria e analytics do próprio dashboard

## Referências
- Estrutura seguida: `src/components/empresa/EmpresaTarefas.tsx`
- Pattern de hooks: `useInternalTasks`, `useInternalTaskMutations`
- UI components: shadcn/ui (Button, Input, Select, Dialog, etc)
- QA Script: `./test-marketing-dashboard.sh` (execute antes de cada commit)
