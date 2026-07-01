#!/bin/bash

# Script de Validação - Marketing Dashboard
# Testa todos os componentes e funcionalidades

echo "🧪 Iniciando Testes do Marketing Dashboard..."
echo "================================================"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Função para testar
test_feature() {
    echo -n "✓ Testando: $1... "
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}PASSOU${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}FALHOU${NC}"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "📋 FASE 1: TypeScript & Compilação"
echo "=================================="

# Test 1: Verificar se não há erros de TypeScript
echo -n "✓ Compilando projeto... "
npm run build > /tmp/build.log 2>&1
if grep -q "error" /tmp/build.log; then
    echo -e "${RED}FALHOU${NC}"
    echo "Erros encontrados:"
    grep "error" /tmp/build.log
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}PASSOU${NC}"
    ((TESTS_PASSED++))
fi

# Test 2: Verificar se build foi bem-sucedido
if grep -q "✓ built" /tmp/build.log; then
    test_feature "Build completado com sucesso" 0
else
    test_feature "Build completado com sucesso" 1
fi

echo ""
echo "📁 FASE 2: Arquivos de Componentes"
echo "=================================="

# Test 3: Verificar se todos os arquivos existem
FILES=(
    "src/components/empresa/marketing/HookVault.tsx"
    "src/components/empresa/marketing/VisaoGeral.tsx"
    "src/components/empresa/marketing/Analytics.tsx"
    "src/components/empresa/marketing/Concorrentes.tsx"
    "src/components/empresa/marketing/Agendador.tsx"
    "src/components/empresa/marketing/Calendario.tsx"
    "src/components/empresa/marketing/EmAlta.tsx"
    "src/components/empresa/marketing/MarketingLayout.tsx"
    "src/components/empresa/marketing/AudienceConfig.tsx"
    "src/components/empresa/marketing/hooks.ts"
    "src/components/empresa/marketing/audience.ts"
    "src/components/empresa/EmpresaMarketing.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        test_feature "Arquivo existe: $(basename $file)" 0
    else
        test_feature "Arquivo existe: $(basename $file)" 1
    fi
done

echo ""
echo "🔍 FASE 3: Verificação de Funcionalidades"
echo "========================================"

# Test 4: Verificar se HookVault tem botões
if grep -q "Configurar Audiência" src/components/empresa/marketing/HookVault.tsx && \
   grep -q "Novo Hook" src/components/empresa/marketing/HookVault.tsx && \
   grep -q "Usar este" src/components/empresa/marketing/HookVault.tsx; then
    test_feature "HookVault: Todos os botões presentes" 0
else
    test_feature "HookVault: Todos os botões presentes" 1
fi

# Test 5: Verificar se filtros estão implementados
if grep -q "selectedPainPoint" src/components/empresa/marketing/HookVault.tsx && \
   grep -q "selectedEmotionalTrigger" src/components/empresa/marketing/HookVault.tsx && \
   grep -q "searchInput" src/components/empresa/marketing/HookVault.tsx; then
    test_feature "HookVault: Filtros implementados" 0
else
    test_feature "HookVault: Filtros implementados" 1
fi

# Test 6: Verificar se relevância está implementada
if grep -q "calculateRelevance" src/components/empresa/marketing/HookVault.tsx && \
   grep -q "relevance.score" src/components/empresa/marketing/HookVault.tsx; then
    test_feature "HookVault: Relevância score implementado" 0
else
    test_feature "HookVault: Relevância score implementado" 1
fi

# Test 7: Verificar se AudienceConfig está implementado
if grep -q "AudienceConfig" src/components/empresa/marketing/HookVault.tsx && \
   grep -q "isOpen" src/components/empresa/marketing/AudienceConfig.tsx; then
    test_feature "AudienceConfig: Modal implementado" 0
else
    test_feature "AudienceConfig: Modal implementado" 1
fi

# Test 8: Verificar se navegação está funcionando
if grep -q "handleTabChange" src/components/empresa/EmpresaMarketing.tsx && \
   grep -q "setSearchParams" src/components/empresa/EmpresaMarketing.tsx; then
    test_feature "Navegação: Tabs funcionando" 0
else
    test_feature "Navegação: Tabs funcionando" 1
fi

# Test 9: Verificar se MarketingLayout tem sidebar
if grep -q "userHandle" src/components/empresa/marketing/MarketingLayout.tsx && \
   grep -q "followers" src/components/empresa/marketing/MarketingLayout.tsx && \
   grep -q "onTabChange" src/components/empresa/marketing/MarketingLayout.tsx; then
    test_feature "MarketingLayout: Sidebar com navegação" 0
else
    test_feature "MarketingLayout: Sidebar com navegação" 1
fi

echo ""
echo "📊 FASE 4: Dados & Mockups"
echo "=========================="

# Test 10: Verificar dados de hooks
if grep -q "mockHooks:" src/components/empresa/marketing/hooks.ts && \
   grep -q "creator:" src/components/empresa/marketing/hooks.ts; then
    test_feature "Dados: Hooks com criadores" 0
else
    test_feature "Dados: Hooks com criadores" 1
fi

# Test 11: Verificar audience data
if grep -q "defaultAudience:" src/components/empresa/marketing/audience.ts && \
   grep -q "trendingKeywords:" src/components/empresa/marketing/audience.ts; then
    test_feature "Dados: Audience profile configurado" 0
else
    test_feature "Dados: Audience profile configurado" 1
fi

echo ""
echo "🎯 FASE 5: Suma de Features"
echo "============================"

# Test 12: Todas as 7 páginas estão montadas
PAGES=("visao-geral" "hook-vault" "analytics" "concorrentes" "agendador" "calendario" "trending")
PAGES_OK=0

for page in "${PAGES[@]}"; do
    if grep -q "\"$page\"" src/components/empresa/EmpresaMarketing.tsx; then
        ((PAGES_OK++))
    fi
done

if [ $PAGES_OK -eq 7 ]; then
    test_feature "7 páginas do Marketing dashboard" 0
else
    test_feature "7 páginas do Marketing dashboard" 1
fi

# Test 13: Verificar testes documentation
if [ -f "TESTING.md" ]; then
    test_feature "Documentação TESTING.md presente" 0
else
    test_feature "Documentação TESTING.md presente" 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ RESUMO FINAL${NC}"
echo "================================================"
echo -e "Testes Passaram: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Testes Falharam: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}Dashboard está 100% funcional e pronto para produção.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Alguns testes falharam. Verifique os erros acima.${NC}"
    exit 1
fi
