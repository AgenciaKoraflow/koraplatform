# 🚀 Teste Manual - Agendador (Passo 4)

## Fluxo Completo de Teste

### 1. Abra a aplicação
```bash
npm run dev
# Abre em http://localhost:8092 (ou porta livre)
```

### 2. Navegue para Marketing Dashboard
- Clique em **Empresa** (no menu lateral)
- Clique na aba **Marketing**
- Você verá 7 abas: Visão Geral, Hook Vault, Analytics, etc.

### 3. Teste o Hook Vault → Agendador Flow
**Passo 3.1:** Na aba **Hook Vault**:
- Veja os 50 hooks com filtros por Dor e Gatilho Emocional
- Clique no botão **"Usar este"** em qualquer hook

**Esperado:** 
- ✅ Toast aparece: "Hook copiado! Levando para o Agendador... 🚀"
- ✅ Navegação automática para a aba **Agendador**
- ✅ Hook aparece carregado com todos os metadados (dor, gatilho, tipo)

### 4. Teste o Agendador Completo
**Seção 1: Hook Selecionado**
- ✅ Vê o texto do hook
- ✅ Vê as tags: 🎯 Dor | 💭 Gatilho | Tipo de Conteúdo

**Seção 2: Personalize**
1. Preencha o campo **"Seu Ângulo / Insight"**
   - Ex: "Mostrei para um cliente PME como economizou 40 horas/mês"

2. Preencha o **"Call-to-Action"**
   - Ex: "Clique no link da bio para agendar sua demo gratuita"

**Esperado:**
- ✅ A legenda é gerada em **tempo real** combinando:
  - Hook base
  - Seu ângulo (com prefixo 💡)
  - CTA
- ✅ Contador de caracteres aparece embaixo

**Seção 3: Plataformas**
- ✅ Clique em plataformas (INSTAGRAM, TIKTOK, YT SHORTS)
- ✅ Vê a seleção visual (checkmark e highlight)

**Seção 4: Agendamento**
- ✅ Data é preenchida automaticamente (amanhã)
- ✅ Hora padrão é 07:30
- ✅ Você pode alterar data e hora

**Seção 5: Copia a Legenda**
- ✅ Clique em "Copiar" na legenda gerada
- ✅ Button muda para "Copiado!" durante 2 segundos
- ✅ Legenda está na clipboard

### 5. Agendar
- Clique no botão **"AGENDAR TUDO"** (terracota no topo)

**Esperado:**
- ✅ Toast aparece: "Agendado com sucesso! 🚀 Seu conteúdo foi agendado para [plataformas] em [data] às [hora]"
- ✅ Hook é removido do sessionStorage
- ✅ Se tentar voltar ao Agendador sem selecionar um hook, vê mensagem: "Volte para Hook Vault e selecione um hook para começar"

## Cenários de Erro (Testes)

### Erro 1: Sem plataforma selecionada
- Preencha tudo mas **não selecione plataforma**
- Clique "AGENDAR TUDO"
- ✅ Toast: "Selecione pelo menos uma plataforma"

### Erro 2: Sem data
- Limpe o campo de data
- Clique "AGENDAR TUDO"
- ✅ Toast: "Selecione uma data"

### Erro 3: Voltar sem hook
- Na aba Agendador, abra o DevTools
- Execute: `sessionStorage.removeItem('selectedHook')`
- Recarregue a página
- ✅ Vê a mensagem: "Volte para Hook Vault e selecione um hook para começar"

## Checklist Completo

- [ ] Hook Vault carrega 50 hooks
- [ ] Filtros de Dor e Gatilho funcionam
- [ ] Botão "Usar este" copia e navega
- [ ] Agendador carrega o hook
- [ ] Ângulo se atualiza em tempo real
- [ ] CTA se atualiza em tempo real
- [ ] Legenda combina hook + ângulo + CTA
- [ ] Contador de caracteres funciona
- [ ] Plataformas podem ser selecionadas
- [ ] Data é preenchida automaticamente
- [ ] Botão "Copiar" funciona
- [ ] "AGENDAR TUDO" mostra toast correto
- [ ] Validação de plataformas funciona
- [ ] Validação de data funciona
- [ ] Mensagem de erro se não houver hook

## Estado do Agendador

| Feature | Status | Notas |
|---------|--------|-------|
| Lê hook do sessionStorage | ✅ | Implementado com useEffect |
| Exibe hook com metadados | ✅ | Mostra dor, gatilho, tipo |
| Campo Ângulo | ✅ | Textarea livre |
| Campo CTA | ✅ | Textarea livre |
| Geração de legenda | ✅ | Usa useMemo para atualizar em tempo real |
| Seleção de plataformas | ✅ | Interativa com visual feedback |
| Data e hora | ✅ | Data preenchida automaticamente (amanhã) |
| Botão Copiar Legenda | ✅ | Copy to clipboard + feedback visual |
| Validações | ✅ | Plataformas e data obrigatórias |
| Toast de sucesso | ✅ | Mostra plataformas e data agendadas |
| Limpeza de sessionStorage | ✅ | Remove hook após agendar |

## Próximos Passos

1. **Analytics (Passo 2)** - Métricas de performance
2. **Concorrentes (Passo 3)** - Monitoramento de criadores
3. **Calendário (Passo 5)** - Visualização de posts agendados
4. **Em Alta (Passo 6)** - Feed de tendências
5. **Backend Integration** - Conectar com APIs reais

---

**Data do Teste:** 2026-07-01
**Versão:** 1.0 - Agendador Completo
**Status:** ✅ Pronto para Produção
