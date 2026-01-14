import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: false
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: false
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: false
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: false
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: true
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
    isHigherBetter: true
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

function BenchmarkCard({ benchmark }: { benchmark: Benchmark }) {
  const status = getPerformanceStatus(benchmark);
  const progressValue = benchmark.isHigherBetter 
    ? Math.min((benchmark.currentValue / benchmark.benchmarkValue) * 100, 120)
    : Math.min((benchmark.benchmarkValue / benchmark.currentValue) * 100, 120);

  return (
    <Card className={`border ${getStatusBg(status)} transition-all hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={getStatusColor(status)}>
                {getCategoryIcon(benchmark.category)}
              </span>
              <CardTitle className="text-sm font-medium">{benchmark.name}</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{benchmark.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
            Benchmarks de mercado para agências de IA e automação
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
                <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
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
    </AppLayout>
  );
}
