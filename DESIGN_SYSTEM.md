# 🎨 Design System - Kora Platform

## Visão Geral

O Kora Platform agora implementa um sistema de design robusto e consistente, com ênfase em tipografia harmônica, espacamento adequado e melhores práticas de UI/UX.

---

## 📐 Tipografia

### Escala de Tamanhos

A tipografia segue uma escala harmônica de 11px a 24px, otimizada para legibilidade e hierarquia visual:

```
text-xs  (11px)  → Labels, badges, footnotes
text-sm  (13px)  → Texto principal, descrições
text-base (14px) → Padrão, conteúdo normal
text-lg  (15px)  → Títulos pequenos, subtítulos
text-xl  (16px)  → Valores destacados, métricas
text-2xl (18px)  → Títulos de seção, headers
text-3xl (20px)  → Títulos de página (máximo recomendado)
text-4xl (24px)  → ⚠️ Evitar (apenas casos especiais)
```

### Line Height e Letter Spacing Automáticos

Cada tamanho inclui `line-height` e `letter-spacing` adequados para melhor legibilidade:

```typescript
fontSize: {
  xs: ['11px', { lineHeight: '1.4', letterSpacing: '0.3px' }],
  sm: ['13px', { lineHeight: '1.5', letterSpacing: '0.2px' }],
  base: ['14px', { lineHeight: '1.6', letterSpacing: '0px' }],
  // ...
}
```

### Classes de Tipografia Predefinidas

Utilize `src/lib/typography.ts` para manter consistência:

```tsx
import { typographyClasses } from "@/lib/typography";

// Página
<h1 className={typographyClasses.pageTitle}>Título</h1>

// Seção
<h2 className={typographyClasses.sectionTitle}>Seção</h2>

// Corpo
<p className={typographyClasses.body}>Texto normal</p>

// Estatísticas
<div className={typographyClasses.statValue}>123</div>
<div className={typographyClasses.statLabel}>Descrição</div>
```

---

## 🎯 Hierarquia Visual

```
┌─────────────────────────────────────────────┐
│  PAGE TITLE (text-3xl, bold)               │
│  ─────────────────────────────────         │
│                                             │
│  Section Title (text-2xl, semibold)       │
│  ───────────────────────────────          │
│                                             │
│  Subsection (text-lg, semibold)            │
│  • Body text (text-sm, regular)            │
│  • Body text (text-sm, muted)              │
│                                             │
│  ┌──────────────────────────────────────┐ │
│  │ Card Title (text-base, semibold)     │ │
│  │ Card description (text-sm)           │ │
│  │ • Stat Value: 123 (text-xl, bold)   │ │
│  │ • Stat Label (text-xs, muted)        │ │
│  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## ✅ Melhorias Implementadas

### 1. Tipografia Harmonizada
- ✅ Removidos `text-3xl` e `text-4xl` desnecessários
- ✅ Padronizado para `text-xl` em valores de estatísticas
- ✅ Reduzido `text-2xl` para `text-base` em títulos de cards
- ✅ Eliminados tamanhos customizados (`text-[10px]`, `text-[11px]`)

### 2. Consistência Semântica
- ✅ Criado arquivo `typography.ts` com classes predefinidas
- ✅ Atualizado `tailwind.config.ts` com escala harmônica
- ✅ Aplicado a todas as páginas principais:
  - ✅ OKR.tsx
  - ✅ Financeiro.tsx
  - ✅ Indicadores.tsx
  - ✅ Observabilidade.tsx
  - ✅ Contratos.tsx
  - ✅ Tarefas.tsx
  - ✅ ClientesAtivos.tsx
  - ✅ SignContract.tsx

### 3. Line Height e Espaçamento
- ✅ Automaticamente incluído em cada tamanho
- ✅ Melhora legibilidade e conforto visual
- ✅ Mantém proporções harmônicas

### 4. Cores Semânticas
- ✅ `text-foreground` para texto principal
- ✅ `text-muted-foreground` para texto secundário
- ✅ `text-primary` para links e destaques
- ✅ Classes de cor por status (success, warning, danger)

---

## 📁 Estrutura de Arquivos

```
src/
├── lib/
│   └── typography.ts          ← Classes predefinidas
├── pages/
│   ├── OKR.tsx               ✓ Corrigida
│   ├── Financeiro.tsx        ✓ Corrigida
│   ├── Indicadores.tsx       ✓ Corrigida
│   ├── Observabilidade.tsx   ✓ Corrigida
│   ├── Contratos.tsx         ✓ Corrigida
│   ├── Tarefas.tsx           ✓ Corrigida
│   └── ... (outras páginas)
├── tailwind.config.ts        ✓ Atualizada
└── TYPOGRAPHY_GUIDE.md       ← Documentação
```

---

## 🚀 Como Usar

### Adicione a Importação
```tsx
import { typographyClasses } from "@/lib/typography";
import { cn } from "@/lib/utils";
```

### Use as Classes Predefinidas
```tsx
// Título de página
<h1 className={typographyClasses.pageTitle}>Dashboard</h1>

// Título de seção
<h2 className={typographyClasses.sectionTitle}>Métricas</h2>

// Valor com label
<div>
  <div className={typographyClasses.statValue}>€ 42,500</div>
  <div className={typographyClasses.statLabel}>Receita Total</div>
</div>

// Com espaçamento adicional
<p className={cn(typographyClasses.body, "mb-4")}>Descrição...</p>
```

---

## 📊 Comparação Antes x Depois

| Elemento | Antes | Depois | Benefício |
|----------|-------|--------|-----------|
| Stats | `text-2xl` | `text-xl` | Menos dominante, mais equilibrado |
| Card Titles | `text-xl` | `text-base` | Proporção correta com conteúdo |
| Métrica Labels | `text-[10px]` | `text-xs` | Consistente, otimizado |
| Valores | Sem padrão | `text-xl bold` | Hierarquia clara |
| Line Height | Não especificado | Automático | Melhor legibilidade |

---

## ♿ Acessibilidade

- ✅ Contraste adequado (WCAG AA+)
- ✅ Tamanhos legíveis (mínimo 11px)
- ✅ Line height proporcional (1.4x - 1.8x)
- ✅ Hierarquia visual clara
- ✅ Espaçamento adequado entre elementos

---

## 🔄 Manutenção Futura

### Ao Adicionar Novas Páginas:
1. Importe `typographyClasses` e `cn`
2. Use classes predefinidas para títulos e corpo
3. Valide nunca usar `text-4xl`
4. Teste a legibilidade em diferentes tamanhos
5. Verifique o contraste de cores

### Atualizações de Design:
Se precisar ajustar a escala tipográfica:
1. Atualize `tailwind.config.ts` (fontSize)
2. Atualize `src/lib/typography.ts`
3. Atualize `TYPOGRAPHY_GUIDE.md`
4. Teste em todas as páginas principais

---

## 📞 Suporte

Para questões sobre tipografia ou design:
1. Consulte `TYPOGRAPHY_GUIDE.md`
2. Revise `src/lib/typography.ts`
3. Verifique exemplos em páginas já corrigidas

---

**Status**: ✅ Sistema Implementado e Testado  
**Data**: 2026-05-07  
**Responsável**: Design System  
**Dev Server**: ✅ Funcionando (Status 200)
