import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Clock, 
  Repeat, 
  Award,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";

interface HistoryPoint {
  month: string;
  value: number;
}

interface Benchmark {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  benchmarkValue: number;
  unit: string;
  format: "currency" | "percentage" | "number" | "days";
  category: "financial" | "clients" | "operations" | "growth";
  trend: "up" | "down" | "stable";
  isHigherBetter: boolean;
  explanation: string;
  recommendations: string[];
  history: HistoryPoint[];
}

const benchmarks: Benchmark[] = [
  // Financial KPIs
  {
    id: "mrr",
    name: "MRR (Receita Recorrente Mensal)",
    description: "Receita mensal previsível de contratos recorrentes. Benchmark de agências de IA bem estabelecidas.",
    currentValue: 45000,
    benchmarkValue: 50000,
    unit: "R$",
    format: "currency",
    category: "financial",
    trend: "up",
    isHigherBetter: true,
    explanation: "O MRR atual está 10% abaixo do benchmark do mercado. Isso indica que a agência tem espaço para crescer sua base de contratos recorrentes. A tendência é positiva, mostrando crescimento consistente nos últimos meses.",
    recommendations: [
      "Converter mais projetos pontuais em contratos de sustentação",
      "Oferecer pacotes de suporte e manutenção para clientes existentes",
      "Implementar upselling de funcionalidades adicionais"
    ],
    history: [
      { month: "Jul", value: 32000 },
      { month: "Ago", value: 35000 },
      { month: "Set", value: 38000 },
      { month: "Out", value: 40000 },
      { month: "Nov", value: 42000 },
      { month: "Dez", value: 45000 }
    ]
  },
  {
    id: "arpc",
    name: "ARPC (Receita Média por Cliente)",
    description: "Valor médio de receita gerada por cliente ativo. Agências de IA premium têm ARPC mais alto.",
    currentValue: 8500,
    benchmarkValue: 10000,
    unit: "R$",
    format: "currency",
    category: "financial",
    trend: "up",
    isHigherBetter: true,
    explanation: "O ARPC está 15% abaixo do benchmark, indicando oportunidade de aumentar o valor entregue por cliente. Clientes de alto valor tendem a ser mais rentáveis e exigem menos esforço proporcional de atendimento.",
    recommendations: [
      "Identificar serviços complementares para oferecer aos clientes atuais",
      "Segmentar clientes por potencial de expansão",
      "Criar pacotes premium com maior valor agregado"
    ],
    history: [
      { month: "Jul", value: 6500 },
      { month: "Ago", value: 7000 },
      { month: "Set", value: 7200 },
      { month: "Out", value: 7800 },
      { month: "Nov", value: 8200 },
      { month: "Dez", value: 8500 }
    ]
  },
  {
    id: "gross-margin",
    name: "Margem Bruta",
    description: "Percentual de lucro após custos diretos. Agências de IA têm margens altas por serem intensivas em conhecimento.",
    currentValue: 68,
    benchmarkValue: 70,
    unit: "%",
    format: "percentage",
    category: "financial",
    trend: "stable",
    isHigherBetter: true,
    explanation: "A margem bruta está próxima do benchmark (apenas 2% abaixo). Isso é um bom sinal, indicando eficiência operacional. A estabilidade sugere controle adequado dos custos diretos.",
    recommendations: [
      "Revisar precificação de novos projetos",
      "Otimizar uso de ferramentas e APIs pagas",
      "Automatizar tarefas repetitivas para aumentar eficiência"
    ],
    history: [
      { month: "Jul", value: 65 },
      { month: "Ago", value: 66 },
      { month: "Set", value: 67 },
      { month: "Out", value: 68 },
      { month: "Nov", value: 68 },
      { month: "Dez", value: 68 }
    ]
  },
  {
    id: "cac",
    name: "CAC (Custo de Aquisição de Cliente)",
    description: "Custo médio para adquirir um novo cliente. Inclui marketing, vendas e onboarding.",
    currentValue: 3200,
    benchmarkValue: 2500,
    unit: "R$",
    format: "currency",
    category: "financial",
    trend: "down",
    isHigherBetter: false,
    explanation: "O CAC está 28% acima do benchmark, indicando ineficiência no processo de aquisição. A tendência de queda é positiva, mas ainda há espaço significativo para otimização.",
    recommendations: [
      "Investir em marketing de conteúdo para geração orgânica de leads",
      "Otimizar funil de vendas para reduzir ciclo de conversão",
      "Focar em canais de aquisição com menor custo",
      "Implementar programa de indicação de clientes"
    ],
    history: [
      { month: "Jul", value: 4200 },
      { month: "Ago", value: 4000 },
      { month: "Set", value: 3800 },
      { month: "Out", value: 3600 },
      { month: "Nov", value: 3400 },
      { month: "Dez", value: 3200 }
    ]
  },
  {
    id: "ltv",
    name: "LTV (Lifetime Value)",
    description: "Valor total gerado por um cliente durante todo o relacionamento. Meta: LTV/CAC > 3x.",
    currentValue: 42000,
    benchmarkValue: 50000,
    unit: "R$",
    format: "currency",
    category: "financial",
    trend: "up",
    isHigherBetter: true,
    explanation: "O LTV está 16% abaixo do benchmark, mas a tendência positiva é encorajadora. O foco deve ser em aumentar a retenção e o valor por cliente para melhorar este indicador.",
    recommendations: [
      "Implementar programa de customer success proativo",
      "Criar roadmap de expansão para cada cliente",
      "Melhorar comunicação e relacionamento contínuo"
    ],
    history: [
      { month: "Jul", value: 35000 },
      { month: "Ago", value: 36500 },
      { month: "Set", value: 38000 },
      { month: "Out", value: 39500 },
      { month: "Nov", value: 41000 },
      { month: "Dez", value: 42000 }
    ]
  },
  {
    id: "ltv-cac-ratio",
    name: "Razão LTV/CAC",
    description: "Eficiência do investimento em aquisição. Ideal acima de 3:1 para sustentabilidade.",
    currentValue: 13.1,
    benchmarkValue: 20,
    unit: "x",
    format: "number",
    category: "financial",
    trend: "up",
    isHigherBetter: true,
    explanation: "A razão LTV/CAC de 13.1x está excelente, significativamente acima do mínimo saudável de 3x. Isso indica que o investimento em aquisição está gerando bom retorno.",
    recommendations: [
      "Manter o equilíbrio atual enquanto escala",
      "Considerar aumentar investimento em aquisição dado o ROI positivo",
      "Monitorar mensalmente para detectar variações"
    ],
    history: [
      { month: "Jul", value: 8.3 },
      { month: "Ago", value: 9.1 },
      { month: "Set", value: 10.0 },
      { month: "Out", value: 11.0 },
      { month: "Nov", value: 12.1 },
      { month: "Dez", value: 13.1 }
    ]
  },

  // Client KPIs
  {
    id: "retention-rate",
    name: "Taxa de Retenção de Clientes",
    description: "Percentual de clientes que continuam ativos. Agências de IA focam em relacionamentos de longo prazo.",
    currentValue: 92,
    benchmarkValue: 90,
    unit: "%",
    format: "percentage",
    category: "clients",
    trend: "up",
    isHigherBetter: true,
    explanation: "A taxa de retenção de 92% está acima do benchmark de 90%, indicando forte relacionamento com clientes. Isso é fundamental para o modelo de negócios recorrente.",
    recommendations: [
      "Continuar investindo em relacionamento e satisfação",
      "Identificar e prevenir riscos de churn proativamente",
      "Criar programa de fidelidade ou benefícios para clientes de longo prazo"
    ],
    history: [
      { month: "Jul", value: 88 },
      { month: "Ago", value: 89 },
      { month: "Set", value: 90 },
      { month: "Out", value: 91 },
      { month: "Nov", value: 91 },
      { month: "Dez", value: 92 }
    ]
  },
  {
    id: "churn-rate",
    name: "Taxa de Churn",
    description: "Percentual de clientes perdidos por mês. Manter abaixo de 5% é essencial.",
    currentValue: 3.5,
    benchmarkValue: 5,
    unit: "%",
    format: "percentage",
    category: "clients",
    trend: "down",
    isHigherBetter: false,
    explanation: "A taxa de churn de 3.5% está 30% melhor que o benchmark de 5%. Este é um indicador de saúde do negócio. A tendência de queda mostra melhoria contínua.",
    recommendations: [
      "Analisar motivos dos poucos churns para prevenir futuros",
      "Implementar alertas de risco baseados em comportamento",
      "Manter o padrão de qualidade atual"
    ],
    history: [
      { month: "Jul", value: 5.2 },
      { month: "Ago", value: 4.8 },
      { month: "Set", value: 4.5 },
      { month: "Out", value: 4.0 },
      { month: "Nov", value: 3.8 },
      { month: "Dez", value: 3.5 }
    ]
  },
  {
    id: "nps",
    name: "NPS (Net Promoter Score)",
    description: "Indicador de satisfação e lealdade do cliente. Acima de 50 é considerado excelente.",
    currentValue: 62,
    benchmarkValue: 50,
    unit: "",
    format: "number",
    category: "clients",
    trend: "up",
    isHigherBetter: true,
    explanation: "O NPS de 62 está 24% acima do benchmark de 50, indicando alta satisfação e probabilidade de indicação. Clientes promotores são valiosos para crescimento orgânico.",
    recommendations: [
      "Solicitar indicações ativamente aos promotores",
      "Usar depoimentos para marketing",
      "Entender o que gera satisfação para replicar"
    ],
    history: [
      { month: "Jul", value: 48 },
      { month: "Ago", value: 52 },
      { month: "Set", value: 55 },
      { month: "Out", value: 58 },
      { month: "Nov", value: 60 },
      { month: "Dez", value: 62 }
    ]
  },
  {
    id: "upsell-rate",
    name: "Taxa de Upsell/Cross-sell",
    description: "Percentual de clientes que adquirem serviços adicionais. Indica valor entregue.",
    currentValue: 28,
    benchmarkValue: 30,
    unit: "%",
    format: "percentage",
    category: "clients",
    trend: "up",
    isHigherBetter: true,
    explanation: "A taxa de upsell está próxima do benchmark (apenas 2% abaixo). Há oportunidade de identificar mais necessidades dos clientes atuais.",
    recommendations: [
      "Mapear jornada do cliente para identificar oportunidades",
      "Criar ofertas personalizadas baseadas no histórico",
      "Treinar equipe para identificar sinais de expansão"
    ],
    history: [
      { month: "Jul", value: 22 },
      { month: "Ago", value: 23 },
      { month: "Set", value: 25 },
      { month: "Out", value: 26 },
      { month: "Nov", value: 27 },
      { month: "Dez", value: 28 }
    ]
  },

  // Operations KPIs
  {
    id: "project-delivery",
    name: "Taxa de Entrega no Prazo",
    description: "Percentual de projetos entregues dentro do prazo acordado.",
    currentValue: 85,
    benchmarkValue: 90,
    unit: "%",
    format: "percentage",
    category: "operations",
    trend: "up",
    isHigherBetter: true,
    explanation: "A taxa de 85% está 5% abaixo do benchmark. Atrasos impactam satisfação e podem gerar custos extras. A tendência positiva indica melhoria nos processos.",
    recommendations: [
      "Revisar estimativas de projeto para maior precisão",
      "Implementar buffers de segurança nos cronogramas",
      "Melhorar gestão de riscos e dependências",
      "Aumentar comunicação sobre status e impedimentos"
    ],
    history: [
      { month: "Jul", value: 78 },
      { month: "Ago", value: 80 },
      { month: "Set", value: 82 },
      { month: "Out", value: 83 },
      { month: "Nov", value: 84 },
      { month: "Dez", value: 85 }
    ]
  },
  {
    id: "avg-project-duration",
    name: "Duração Média de Projeto",
    description: "Tempo médio para conclusão de projetos de IA. Varia conforme complexidade.",
    currentValue: 45,
    benchmarkValue: 40,
    unit: "dias",
    format: "days",
    category: "operations",
    trend: "down",
    isHigherBetter: false,
    explanation: "A duração média está 12.5% acima do benchmark. Projetos mais longos consomem mais recursos e atrasam faturamento. A tendência de redução é positiva.",
    recommendations: [
      "Padronizar templates e componentes reutilizáveis",
      "Melhorar processo de descoberta para evitar retrabalho",
      "Investir em automação de tarefas repetitivas"
    ],
    history: [
      { month: "Jul", value: 55 },
      { month: "Ago", value: 52 },
      { month: "Set", value: 50 },
      { month: "Out", value: 48 },
      { month: "Nov", value: 46 },
      { month: "Dez", value: 45 }
    ]
  },
  {
    id: "utilization-rate",
    name: "Taxa de Utilização da Equipe",
    description: "Percentual do tempo da equipe em trabalho faturável. Equilíbrio entre produtividade e burnout.",
    currentValue: 72,
    benchmarkValue: 75,
    unit: "%",
    format: "percentage",
    category: "operations",
    trend: "stable",
    isHigherBetter: true,
    explanation: "A utilização de 72% está próxima do ideal de 75%. É importante manter espaço para aprendizado, inovação e evitar burnout.",
    recommendations: [
      "Balancear carga entre membros da equipe",
      "Reservar tempo para capacitação e P&D",
      "Otimizar processos administrativos"
    ],
    history: [
      { month: "Jul", value: 70 },
      { month: "Ago", value: 71 },
      { month: "Set", value: 72 },
      { month: "Out", value: 73 },
      { month: "Nov", value: 72 },
      { month: "Dez", value: 72 }
    ]
  },
  {
    id: "proposal-conversion",
    name: "Taxa de Conversão de Propostas",
    description: "Percentual de propostas que se tornam contratos. Indica qualidade do pipeline.",
    currentValue: 35,
    benchmarkValue: 40,
    unit: "%",
    format: "percentage",
    category: "operations",
    trend: "up",
    isHigherBetter: true,
    explanation: "A conversão de 35% está 12.5% abaixo do benchmark. Melhorar a qualificação de leads e a proposta pode aumentar significativamente a receita.",
    recommendations: [
      "Qualificar melhor os leads antes de enviar proposta",
      "Personalizar propostas para cada cliente",
      "Fazer follow-up estruturado após envio",
      "Analisar propostas perdidas para entender objeções"
    ],
    history: [
      { month: "Jul", value: 28 },
      { month: "Ago", value: 30 },
      { month: "Set", value: 31 },
      { month: "Out", value: 32 },
      { month: "Nov", value: 34 },
      { month: "Dez", value: 35 }
    ]
  },
  {
    id: "support-resolution",
    name: "Tempo Médio de Resolução (Suporte)",
    description: "Tempo médio para resolver tickets de suporte. Crítico para satisfação do cliente.",
    currentValue: 4.2,
    benchmarkValue: 4,
    unit: "horas",
    format: "number",
    category: "operations",
    trend: "down",
    isHigherBetter: false,
    explanation: "O tempo de resolução está apenas 5% acima do benchmark. A tendência de queda indica melhoria no processo de suporte.",
    recommendations: [
      "Criar base de conhecimento para resoluções rápidas",
      "Implementar SLAs claros por tipo de ticket",
      "Treinar equipe em problemas mais frequentes"
    ],
    history: [
      { month: "Jul", value: 6.5 },
      { month: "Ago", value: 5.8 },
      { month: "Set", value: 5.2 },
      { month: "Out", value: 4.8 },
      { month: "Nov", value: 4.5 },
      { month: "Dez", value: 4.2 }
    ]
  },

  // Growth KPIs
  {
    id: "revenue-growth",
    name: "Crescimento de Receita (MoM)",
    description: "Taxa de crescimento mensal da receita. Startups de IA visam 10-20% ao mês.",
    currentValue: 12,
    benchmarkValue: 15,
    unit: "%",
    format: "percentage",
    category: "growth",
    trend: "up",
    isHigherBetter: true,
    explanation: "O crescimento de 12% está próximo do benchmark de 15%. Este é um ritmo saudável de crescimento para uma agência de IA estabelecida.",
    recommendations: [
      "Diversificar fontes de novos clientes",
      "Expandir para novos segmentos de mercado",
      "Criar parcerias estratégicas"
    ],
    history: [
      { month: "Jul", value: 8 },
      { month: "Ago", value: 9 },
      { month: "Set", value: 10 },
      { month: "Out", value: 11 },
      { month: "Nov", value: 11 },
      { month: "Dez", value: 12 }
    ]
  },
  {
    id: "new-clients",
    name: "Novos Clientes por Mês",
    description: "Quantidade de novos clientes adquiridos mensalmente.",
    currentValue: 4,
    benchmarkValue: 5,
    unit: "",
    format: "number",
    category: "growth",
    trend: "stable",
    isHigherBetter: true,
    explanation: "A aquisição de 4 novos clientes/mês está próxima do benchmark de 5. A estabilidade indica processo de vendas consistente.",
    recommendations: [
      "Investir em geração de leads qualificados",
      "Ampliar presença em eventos e comunidades",
      "Desenvolver cases de sucesso para atração"
    ],
    history: [
      { month: "Jul", value: 3 },
      { month: "Ago", value: 3 },
      { month: "Set", value: 4 },
      { month: "Out", value: 4 },
      { month: "Nov", value: 4 },
      { month: "Dez", value: 4 }
    ]
  },
  {
    id: "pipeline-value",
    name: "Valor do Pipeline",
    description: "Valor total das oportunidades em negociação. Indica saúde das vendas futuras.",
    currentValue: 180000,
    benchmarkValue: 200000,
    unit: "R$",
    format: "currency",
    category: "growth",
    trend: "up",
    isHigherBetter: true,
    explanation: "O pipeline de R$ 180k representa 90% do benchmark. É importante manter o pipeline sempre cheio para garantir previsibilidade de receita.",
    recommendations: [
      "Aumentar prospecção ativa",
      "Nutrir leads em estágios iniciais",
      "Reduzir tempo de negociação para liberar capacidade"
    ],
    history: [
      { month: "Jul", value: 120000 },
      { month: "Ago", value: 135000 },
      { month: "Set", value: 150000 },
      { month: "Out", value: 160000 },
      { month: "Nov", value: 170000 },
      { month: "Dez", value: 180000 }
    ]
  },
  {
    id: "referral-rate",
    name: "Taxa de Indicação",
    description: "Percentual de novos clientes vindos por indicação. Sinal de satisfação.",
    currentValue: 45,
    benchmarkValue: 40,
    unit: "%",
    format: "percentage",
    category: "growth",
    trend: "up",
    isHigherBetter: true,
    explanation: "A taxa de 45% está 12.5% acima do benchmark. Indicações são o canal de aquisição mais eficiente e de maior qualidade.",
    recommendations: [
      "Criar programa formal de indicação com recompensas",
      "Solicitar indicações em momentos de alta satisfação",
      "Agradecer e reconhecer clientes que indicam"
    ],
    history: [
      { month: "Jul", value: 35 },
      { month: "Ago", value: 38 },
      { month: "Set", value: 40 },
      { month: "Out", value: 42 },
      { month: "Nov", value: 44 },
      { month: "Dez", value: 45 }
    ]
  }
];

