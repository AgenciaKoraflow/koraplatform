# 🎬 Marketing Dashboard - Assistente de Conteúdo Viral

## 🎯 Visão Geral

**Propósito:** Painel interno que automatiza todo o fluxo de conteúdo viral — captura referências, mede performance, vigia concorrentes e agenda posts. Você cria, o sistema cuida do resto.

**Usuário:** Criador de conteúdo focado em IA/tech (ex: @fabianocarvalhojr)
**Stack:** React 18 + TypeScript + React Router DOM | Tailwind CSS + shadcn/ui | Bun
**Tema:** Dark mode nativo + Accent terracota (#B8532E)

---

## 📊 As 6 Páginas (Sequência de Desenvolvimento)

### 0️⃣ **Visão Geral** (`?marketing=visao-geral`)
**Dashboard de entrada com resumos**
- Cards: última semana (views, saves, followers)
- Quick actions: "Novo Hook", "Agendar Post", "Ver Tendências"
- Status do agendamento (próximos 3 posts)

### 1️⃣ **Hook Vault** (`?marketing=hook-vault`)
**Banco de hooks viral que cresce automaticamente**
- ✅ Histórico de todos os hooks já usados
- ✅ Buscável: nicho, tipo, views, criador
- ✅ "Usar este" → copia para clipboard
- ✅ Mostra quantas vezes cada hook foi usado (38×, 24×)
- 🔄 Futura: Reel viral → transcreve áudio → extrai hook automático

### 2️⃣ **Analytics** (`?marketing=analytics`)
**Métricas IG + Heaters (reels que explodiram)**
- 📈 Dados IG: views, saves, follows, volume DM
- 📊 Sparklines (7 / 30 / 90 dias)
- 🔥 Heaters: reel que bateu 2x a mediana
- 🏆 Top 5 com análise: "O que fez este explodir?"

### 3️⃣ **Concorrentes** (`?marketing=concorrentes`)
**Raspagem automática de top content**
- 🤖 Domingo 6h: raspa top 5 reels de cada conta que você segue
- 🎙️ Transcreve áudio automático
- 🔗 Extrai hook + texto em tela
- 👥 @ criador, follower count
- 💾 Botão "salvar no Hook Vault"

### 4️⃣ **Agendador** (`?marketing=agendador`)
**Publica IG/TikTok/YouTube com 1 clique**
- 📱 Escolhe plataformas: Instagram | TikTok | YouTube Shorts
- 🪝 Escolhe hook
- ✍️ Digita ângulo/CTA
- 🤖 Auto-gera legenda completa
- 📅 Escolhe data/hora
- 1️⃣ Um clique = publica em todas (via MCP)

### 5️⃣ **Calendário** (`?marketing=calendario`)
**Visão mensal: tudo que vai sair e quando**
- 📅 Grade mensal (7 colunas x semanas)
- 📍 Cada dia: data, plataformas, contador de posts
- 🖱️ Click → painel lateral com roteiro + legenda
- 🎨 Cores por plataforma

### 6️⃣ **Em Alta** (`?marketing=trending`)
**Feed de notícias com potencial de conteúdo**
- 🤖 Raspa 12 fontes diárias (Anthropic, OpenAI, X lists, RSS)
- 🏷️ Marca cada item: "Potencial de Hook" | "Explicar" | "Pular"
- 📊 Top 5 por recência
- 🔔 Notificação diária 7h com destaques
- 🔗 Deep link para compartilhar ideia

---

## 🏗️ Arquitetura & Padrões

### Estrutura de Pasta
```
src/components/empresa/
├── EmpresaMarketing.tsx              (Router principal)
└── marketing/
    ├── MarketingLayout.tsx          (Sidebar + layout)
    ├── VisaoGeral.tsx               (Page 0)
    ├── HookVault.tsx                (Page 1)
    ├── Analytics.tsx                (Page 2)
    ├── Concorrentes.tsx             (Page 3)
    ├── Agendador.tsx                (Page 4)
    ├── Calendario.tsx               (Page 5)
    ├── EmAlta.tsx                   (Page 6)
    ├── hooks.ts                     (Tipos: HookType, HookNiche)
    ├── audience.ts                  (Lógica de relevância)
    └── AudienceConfig.tsx           (Modal de config)
```

### Navegação
- Query param: `?tab=empresa&marketing=hook-vault`
- Permite deep-linking, volta do navegador funciona
- Sidebar mostra user (@handle, followers, período)
- Tabs ativas destacadas com borda esquerda

### Tipagem
```typescript
type HookType = "SWAP" | "BUILD" | "CLAIM" | "LIST" | "CONTRARIAN" | "STORY" | "CURIOSIDADE"
type HookNiche = "IA" | "SaaS" | "Produtividade" | "Criatividade" | "Tech" | "Startups" | "Marketing" | "Educação" | "Automação" | "Campanhas" | "PME" | "WhatsApp"
```

### Props Padrão
Cada página recebe: `workspaceId: string`

---

## 🔄 Fluxo de Dados (Futuro)

1. **Hooks de audiência** → relevância score (buscável)
2. **IG API** → puxa metrics em tempo real
3. **Scraper de concorrentes** → DOM 6h → armazena hooks
4. **Agendador** → MCP de publicação → Instagram/TikTok/YT
5. **Feed trending** → raspa 12 fontes → notifica 7h

---

## 📋 Checklist de Desenvolvimento

- [ ] **Passo 0:** Estruturar 6 páginas (skeleton com placeholder)
- [ ] **Passo 1:** Hook Vault completo (busca, filtros, CRUD)
- [ ] **Passo 2:** Analytics com dados mockados (sparklines, heaters)
- [ ] **Passo 3:** Concorrentes (layout, dados mockados)
- [ ] **Passo 4:** Agendador (form, auto-geração legenda mockada)
- [ ] **Passo 5:** Calendário (grid mensal, painel lateral)
- [ ] **Passo 6:** Em Alta (feed, marcação potencial)

Depois: integrar backends/MCPs conforme disponível.

---

## 🎨 Design System

**Tema:** Dark mode por padrão, accent terracota (#B8532E)
**Componentes:** shadcn/ui (Button, Dialog, Input, Select, etc)
**Ícones:** lucide-react
**Responsivo:** Mobile-first com Tailwind

---

## 🚀 Começando (Passo 0)

Agora vamos estruturar o skeleton de cada página com placeholders, garantindo que a navegação funciona perfeitamente.
