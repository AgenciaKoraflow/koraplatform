# Guia de Tipografia - Kora Platform

## Sistema de Escalas de Fonte

O projeto utiliza um sistema de tipografia harmonioso baseado em Tailwind CSS com escalas padronizadas:

### Tamanhos Disponíveis

| Classe | Tamanho | Uso | Exemplo |
|--------|---------|-----|---------|
| `text-xs` | 11px | Labels, badges, detalhes | Datas, IDs, categorias pequenas |
| `text-sm` | 13px | Texto principal, descrições | Body text, parágrafos |
| `text-base` | 14px | Padrão, conteúdo | Descrições de cards |
| `text-lg` | 15px | Títulos pequenos | Subtítulos de seções |
| `text-xl` | 16px | Valores destacados | Números de estatísticas (métricas) |
| `text-2xl` | 18px | Títulos de seção | Cabeçalhos de cards/modais |
| `text-3xl` | 20px | Títulos de página | Headers principais |
| `text-4xl` | 24px | (Evitar) | Reservado para casos especiais |

## Classes de Tipografia Predefinidas

Utilize as classes em `src/lib/typography.ts` para garantir consistência:

```typescript
typographyClasses = {
  pageTitle: "text-3xl font-bold text-foreground",
  sectionTitle: "text-2xl font-semibold text-foreground",
  subsectionTitle: "text-lg font-semibold text-foreground",
  cardTitle: "text-base font-semibold text-foreground",
  body: "text-sm text-foreground",
  bodyMuted: "text-sm text-muted-foreground",
  label: "text-xs font-medium text-foreground",
  labelMuted: "text-xs font-medium text-muted-foreground",
  statValue: "text-xl font-bold text-foreground",
  statLabel: "text-xs font-medium text-muted-foreground",
  button: "text-sm font-medium",
  buttonSmall: "text-xs font-medium",
  link: "text-sm font-medium text-primary hover:underline",
  badge: "text-xs font-semibold",
  description: "text-sm text-muted-foreground",
}
```

## Padrões de Uso

### Páginas
```tsx
<h1 className={typographyClasses.pageTitle}>Título da Página</h1>
```

### Seções
```tsx
<h2 className={typographyClasses.sectionTitle}>Título da Seção</h2>
<p className={typographyClasses.description}>Descrição da seção</p>
```

### Cards/Modais
```tsx
<div>
  <h3 className={typographyClasses.cardTitle}>Título do Card</h3>
  <p className={typographyClasses.body}>Conteúdo do card</p>
</div>
```

### Estatísticas
```tsx
<div>
  <div className={typographyClasses.statValue}>123</div>
  <div className={typographyClasses.statLabel}>Descrição da métrica</div>
</div>
```

### Labels e Inputs
```tsx
<Label className={typographyClasses.label}>Nome do Campo</Label>
<Input placeholder="Digite aqui..." />
```

## Melhores Práticas

1. **Nunca use `text-4xl` em interfaces normais** - Reserve apenas para casos muito especiais
2. **Sempre use `text-sm` como padrão de corpo** - Proporciona boa legibilidade
3. **Use cores semânticas com tipografia**:
   - `text-foreground` para texto principal
   - `text-muted-foreground` para texto secundário
   - `text-primary` para links e destaque
4. **Font weights padronizados**:
   - `font-medium` para labels e pequenos destaques
   - `font-semibold` para títulos
   - `font-bold` apenas para destaques muito importantes
5. **Line height automático** - As classes já incluem line-height apropriado

## Hierarquia Visual

```
Página (text-3xl, bold) 
├── Seção (text-2xl, semibold)
│   ├── Subtítulo (text-lg, semibold)
│   └── Body text (text-sm)
└── Stats/Métricas (text-xl, bold)
```

## Importação e Uso

```tsx
import { typographyClasses } from "@/lib/typography";
import { cn } from "@/lib/utils";

// Uso simples
<h1 className={typographyClasses.pageTitle}>Título</h1>

// Uso com classes adicionais
<h2 className={cn(typographyClasses.sectionTitle, "mb-4")}>Seção</h2>
```

## Checklist para Novas Páginas

- [ ] Títulos de página use `pageTitle`
- [ ] Títulos de seção use `sectionTitle`
- [ ] Corpo use `body` ou `bodyMuted`
- [ ] Labels use `label`
- [ ] Descrições use `description`
- [ ] Estatísticas use `statValue` + `statLabel`
- [ ] Nenhum `text-3xl` ou maior sem aprovação
- [ ] Todos os textos têm contraste adequado

---

**Última atualização**: 2026-05-07
**Responsável**: Design System
