# ⚡ Quick Start - Tipografia

## TL;DR

### Importe sempre:
```tsx
import { typographyClasses } from "@/lib/typography";
import { cn } from "@/lib/utils";
```

### Use as classes:
```tsx
// Títulos
<h1 className={typographyClasses.pageTitle}>Página</h1>
<h2 className={typographyClasses.sectionTitle}>Seção</h2>
<h3 className={typographyClasses.subsectionTitle}>Subtítulo</h3>
<h4 className={typographyClasses.cardTitle}>Card</h4>

// Corpo
<p className={typographyClasses.body}>Texto normal</p>
<p className={typographyClasses.bodyMuted}>Texto secundário</p>

// Elementos especiais
<div className={typographyClasses.statValue}>123</div>
<div className={typographyClasses.statLabel}>Descrição</div>

// Com espaçamento
<p className={cn(typographyClasses.body, "mb-4")}>Com margem</p>
```

---

## 📏 Tamanhos por Tipo

| Elemento | Classe | Tamanho |
|----------|--------|---------|
| Página Title | `pageTitle` | 20px bold |
| Seção Title | `sectionTitle` | 18px semibold |
| Subtítulo | `subsectionTitle` | 15px semibold |
| Card Title | `cardTitle` | 14px semibold |
| Corpo | `body` | 13px regular |
| Corpo Muted | `bodyMuted` | 13px regular + cor muted |
| Label | `label` | 11px medium |
| Stat Value | `statValue` | 16px bold |
| Stat Label | `statLabel` | 11px medium + muted |
| Link | `link` | 13px medium + primary |
| Descrição | `description` | 13px regular + muted |

---

## ❌ O que NÃO fazer

```tsx
// ❌ EVITAR
<h1 className="text-4xl">Muito grande</h1>
<p className="text-[15px]">Custom size</p>
<div className="text-2xl">Desproporcionado</div>

// ✅ FAZER
<h1 className={typographyClasses.pageTitle}>Correto</h1>
<p className={typographyClasses.body}>Correto</p>
<div className={typographyClasses.statValue}>Correto</div>
```

---

## 🎯 Padrão por Página

```tsx
export default function MinhaPage() {
  return (
    <AppLayout>
      {/* Título da página */}
      <h1 className={typographyClasses.pageTitle}>
        Dashboard
      </h1>
      
      {/* Seção com cards */}
      <div className="mt-8">
        <h2 className={typographyClasses.sectionTitle}>
          Métricas
        </h2>
        
        <div className="grid gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className={typographyClasses.cardTitle}>
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={typographyClasses.statValue}>
                1,234
              </div>
              <div className={typographyClasses.statLabel}>
                Descrição
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Seção com lista */}
      <div className="mt-8">
        <h2 className={typographyClasses.sectionTitle}>
          Itens
        </h2>
        
        {items.map(item => (
          <div key={item.id} className="mt-4">
            <h3 className={typographyClasses.subsectionTitle}>
              {item.title}
            </h3>
            <p className={typographyClasses.description}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
```

---

## 📋 Checklist ao Criar Nova Página

- [ ] Importei `typographyClasses` e `cn`?
- [ ] Títulos usam `pageTitle` ou `sectionTitle`?
- [ ] Corpo usa `body` ou `description`?
- [ ] Labels usam `label`?
- [ ] Valores destacados usam `statValue`?
- [ ] Nenhum `text-4xl` ou `text-[...px]`?
- [ ] Testei em desktop, tablet e mobile?

---

## 🚀 Depois de Implementar

1. Execute o dev server:
   ```bash
   npm run dev
   ```

2. Verifique no navegador:
   - Tipografia está clara?
   - Todos os textos legíveis?
   - Hierarquia visual faz sentido?

3. Se modificar escala:
   - Atualize `tailwind.config.ts`
   - Atualize `src/lib/typography.ts`
   - Atualize documentação

---

## 📞 Dúvidas?

Consulte:
1. **TYPOGRAPHY_GUIDE.md** - Guia completo
2. **DESIGN_SYSTEM.md** - Sistema de design
3. Páginas já corrigidas: OKR.tsx, Financeiro.tsx

---

**Versão**: 1.0  
**Atualizado**: 2026-05-07  
**Status**: ✅ Implementado
