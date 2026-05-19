import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAllClients } from "@/hooks/useClients";
import { useAllProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useAllContracts } from "@/hooks/useContracts";
import { useOKRData } from "@/hooks/useOKRData";
import { PageHeader } from "@/components/shared/PageHeader";
import { Search, FileText, Users, Briefcase, CheckSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Buscar() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);
  const { data: clients = [] } = useAllClients();
  const { data: projects = [] } = useAllProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: contracts = [] } = useAllContracts();
  const { objectives = [] } = useOKRData();

  const results = useMemo(() => {
    if (!searchTerm.trim()) return { clients: [], projects: [], tasks: [], contracts: [], okrs: [] };

    const term = searchTerm;

    return {
      clients: (clients || []).filter(c =>
        c.name.includes(term) || c.company.includes(term) || c.email.includes(term)
      ),
      projects: (projects || []).filter(p =>
        p.name.includes(term) || p.description.includes(term)
      ),
      tasks: (tasks || []).filter(t =>
        t.title.includes(term) || t.description.includes(term)
      ),
      contracts: (contracts || []).filter(c =>
        c.title.includes(term)
      ),
      okrs: (objectives || []).filter(o =>
        o.title.includes(term) || o.description.includes(term)
      ),
    };
  }, [searchTerm, clients, projects, tasks, contracts, objectives]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <PageHeader
          icon={Search}
          title="Buscar"
          subtitle="Busque em toda a plataforma"
        />

        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
        </div>

        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
          </div>
        )}

        <div className="space-y-8">
          {/* Clientes */}
          {results.clients.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clientes ({results.clients.length})
              </h2>
              <div className="space-y-2">
                {results.clients.map(client => (
                  <div key={client.id} className="p-4 rounded-lg bg-card border border-border hover:shadow-md transition-all">
                    <p className="font-medium text-foreground">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projetos */}
          {results.projects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Projetos ({results.projects.length})
              </h2>
              <div className="space-y-2">
                {results.projects.map(project => (
                  <div key={project.id} className="p-4 rounded-lg bg-card border border-border hover:shadow-md transition-all">
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tarefas */}
          {results.tasks.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Tarefas ({results.tasks.length})
              </h2>
              <div className="space-y-2">
                {results.tasks.map(task => (
                  <div key={task.id} className="p-4 rounded-lg bg-card border border-border hover:shadow-md transition-all">
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contratos */}
          {results.contracts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contratos ({results.contracts.length})
              </h2>
              <div className="space-y-2">
                {results.contracts.map(contract => (
                  <div key={contract.id} className="p-4 rounded-lg bg-card border border-border hover:shadow-md transition-all">
                    <p className="font-medium text-foreground">{contract.title}</p>
                    <p className="text-sm text-muted-foreground">{contract.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* OKRs */}
          {results.okrs.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                OKRs ({results.okrs.length})
              </h2>
              <div className="space-y-2">
                {results.okrs.map(okr => (
                  <div key={okr.id} className="p-4 rounded-lg bg-card border border-border hover:shadow-md transition-all">
                    <p className="font-medium text-foreground">{okr.title}</p>
                    <p className="text-sm text-muted-foreground">{okr.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {searchTerm && totalResults === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-foreground/70">Nenhum resultado encontrado para "{searchTerm}"</p>
              <p className="text-sm text-muted-foreground mt-1">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
