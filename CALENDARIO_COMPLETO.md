# 📅 Calendário Editorial Completo - Koraflow

## ✨ Features Implementadas

Um calendário **COMPLETO** para gerenciar todos os seus posts agendados!

---

## 📊 Componentes

### 1. **Visualização Mensal (Grade 7x Semanas)**
```
         Dom    Seg    Ter    Qua    Qui    Sex    Sab
Semana 1  1      2      3      4      5      6      7
Semana 2  8      9      10  [11]    12     13     14
Semana 3  15     16     17     18     19     20     21
Semana 4  22     23     24     25     26     27     28
```

**Indicadores Visuais:**
- ✅ Dia de hoje destacado em azul
- 🟩 Dias com posts: fundo cinza
- ⚪ Dias vazios: fundo cinza claro
- 🔵 Pontos coloridos: plataformas agendadas
- ➕ Label "+N": mais posts naquele dia

### 2. **Navegação**
- `◀ Mês anterior` - Voltar ao mês anterior
- `Hoje` - Volta para o mês/dia atual
- `Mês próximo ▶` - Avança para próximo mês

---

## 🎯 Detalhes do Post (Sidebar)

Quando você clica em um dia com posts, aparecem:

### Header
- Fechar (X)
- Título "Post Agendado"

### Informações
```
DATA: Segunda, 5 de julho

PLATAFORMAS:
📷 Instagram  |  🎵 TikTok

STATUS:
📅 Agendado  (verde)
✅ Postado    (azul)
📝 Rascunho   (âmbar)
```

### Conteúdo
```
🎯 HOOK
Para de fazer X. Começa a fazer Y.

💡 ÂNGULO
Mostre como economizou 40 horas/mês

🔗 CTA
Clique no link da bio

📝 LEGENDA
Você precisa de um painel de conteúdo viral.
Aqui está como criar algo que explode...
```

### Ações
- `📋 Copiar Legenda` - Copia para clipboard
- `🗑️ Deletar Post` - Remove do calendário

---

## 📊 Cards de Estatísticas

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ AGENDADOS   │  │  POSTADOS   │  │ RASCUNHOS   │  │   TOTAL     │
│             │  │             │  │             │  │             │
│      4      │  │      0      │  │      2      │  │      6      │
│   🟢 Verde  │  │   🔵 Azul   │  │ 🟡 Âmbar    │  │ 🟣 Roxo     │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🎨 Cores por Plataforma

| Plataforma | Cor | Emoji | Código |
|-----------|-----|-------|--------|
| Instagram | Rosa | 📷 | #ec4899 |
| TikTok | Preto/Branco | 🎵 | #000000 / #ffffff |
| YouTube | Vermelho | 📺 | #dc2626 |

---

## 🗓️ Dados dos Posts

Cada post agendado contém:

```json
{
  "id": "1",
  "date": "2026-07-05",
  "platforms": ["instagram", "tiktok"],
  "caption": "Você precisa de um painel de conteúdo viral...",
  "hook": "Para de fazer X. Começa a fazer Y.",
  "angle": "Mostre como economizou 40 horas/mês",
  "cta": "Clique no link da bio",
  "status": "scheduled"
}
```

**Campos:**
- `id`: Identificador único
- `date`: Data em formato YYYY-MM-DD
- `platforms`: Array com plataformas (instagram, tiktok, youtube)
- `caption`: Legenda completa do post
- `hook`: Hook psicológico utilizado
- `angle`: Seu ângulo/insight pessoal (opcional)
- `cta`: Call-to-action (opcional)
- `status`: scheduled | posted | draft

---

## 📋 Exemplos de Posts

### Post 1: Multi-plataforma
```
Data: 5 de julho
Plataformas: 📷 Instagram | 🎵 TikTok
Status: 📅 Agendado
Hook: Para de fazer X. Começa a fazer Y.
Ângulo: Mostre como economizou 40 horas/mês
CTA: Clique no link da bio
```

### Post 2: YouTube Shorts
```
Data: 8 de julho
Plataformas: 📺 YouTube
Status: 📅 Agendado
Hook: Construí um sistema de automação
(Sem ângulo/CTA)
```

### Post 3: Rascunho
```
Data: 10 de julho
Plataformas: 📷 Instagram
Status: 📝 Rascunho
Hook: Ninguém tá falando de...
```

---

## 🎯 Fluxo de Uso

### 1. Ver Calendário
```
Empresa > Marketing > CALENDÁRIO
```