const formatValue = (value: number, format: Benchmark["format"], unit: string): string => {
  switch (format) {
    case "currency":
      return `${unit} ${value.toLocaleString("pt-BR")}`;
    case "percentage":
      return `${value}${unit}`;
    case "days":
      return `${value} ${unit}`;
    case "number":
    default:
      return unit ? `${value}${unit}` : value.toString();
  }
};

const getPerformanceStatus = (benchmark: Benchmark): "excellent" | "good" | "warning" | "critical" => {
  const ratio = benchmark.currentValue / benchmark.benchmarkValue;
  
  if (benchmark.isHigherBetter) {
    if (ratio >= 1.1) return "excellent";
    if (ratio >= 0.9) return "good";
    if (ratio >= 0.7) return "warning";
    return "critical";
  } else {
    if (ratio <= 0.9) return "excellent";
    if (ratio <= 1.1) return "good";
    if (ratio <= 1.3) return "warning";
    return "critical";
  }
};

const getStatusColor = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "text-emerald-500";
    case "good": return "text-blue-500";
    case "warning": return "text-amber-500";
    case "critical": return "text-red-500";
  }
};

const getStatusBg = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "bg-emerald-500/10 border-emerald-500/20";
    case "good": return "bg-blue-500/10 border-blue-500/20";
    case "warning": return "bg-amber-500/10 border-amber-500/20";
    case "critical": return "bg-red-500/10 border-red-500/20";
  }
};

