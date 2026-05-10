# UI/UX Guidelines - Kora Platform DGFlow

## 🎨 Princípios de Design

### 1. **Modo Light/Dark Automático**
- Todos os componentes devem suportar ambos os modos
- Use **variáveis CSS** em vez de cores hardcoded
- Nunca use cores fixas como `#FF0000`, `#0000FF`, etc.

### 2. **Paleta de Cores (Variáveis CSS)**

**Light Mode:**
```
Primary (Laranja):       HSL(32 100% 50%)   #FF8800
Foreground (Preto):      HSL(0 0% 9%)       #171717
Background (Branco):     HSL(0 0% 100%)
Secondary:               HSL(0 0% 94%)
Muted:                   HSL(0 0% 50%)
```

**Dark Mode:**
```
Primary (Laranja):       HSL(32 100% 55%)
Foreground (Branco):     HSL(0 0% 100%)
Background (Escuro):     HSL(0 0% 8%)
Card:                    HSL(0 0% 12%)
```

### 3. **Contraste Adequado**

**Textos:**
- ✅ Preto sobre branco = 7.9:1 (AAA+)
- ✅ Branco sobre cinza escuro = 21:1 (AAA+)
- ❌ Nunca use cores com contraste < 4.5:1

**Cores com Dark Mode Support:**
```css
/* ✅ BOM - Suporta ambos os modos */
text-blue-700 dark:text-blue-400

/* ❌ RUIM - Só funciona em light */
text-blue-500
bg-red-500 text-white
```

### 4. **Componentes de Status**

Use a classe `StatusBadge` para status visíveis:
```tsx
import { StatusBadge } from "@/components/ui/status-badge";

<StatusBadge status="success" label="Ativo" />
<StatusBadge status="error" label="Erro" />
<StatusBadge status="warning" label="Aviso" />
```

**Variantes disponíveis:**
- `success` - Verde (✅ Ativo, Completo)
- `error` - Vermelho (❌ Erro, Crítico)
- `warning` - Âmbar (⚠️ Aviso)
- `info` - Azul (ℹ️ Informação)
- `pending` - Roxo (⏳ Pendente)

### 5. **Badges Coloridas com Dark Mode**

**Pattern correto:**
```tsx
// ✅ BOM
className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"

// ❌ RUIM
className="bg-green-500/10 text-green-500"
```

**Componentes:**
- Fundo: `/15` ou `/20` de opacidade (mais suave)
- Texto light: `-700` (mais escuro)
- Texto dark: `-400` (mais claro)
- Borda light: `-200` (muito clara)
- Borda dark: `-900` (muito escura)

### 6. **Inputs e Formulários**

**Padrão correto:**
```tsx
// Use componentes do @/components/ui
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<Label>Email</Label>
<Input placeholder="seu@email.com" />
```

**Não faça:**
```tsx
// ❌ ERRADO - Cores hardcoded
<input 
  style={{ backgroundColor: '#fff', color: '#000' }}
  placeholder="..."
/>
```

### 7. **Tipografia**

**Fonte:** Montserrat (variável de peso 300-900)

**Tamanhos:**
- `text-3xl` (30px) - Títulos de página (máximo)
- `text-2xl` (24px) - Títulos de seção
- `text-lg` (18px) - Card titles, subtítulos
- `text-base` (16px) - Body text padrão
- `text-sm` (14px) - Labels, hints, tabelas
- `text-xs` (12px) - Badges, timestamps

**Pesos:**
- `font-bold` - Títulos principais
- `font-semibold` - Subtítulos, labels
- `font-medium` - Destaques
- `font-normal` - Body text

### 8. **Border Radius**

**Padrão global:** `0.75rem` (12px) em todos os componentes

- Buttons: `rounded-xl`
- Cards: `rounded-xl`
- Inputs: `rounded-xl`
- Badges: `rounded-xl`
- Dialogs: `rounded-xl`

### 9. **Shadows**

**Usar apenas:**
- `shadow-sm` - Sombra suave para depth
- `shadow-md` - Sombra média para modais
- ❌ Evite múltiplas sombras

### 10. **Transições**

```tsx
// ✅ BOM - Transições suaves
className="transition-colors hover:bg-secondary"
className="transition-all duration-300"

// ❌ RUIM - Sem transição
className="hover:bg-secondary"
```

### 11. **States Visuais**

**Todos os elementos interativos devem ter:**
- `:hover` - Mudança de cor/sombra
- `:focus` - Ring com color primary
- `:active` - Destaque mais forte
- `:disabled` - Opacidade reduzida

```tsx
// ✅ BOM
className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring disabled:opacity-50"
```

### 12. **Acessibilidade (WCAG AA+)**

- ✅ Contraste mínimo 4.5:1 para texto
- ✅ Contraste mínimo 3:1 para componentes
- ✅ Todos os inputs devem ter labels
- ✅ Use `aria-labels` em ícones sem texto
- ✅ Ordem de tab deve fazer sentido
- ✅ Teclado deve controlar tudo

### 13. **O Que Evitar**

❌ Cores hardcoded como `#FF0000`, `#0000FF`
❌ Fontes diferentes de Montserrat
❌ Border radius diferente de 12px
❌ Múltiplas sombras complexas
❌ Transições lentas (> 400ms)
❌ Contraste < 4.5:1
❌ Tamanhos de fonte muito grandes
❌ Estados visuais ausentes

## 📝 Checklist para Novos Componentes

- [ ] Suporta light mode
- [ ] Suporta dark mode
- [ ] Usa variáveis CSS (nunca cores hardcoded)
- [ ] Contraste >= WCAG AA (4.5:1)
- [ ] Border radius = 12px
- [ ] Tem estados :hover, :focus, :active
- [ ] Tipografia Montserrat com pesos corretos
- [ ] Transições suaves (250-300ms)
- [ ] Acessível (labels, aria-labels)
- [ ] Testado em light e dark mode

---

**Última atualização:** 2026-04-28
