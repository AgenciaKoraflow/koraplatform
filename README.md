# KoraPlatform

## Tecnologias

- Vite + TypeScript + React 18 (React Router DOM)
- shadcn-ui + Tailwind CSS
- Supabase (Postgres + Auth + Edge Functions)
- Deploy: Vercel

## Desenvolvimento local

Pré-requisito: Node.js & npm — [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating). O projeto também tem `bun.lockb`, então `bun install` funciona como alternativa ao npm.

```sh
# Instalar dependências
npm i

# Copiar variáveis de ambiente e preencher com as chaves do projeto Supabase
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

Backend/Supabase (tabelas, RLS, Edge Functions): siga o passo a passo em [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) e as migrations em `supabase/migrations/`.

## Build

```sh
npm run build
```

---

## Continuando o trabalho em outra máquina (setup do assistente Claude Code)

Este projeto é desenvolvido com apoio do **Claude Code** (CLI da Anthropic). Para reproduzir o mesmo ambiente de assistente em outra máquina:

### 1. Instalar o Claude Code

Siga as instruções em [docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code` ou o instalador nativo) e autentique com `claude login`.

### 2. Ler o contexto do projeto

O arquivo [`CLAUDE.md`](./CLAUDE.md), na raiz do repo, contém as instruções e o roadmap do projeto (páginas do Marketing Dashboard, arquitetura, checklist de desenvolvimento). O Claude Code carrega esse arquivo automaticamente — é o primeiro lugar para entender "onde paramos".

### 3. Plugin instalado: Vercel Plugin

Usado para deploy, env vars e boas práticas de Next/Vite na Vercel (o projeto tem `vercel.json` configurado para deploy do build da Vite como SPA).

```sh
npx plugins add vercel/vercel-plugin
```

Não precisa de configuração adicional — o plugin injeta automaticamente skills (`deployments-cicd`, `env-vars`, `vercel-cli`, etc.) e agentes (`deployment-expert`, `performance-optimizer`, `ai-architect`) de acordo com o que está sendo feito.

### 4. Skills nativas usadas no dia a dia

Já vêm com o Claude Code, sem instalação extra — chamadas via `/comando`:

- `/code-review` — revisão de diffs antes de commitar (bugs, simplificação)
- `/security-review` — revisão de segurança das mudanças pendentes (crítico aqui, já tivemos credenciais expostas — ver histórico do projeto)
- `/run` — sobe o app localmente e valida a mudança no navegador
- `/verify` — confirma que uma alteração funciona de fato, rodando o app
- `/simplify` — limpeza de código alterado (reuso, eficiência)
- `/init` — gerar/atualizar `CLAUDE.md`

### 5. Skills de terceiros instaladas neste repositório

Instaladas via [`npx skills`](https://skills.sh) (pacote `skills`, ecossistema aberto de agent skills), na pasta `.claude/skills/` — que é gitignorada, então cada máquina precisa reinstalar. O manifesto `skills-lock.json` (esse sim versionado) registra exatamente quais e de onde, então **rode os comandos abaixo depois de clonar o repo** para restaurar o mesmo conjunto:

```sh
npx skills add https://github.com/anthropics/skills --skill frontend-design -a claude-code -y
npx skills add https://github.com/shadcn/ui --skill shadcn -a claude-code -y
npx skills add https://github.com/juliusbrussee/caveman --skill caveman -a claude-code -y
npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices -a claude-code -y
npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -a claude-code -y
npx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit -a claude-code -y
npx skills add https://github.com/jamditis/claude-skills-journalism --skill security-checklist -a claude-code -y
npx skills add https://github.com/anthropics/knowledge-work-plugins --skill code-review -a claude-code -y
```

> A flag `-a claude-code` é obrigatória — sem ela, o CLI pode instalar num destino genérico (`.agents/skills/`) que o Claude Code não lê, deixando a skill instalada mas inativa.

- `frontend-design` (anthropics/skills) — boas práticas de UI/frontend
- `shadcn` (shadcn/ui) — uso correto dos componentes shadcn/ui já adotados no projeto
- `caveman` (juliusbrussee/caveman) — modo de comunicação ultra-compacto (reduz tokens)
- `supabase-postgres-best-practices` (supabase/agent-skills) — boas práticas de Postgres/RLS no Supabase (backend deste projeto)
- `ui-ux-pro-max` (nextlevelbuilder/ui-ux-pro-max-skill) — diretrizes avançadas de UI/UX
- `seo-audit` (coreyhaines31/marketingskills) — auditoria de SEO (relevante para o módulo de Marketing/Em Alta)
- `security-checklist` (jamditis/claude-skills-journalism) — checklist de segurança
- `code-review` (anthropics/knowledge-work-plugins) — revisão de código (substitui/complementa o `/code-review` nativo)

⚠️ O instalador reporta avaliações de risco por fonte (Gen/Socket/Snyk) — o `seo-audit` foi sinalizado como **"Med Risk"** pelo Snyk no momento da instalação. Vale revisar o `SKILL.md` de cada skill de terceiro antes de confiar nela com dados sensíveis, já que rodam com permissões completas do agente.

Comandos úteis para gerenciar depois de instaladas:

```sh
npx skills list          # lista o que está instalado
npx skills update        # atualiza todas para a versão mais recente
npx skills remove <nome> # remove uma skill específica (NUNCA use --all sem querer remover tudo)
```

### 6. Conectores MCP (nível de conta claude.ai)

Estes conectores estão associados à conta Claude.ai (`ferramentas@koraflow.com.br`), não ao repositório — em outra máquina, autorize-os em **claude.ai → Settings → Connectors** (ou via `/mcp` numa sessão interativa do Claude Code) caso as tarefas envolvam:

- **Google Drive** — leitura/gestão de arquivos
- **Canva** — geração/edição de designs
- **Gmail** e **Google Calendar** — requerem autorização OAuth manual (indisponíveis em sessões não-interativas)
- **n8n** — automações

### 7. Memória persistente do assistente

O Claude Code mantém memória entre conversas (decisões de arquitetura, convenções, pendências de segurança) fora do repositório, em `~/.claude/projects/.../memory/`. Essa memória **não é versionada nem portátil entre máquinas** — em uma máquina nova, o assistente reconstrói o contexto a partir do `CLAUDE.md`, do histórico do git e do que for perguntado na conversa.