const getProgressColor = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "bg-emerald-500";
    case "good": return "bg-blue-500";
    case "warning": return "bg-amber-500";
    case "critical": return "bg-red-500";
  }
};

const getChartColor = (status: ReturnType<typeof getPerformanceStatus>): string => {
  switch (status) {
    case "excellent": return "#10b981";
    case "good": return "#3b82f6";
    case "warning": return "#f59e0b";
    case "critical": return "#ef4444";
  }
};

const getCategoryIcon = (category: Benchmark["category"]) => {
  switch (category) {
    case "financial": return <DollarSign className="h-4 w-4" />;
    case "clients": return <Users className="h-4 w-4" />;
    case "operations": return <Activity className="h-4 w-4" />;
    case "growth": return <TrendingUp className="h-4 w-4" />;
  }
};

const getCategoryLabel = (category: Benchmark["category"]) => {
  switch (category) {
    case "financial": return "Financeiro";
    case "clients": return "Clientes";
    case "operations": return "Operações";
    case "growth": return "Crescimento";
  }
};

function BenchmarkCard({ benchmark, onClick }: { benchmark: Benchmark; onClick: () => void }) {
  const status = getPerformanceStatus(benchmark);
  const progressValue = benchmark.isHigherBetter 
    ? Math.min((benchmark.currentValue / benchmark.benchmarkValue) * 100, 120)
    : Math.min((benchmark.benchmarkValue / benchmark.currentValue) * 100, 120);

  return (
    <Card 
      className={`border ${getStatusBg(status)} transition-all hover:shadow-md cursor-pointer hover:scale-[1.02]`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={getStatusColor(status)}>
                {getCategoryIcon(benchmark.category)}
              </span>
              <CardTitle className="text-sm font-medium">{benchmark.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {benchmark.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
            {benchmark.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            {benchmark.trend === "stable" && <Activity className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-2xl font-bold ${getStatusColor(status)}`}>
                {formatValue(benchmark.currentValue, benchmark.format, benchmark.unit)}
              </p>
              <p className="text-xs text-muted-foreground">
                Benchmark: {formatValue(benchmark.benchmarkValue, benchmark.format, benchmark.unit)}
              </p>
            </div>
            <Badge variant="outline" className={getStatusBg(status)}>
              {status === "excellent" && "Excelente"}
              {status === "good" && "Bom"}
              {status === "warning" && "Atenção"}
              {status === "critical" && "Crítico"}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso vs Benchmark</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(status)} transition-all duration-500`}
                style={{ width: `${Math.min(progressValue, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkDetailDialog({ 
  benchmark, 
  open, 
  onOpenChange 
}: { 
  benchmark: Benchmark | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!benchmark) return null;

  const status = getPerformanceStatus(benchmark);
  const chartColor = getChartColor(status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={getStatusColor(status)}>
              {getCategoryIcon(benchmark.category)}
            </span>
            {benchmark.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Valor Atual</p>
              <p className={`text-3xl font-bold ${getStatusColor(status)}`}>
                {formatValue(benchmark.currentValue, benchmark.format, benchmark.unit)}
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Benchmark</p>
              <p className="text-3xl font-bold text-foreground">
                {formatValue(benchmark.benchmarkValue, benchmark.format, benchmark.unit)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Evolução nos Últimos 6 Meses
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={benchmark.history}>
                  <defs>
                    <linearGradient id={`gradient-${benchmark.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    tickFormatter={(value) => {
                      if (benchmark.format === "currency") {
                        return `${(value / 1000).toFixed(0)}k`;
                      }
                      return value.toString();
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#gradient-${benchmark.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Análise do Resultado
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {benchmark.explanation}
            </p>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Recomendações
            </h4>
            <ul className="space-y-2">
              {benchmark.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ElementType;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Indicadores() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredBenchmarks = activeTab === "all" 
    ? benchmarks 
    : benchmarks.filter(b => b.category === activeTab);

  const excellentCount = benchmarks.filter(b => getPerformanceStatus(b) === "excellent").length;
  const goodCount = benchmarks.filter(b => getPerformanceStatus(b) === "good").length;
  const warningCount = benchmarks.filter(b => getPerformanceStatus(b) === "warning").length;
  const criticalCount = benchmarks.filter(b => getPerformanceStatus(b) === "critical").length;

  const overallScore = Math.round(
    ((excellentCount * 100 + goodCount * 75 + warningCount * 50 + criticalCount * 25) / benchmarks.length)
  );

  const handleCardClick = (benchmark: Benchmark) => {
    setSelectedBenchmark(benchmark);
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Indicadores Koraflow
          </h1>
          <p className="text-muted-foreground mt-1">
            Benchmarks de mercado para agências de IA e automação • Clique em um indicador para ver detalhes
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Score Geral"
            value={`${overallScore}%`}
            subtitle="vs benchmarks do mercado"
            icon={Award}
            trend={overallScore >= 75 ? "up" : "down"}
          />
          <SummaryCard
            title="Indicadores Excelentes"
            value={`${excellentCount}/${benchmarks.length}`}
            subtitle="acima do benchmark"
            icon={CheckCircle2}
            trend="up"
          />
          <SummaryCard
            title="Requerem Atenção"
            value={`${warningCount + criticalCount}`}
            subtitle="indicadores abaixo do ideal"
            icon={AlertTriangle}
            trend={warningCount + criticalCount > 5 ? "down" : "up"}
          />
          <SummaryCard
            title="Saúde do Negócio"
            value={excellentCount + goodCount >= benchmarks.length * 0.7 ? "Saudável" : "Atenção"}
            subtitle="análise consolidada"
            icon={Zap}
          />
        </div>

        {/* Tabs and Benchmarks */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="gap-2">
              <PieChart className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <Activity className="h-4 w-4" />
              Operações
            </TabsTrigger>
            <TabsTrigger value="growth" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Crescimento
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBenchmarks.map(benchmark => (
                <BenchmarkCard 
                  key={benchmark.id} 
                  benchmark={benchmark} 
                  onClick={() => handleCardClick(benchmark)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legenda de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm">Excelente: &gt;10% acima do benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Bom: dentro de ±10% do benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm">Atenção: 10-30% abaixo do benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Crítico: &gt;30% abaixo do benchmark</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <BenchmarkDetailDialog 
        benchmark={selectedBenchmark}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
