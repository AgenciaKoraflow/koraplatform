# 🖱️ Guia de Elementos Clicáveis - Padrão de Implementação

**Objetivo:** Tornar toda a plataforma clicável - cards, linhas de tabela, botões devem abrir modais.

---

## 📋 Padrão a Seguir

### Para TableRows (Tabelas):

```tsx
// Antes (não clicável):
<TableRow key={item.id}>
  <TableCell>{item.name}</TableCell>
  <TableCell>{item.value}</TableCell>
</TableRow>

// Depois (clicável):
<TableRow 
  key={item.id}
  className="cursor-pointer hover:bg-muted/50 transition-colors"
  onClick={() => handleViewItem(item.id)}
>
  <TableCell>{item.name}</TableCell>
  <TableCell>{item.value}</TableCell>
</TableRow>
```

### Para Cards (Grid):

```tsx
// Antes (não clicável):
<div className="p-4 rounded-lg bg-card border border-border">
  <h3>{item.name}</h3>
  <p>{item.value}</p>
</div>

// Depois (clicável):
<div 
  className="p-4 rounded-lg bg-card border border-border cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
  onClick={() => handleViewItem(item.id)}
>
  <h3>{item.name}</h3>
  <p>{item.value}</p>
</div>
```

### Para Kanban/Colunas:

```tsx
// Antes:
<div className="p-3 rounded-lg bg-card border border-border">
  <p>{item.name}</p>
</div>

// Depois:
<div 
  className="p-3 rounded-lg bg-card border border-border cursor-pointer hover:shadow-md hover:border-primary transition-all"
  onClick={() => handleViewItem(item.id)}
>
  <p>{item.name}</p>
</div>
```

---

## 🎨 CSS Classes para Adicionar

```tsx
// Sempre adicionar essas classes ao elemento clicável:
className="cursor-pointer hover:bg-muted/50 transition-colors"

// Para cards, adicionar shadow também:
className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
```

---

## 📌 Páginas a Atualizar (Prioridade)

### Críticas (Tem modal já):
- [ ] **Contratos** - TableRow + Cards (clique já funciona parcialmente)
- [ ] **Financeiro** - TableRow (já implementado)
- [ ] **OKR** - Cards/Lista

### Altas (Precisa modal):
- [ ] **Clientes** - Cards + Kanban (tem modal já)
- [ ] **Projetos** - Cards + Lista
- [ ] **Propostas** - Cards
- [ ] **Tarefas** - Cards
- [ ] **Processos** - Cards

### Médias:
- [ ] **Sustentação** - Cards
- [ ] **Conhecimento** - Cards
- [ ] **Observabilidade** - Cards
- [ ] **Indicadores** - Cards
- [ ] **Funil** - Cards

### Baixas:
- [ ] **ClientesAtivos** - Cards (só exibição)
- [ ] **Configurações** - Se houver modais

---

## ✅ Checklist por Página

### Exemplo: Clientes

```tsx
// 1. Adicionar handler
const handleViewClient = (clientId: string) => {
  setViewingClientId(clientId);
  setIsViewDialogOpen(true);
};

// 2. Adicionar onClick a cards (grid view)
{filteredClients.map((client) => (
  <div 
    key={client.id}
    className="p-4 rounded-lg bg-card border border-border cursor-pointer hover:shadow-lg transition-all"
    onClick={() => handleViewClient(client.id)}
  >
    {/* conteúdo */}
  </div>
))}

// 3. Adicionar onClick a kanban items
{getClientsByStage(stage).map((client) => (
  <div 
    className="p-3 rounded-lg bg-card border cursor-pointer hover:shadow-md transition-all"
    onClick={() => handleViewClient(client.id)}
  >
    {/* conteúdo */}
  </div>
))}
```

---

## 🔄 Evento de Click não Deve Abrir Menu

**Problema comum:** Click abre modal MAS também abre o ActionMenu

**Solução:**
```tsx
// No ActionMenu cell, parar propagação:
<TableCell onClick={(e) => e.stopPropagation()} className="text-right">
  <ActionMenu items={[...]} />
</TableCell>
```

---

## 📱 Responsividade

Não esquecer que elementos clicáveis em mobile devem:
- Ter tamanho mínimo de 44x44px (toque confortável)
- Feedback visual claro (hover/active states)

```tsx
// Mobile-friendly
className="p-4 rounded-lg cursor-pointer hover:bg-muted/50 active:bg-muted transition-all"
```

---

## 🎯 Ordem de Implementação Recomendada

**Dia 1:** Contratos + Financeiro (já têm modais)  
**Dia 2:** Clientes + Projetos (core business)  
**Dia 3:** Propostas + Tarefas (importantes)  
**Dia 4:** Resto da plataforma  

---

## 📝 Template Rápido (Copiar e Colar)

```tsx
// Para qualquer elemento:
onClick={() => {
  setViewing[Item]Id(item.id);
  setIsView[Item]DialogOpen(true);
}}
className="cursor-pointer hover:bg-muted/50 hover:shadow-lg transition-all"
```

---

## ✨ Resultado Final

Toda a plataforma terá:
- ✅ Cursor pointer em elementos clicáveis
- ✅ Hover states (bg/shadow change)
- ✅ Smooth transitions (não jarretado)
- ✅ Abre modal ao clicar
- ✅ Mobile-friendly touch targets
- ✅ Feedback visual claro

**Benefício para o usuário:** Experiência intuitiva - sempre sabe que pode clicar! 🎉

