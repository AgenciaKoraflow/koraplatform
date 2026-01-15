import { useState, useMemo } from "react";
import { subMonths, startOfMonth, endOfMonth, format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCardWithChart } from "@/components/dashboard/StatCardWithChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { PipelineCard } from "@/components/dashboard/PipelineCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { Users, FolderKanban, FileText, DollarSign } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const Index = () => {
  const { clients, projects, proposals, contracts } = useData();
  
  // Date filter state
  const [startDate, setStartDate] = useState(() => startOfMonth(subMonths(new Date(), 5)));
  const [endDate, setEndDate] = useState(() => endOfMonth(new Date()));

  // Parse date from various formats
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    }
    
    // Try ISO format
    try {
      const parsed = parseISO(dateString);
      if (!isNaN(parsed.getTime())) return parsed;
    } catch {}
    
    // Try natural date
    const parsed = new Date(dateString);
    return !isNaN(parsed.getTime()) ? parsed : null;
  };

  // Generate monthly data for charts (real data only)
  const generateMonthlyData = useMemo(() => {
    const months: { month: string; date: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        date: date
      });
    }

    // Clients per month (based on lastContact)
    const clientsMonthly = months.map(m => ({
      month: m.month,
      value: clients.filter(c => {
        const date = parseDate(c.lastContact);
        return date && format(date, "MM/yyyy") === format(m.date, "MM/yyyy");
      }).length
    }));

    // Projects per month (based on dueDate)
    const projectsMonthly = months.map(m => ({
      month: m.month,
      value: projects.filter(p => {
        const date = parseDate(p.dueDate);
        return date && format(date, "MM/yyyy") === format(m.date, "MM/yyyy");
      }).length
    }));

    // Proposals per month
    const proposalsMonthly = months.map(m => ({
      month: m.month,
      value: proposals.filter(p => {
        const date = parseDate(p.createdAt);
        return date && format(date, "MM/yyyy") === format(m.date, "MM/yyyy");
      }).length
    }));

    // Revenue per month (from contracts)
    const revenueMonthly = months.map(m => ({
      month: m.month,
      value: contracts
        .filter(c => {
          const date = parseDate(c.createdAt);
          return date && format(date, "MM/yyyy") === format(m.date, "MM/yyyy") && c.status === "signed";
        })
        .reduce((acc, c) => acc + parseInt(c.value.replace(/\D/g, "") || "0"), 0)
    }));

    return { clientsMonthly, projectsMonthly, proposalsMonthly, revenueMonthly };
  }, [clients, projects, proposals, contracts]);

  // Calculate stats based on filtered data
  const stats = useMemo(() => {
    const activeClients = clients.filter(c => c.stage === "cliente").length;
    const inProgressProjects = projects.filter(p => p.status === "in_progress").length;
    const pendingProposals = proposals.filter(p => ["sent", "viewed", "draft"].includes(p.status)).length;
    const pendingValue = proposals
      .filter(p => ["sent", "viewed"].includes(p.status))
      .reduce((acc, p) => acc + parseInt(p.value.replace(/\D/g, "") || "0"), 0);
    
    const monthlyRevenue = contracts
      .filter(c => c.status === "signed")
      .reduce((acc, c) => acc + parseInt(c.value.replace(/\D/g, "") || "0"), 0);

    return {
      activeClients,
      inProgressProjects,
      pendingProposals,
      pendingValue,
      monthlyRevenue
    };
  }, [clients, projects, proposals, contracts]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral da sua agência de IA
            </p>
          </div>
          <DashboardFilters
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {/* Stats Grid with Charts on Hover */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardWithChart
            title="Clientes Ativos"
            value={stats.activeClients}
            change={`${clients.length} clientes no total`}
            changeType="neutral"
            icon={Users}
            monthlyData={generateMonthlyData.clientsMonthly}
          />
          <StatCardWithChart
            title="Projetos em Andamento"
            value={stats.inProgressProjects}
            change={`${projects.length} projetos no total`}
            changeType="neutral"
            icon={FolderKanban}
            monthlyData={generateMonthlyData.projectsMonthly}
          />
          <StatCardWithChart
            title="Propostas Pendentes"
            value={stats.pendingProposals}
            change={stats.pendingValue > 0 ? `${formatCurrency(stats.pendingValue)} em negociação` : "Nenhuma em negociação"}
            changeType="neutral"
            icon={FileText}
            monthlyData={generateMonthlyData.proposalsMonthly}
          />
          <StatCardWithChart
            title="Receita Total"
            value={formatCurrency(stats.monthlyRevenue)}
            change={`${contracts.filter(c => c.status === "signed").length} contratos assinados`}
            changeType="neutral"
            icon={DollarSign}
            monthlyData={generateMonthlyData.revenueMonthly}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PipelineCard />
          </div>

          {/* Upcoming Tasks */}
          <div>
            <UpcomingTasks />
          </div>
        </div>

        {/* Recent Activity - Full width */}
        <RecentActivity />
      </div>
    </AppLayout>
  );
};

export default Index;
