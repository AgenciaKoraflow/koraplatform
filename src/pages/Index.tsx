import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/stat-card";
import { PipelineCard } from "@/components/dashboard/PipelineCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { Users, FolderKanban, FileText, DollarSign } from "lucide-react";

const Index = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da sua agência de IA
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Clientes Ativos"
            value={24}
            change="+3 este mês"
            changeType="positive"
            icon={Users}
          />
          <StatCard
            title="Projetos em Andamento"
            value={12}
            change="2 entregas esta semana"
            changeType="neutral"
            icon={FolderKanban}
          />
          <StatCard
            title="Propostas Pendentes"
            value={8}
            change="R$ 320k em negociação"
            changeType="neutral"
            icon={FileText}
          />
          <StatCard
            title="Receita Mensal"
            value="R$ 85k"
            change="+12% vs mês anterior"
            changeType="positive"
            icon={DollarSign}
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