### 2. Navegar Meses
- Clique em `◀` para ir ao mês anterior
- Clique em `Hoje` para voltar ao mês atual
- Clique em `▶` para ir ao próximo mês

### 3. Selecionar Post
- Clique em qualquer dia COM posts (fundo cinza)
- O painel lateral carrega o primeiro post daquele dia
- Se houver múltiplos posts no dia, vê o primeiro

### 4. Ver Detalhes
- Veja data, plataformas, status na parte superior
- Veja hook, ângulo, CTA, legenda embaixo

### 5. Ações
- Copiar legenda com um clique
- Deletar post com confirmação

### 6. Mudar de Post
- Clique no X para fechar sidebar
- Clique em outro dia
- Sidebar abre com novo post

---

## 🔄 Interatividade

### Hover Effects
- Cards dos dias: muda cor ao passar mouse
- Posts no sidebar: highlight ao passar mouse

### Click Actions
- Dia vazio: nada acontece
- Dia com posts: abre sidebar
- Botão copiar: copia e mostra toast
- Botão deletar: remove e fecha sidebar

### Persistência
- Posts salvos em estado local React
- Ao deletar, atualiza imediatamente
- Ao recarregar página, posts são rescarregados

---

## 🎨 Design

### Layout
```
┌─ HEADER ────────────────────────────────────────┐
│ Título | Mês | Nav Buttons        | Total Stats │
└─────────────────────────────────────────────────┘

┌─ MAIN ───────────────┬─ SIDEBAR ────────────────┐
│                      │                          │
│  CALENDÁRIO MENSAL   │  POST DETAILS           │
│  (Grade 7x Semanas)  │  - Data                 │
│                      │  - Plataformas          │
│                      │  - Status               │
│                      │  - Hook / Angle / CTA   │
│                      │  - Legenda              │
│                      │  - Botões de ação       │
│                      │                          │
└──────────────────────┴──────────────────────────┘

┌─ STATS ──────────────────────────────────────────┐
│ Agendados | Postados | Rascunhos | Total        │
└──────────────────────────────────────────────────┘
```

### Cores
- Dark mode nativo
- Azul para hoje
- Cinza para dias com posts
- Cores específicas por status (verde, azul, âmbar)
- Cores específicas por plataforma

---

## 💾 Dados Atuais (Mock)

```
6 Posts Totais:
✅ 2026-07-05: Instagram + TikTok (Agendado)
✅ 2026-07-08: YouTube (Agendado)
✅ 2026-07-10: Instagram (Rascunho)
✅ 2026-07-15: Instagram + TikTok + YouTube (Agendado)
✅ 2026-07-20: TikTok (Rascunho)
✅ 2026-07-22: Instagram + YouTube (Agendado)

Stats:
- Agendados: 4
- Postados: 0
- Rascunhos: 2
- Total: 6
```

---

## 🚀 Próximas Funcionalidades

1. **Editar Post**
   - Botão "Editar" no sidebar
   - Modal com formulário para editar

2. **Criar Post Novo**
   - Botão "Novo Post" no header
   - Modal com formulário completo
   - Selecionar data, plataformas, conteúdo

3. **Filtros**
   - Filtrar por plataforma
   - Filtrar por status
   - Buscar por keyword

4. **Arrastar e Soltar**
   - Reagendar posts arrastando entre dias

5. **Integração com Agendador**
   - Quando agenda novo post, aparece no calendário

6. **Notificações**
   - Lembrete de posts agendados
   - Alert de posts prontos para postar

7. **Exportar**
   - PDF do calendário mensal
   - CSV com dados dos posts

8. **Temas de Visualização**
   - Semana (7 dias)
   - Dia (detalhado)
   - Lista (todos os posts)

---

## ✅ Status

| Feature | Status |
|---------|--------|
| Visualização Mensal | ✅ Completo |
| Navegação de Meses | ✅ Funcional |
| Sidebar com Detalhes | ✅ Completo |
| Cores por Plataforma | ✅ Implementado |
| Copiar Legenda | ✅ Funcional |
| Deletar Posts | ✅ Funcional |
| Stats Cards | ✅ Completo |
| Responsivo | ✅ Sim |
| Dark Mode | ✅ Sim |

---

**Versão:** 1.0 - Calendário Editorial  
**Data:** 2026-07-01  
**Status:** ✅ Pronto para Usar

Agora você tem controle total sobre seus posts agendados! 📅🚀
