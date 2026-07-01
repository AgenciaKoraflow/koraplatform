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

### 1. **Hook Vault** (`/empresa?tab=marketing&subpage=hook-vault`)
- Banco de dados de hooks/chamativos para conteúdo
- Permite salvar, organizar e pesquisar hooks
- Prototipo: cards com hooks, filtros por categoria

### 2. **Analytics** (`/empresa?tab=marketing&subpage=analytics`)
- Métricas de desempenho de conteúdo
- Visualizações de engagement, views, conversões
- Dashboard com gráficos e estatísticas

### 3. **Concorrentes** (`/empresa?tab=marketing&subpage=concorrentes`)
- Análise e monitoramento de concorrentes
- Rastreamento de estratégias, conteúdo e performance
- Comparação competitiva

### 4. **Agendador** (`/empresa?tab=marketing&subpage=agendador`)
- Agendamento de publicações
- Calendário semanal/mensal para planejamento de conteúdo
- Gerenciamento de fila de publicação

### 5. **Calendario** (`/empresa?tab=marketing&subpage=calendario`)
- Visualização visual de calendário completo
- Eventos de publicação mapeados por dia
- Planejamento visual de estratégia editorial

### 6. **Em Alta** (`/empresa?tab=marketing&subpage=em-alta`)
- Trending topics e tendências do momento
- Análise do que está em alta nas plataformas
- Oportunidades de conteúdo oportuno

## Padrões de Desenvolvimento

### Query Parameters
- Navegação via URL: `?tab=marketing&subpage=hook-vault`
- Permite preservar estado durante navegação
- Suporta deep-linking

### Loading States
- Cada página possui seu próprio state de loading
- Placeholder com ícone e mensagem descritiva
- Dados carregados via React Query (padrão do projeto)

### Responsividade
- Mobile-first design com Tailwind
- Tabs se adaptam a screens menores
- Conteúdo sempre legível em mobile

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
