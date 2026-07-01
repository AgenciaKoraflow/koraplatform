import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

interface Competitor {
  id: string;
  username: string;
  followers: string;
  newPosts: number;
  lastScraped: string;
}

const mockCompetitors: Competitor[] = [
  {
    id: "1",
    username: "@dan_koe",
    followers: "1.2M",
    newPosts: 8,
    lastScraped: "hoje",
  },
  {
    id: "2",
    username: "@levelsio",
    followers: "478K",
    newPosts: 6,
    lastScraped: "hoje",
  },
  {
    id: "3",
    username: "@iamevanlong",
    followers: "210K",
    newPosts: 15,
    lastScraped: "hoje",
  },
  {
    id: "4",
    username: "@itstylergermain",
    followers: "355K",
    newPosts: 12,
    lastScraped: "hoje",
  },
  {
    id: "5",
    username: "@thealexbanks",
    followers: "188K",
    newPosts: 9,
    lastScraped: "hoje",
  },
];

export function Concorrentes({ workspaceId }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">8 criadores monitorados</h1>
          <p className="text-muted-foreground text-sm">
            DOM 06:00 · AUTO
          </p>
        </div>
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          ADICIONAR
        </Button>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar criadores..."
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Competitors List */}
      <div className="space-y-3">
        {mockCompetitors.map((competitor) => (
          <div
            key={competitor.id}
            className="bg-card rounded-lg p-4 border border-border shadow-soft hover:shadow-medium transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {competitor.username}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {competitor.lastScraped}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">
                  {competitor.followers}
                </p>
                <p className="text-muted-foreground text-xs">
                  {competitor.newPosts} NOVOS
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
