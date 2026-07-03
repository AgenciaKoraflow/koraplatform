import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Calendar, Trash2, Copy, Edit2, Plus, BookOpen, Search, Instagram, Youtube, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHooks } from "@/hooks/queries/useHooksQuery";

interface ScheduledPost {
  id: string;
  date: string;
  platforms: Array<"instagram" | "tiktok" | "youtube">;
  caption: string;
  hook: string;
  angle?: string;
  cta?: string;
  status: "scheduled" | "posted" | "draft";
}

interface Props {
  workspaceId: string;
}


const PLATFORM_CONFIG = {
  instagram: { label: "Instagram", color: "bg-pink-500", icon: "📷" },
  tiktok: { label: "TikTok", color: "bg-black dark:bg-white", icon: "🎵" },
  youtube: { label: "YouTube", color: "bg-red-600", icon: "📺" },
};

export function Calendario({ workspaceId }: Props) {
  const { toast } = useToast();
  const { data: hooks = [] } = useHooks(workspaceId);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  // Carregar posts do localStorage ao inicializar
  const [posts, setPosts] = useState<ScheduledPost[]>(() => {
    const scheduled = JSON.parse(localStorage.getItem("scheduledPosts") || "[]");
    return scheduled;
  });

  // Modals
  const [chooseMethodModalOpen, setChooseMethodModalOpen] = useState(false);
  const [selectHookModalOpen, setSelectHookModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState("");
  const [selectedHookForCreate, setSelectedHookForCreate] = useState<any>(null);

  // Hook selection filters
  const [hookSearchInput, setHookSearchInput] = useState("");
  const [selectedVertical, setSelectedVertical] = useState<string>("");
  const [selectedPainPoint, setSelectedPainPoint] = useState<string>("");
  const [selectedEmotionalTrigger, setSelectedEmotionalTrigger] = useState<string>("");
  const [hookPage, setHookPage] = useState(1);
  const HOOKS_PER_PAGE = 8;

  const [newPostForm, setNewPostForm] = useState({
    hook: "",
    painPoint: "",
    emotionalTrigger: "",
    contentDescription: "",
    contentType: "Reel" as "Reel" | "Stories" | "Carrossel" | "Post",
    time: "19:00",
    status: "draft" as "scheduled" | "posted" | "draft",
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Extract unique values for filters
  const uniqueVerticals = useMemo(() => Array.from(new Set(hooks.map((h) => h.vertical).filter(Boolean))).sort(), [hooks]);
  const uniquePainPoints = useMemo(() => Array.from(new Set(hooks.map((h) => h.painPoint).filter(Boolean))).sort(), [hooks]);
  const uniqueEmotionalTriggers = useMemo(() => Array.from(new Set(hooks.map((h) => h.emotionalTrigger).filter(Boolean))).sort(), [hooks]);

  // Filter hooks for the modal
  const filteredHooksForModal = useMemo(() => {
    return hooks.filter((hook) => {
      const matchesSearch = hookSearchInput === "" ||
        hook.text.toLowerCase().includes(hookSearchInput.toLowerCase()) ||
        hook.painPoint?.toLowerCase().includes(hookSearchInput.toLowerCase()) ||
        hook.emotionalTrigger?.toLowerCase().includes(hookSearchInput.toLowerCase());

      const matchesVertical = selectedVertical === "" || hook.vertical === selectedVertical;
      const matchesPainPoint = selectedPainPoint === "" || hook.painPoint?.toLowerCase().includes(selectedPainPoint.toLowerCase());
      const matchesEmotionalTrigger = selectedEmotionalTrigger === "" || hook.emotionalTrigger?.toLowerCase().includes(selectedEmotionalTrigger.toLowerCase());

      return matchesSearch && matchesVertical && matchesPainPoint && matchesEmotionalTrigger;
    });
  }, [hooks, hookSearchInput, selectedVertical, selectedPainPoint, selectedEmotionalTrigger]);

  // Paginate hooks
  const totalHookPages = Math.ceil(filteredHooksForModal.length / HOOKS_PER_PAGE);
  const paginatedHooks = filteredHooksForModal.slice(
    (hookPage - 1) * HOOKS_PER_PAGE,
    hookPage * HOOKS_PER_PAGE
  );

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      result.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(i);
    }
    return result;
  }, [daysInMonth, firstDayOfMonth]);

  const getPostsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter((p) => p.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id));
    setSelectedPost(null);
    toast({ title: "Post deletado", description: "O post foi removido do calendário" });
  };

  const handleUpdatePostStatus = (id: string, newStatus: "scheduled" | "posted" | "draft") => {
    const updatedPosts = posts.map((p) =>
      p.id === id ? { ...p, status: newStatus } : p
    );
    setPosts(updatedPosts);
    if (selectedPost?.id === id) {
      setSelectedPost({ ...selectedPost, status: newStatus });
    }
    const statusLabels = { scheduled: "Agendado", posted: "Postado", draft: "Rascunho" };
    toast({ title: "Status atualizado", description: `Post marcado como ${statusLabels[newStatus]}` });
  };

  const handleCopyCaption = async (caption: string) => {
    await navigator.clipboard.writeText(caption);
    toast({ title: "Copiado!", description: "Legenda copiada" });
  };

  const handleOpenCreateModal = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateForCreate(dateStr);
    setNewPostForm({ hook: "", angle: "", cta: "", contentType: "Reel", time: "19:00" });
    setChooseMethodModalOpen(true);
  };

  const handleChooseFromHookVault = () => {
    setChooseMethodModalOpen(false);
    setSelectHookModalOpen(true);
  };

  const handleSelectHook = (hook: any) => {
    setSelectedHookForCreate(hook);
    setNewPostForm({
      hook: hook.text,
      painPoint: hook.painPoint || "",
      emotionalTrigger: hook.emotionalTrigger || "",
      contentDescription: "",
      contentType: (hook.contentType as "Reel" | "Stories" | "Carrossel" | "Post") || "Reel",
      time: "19:00",
    });
    setSelectHookModalOpen(false);
    setCreateModalOpen(true);
  };

  const handleChooseCreateFromZero = () => {
    setChooseMethodModalOpen(false);
    setSelectedHookForCreate(null);
    setNewPostForm({ hook: "", painPoint: "", emotionalTrigger: "", contentDescription: "", contentType: "Reel", time: "19:00" });
    setCreateModalOpen(true);
  };

  const handleCreateNewPost = () => {
    if (!newPostForm.hook.trim() || !newPostForm.contentDescription.trim()) {
      toast({ title: "Erro", description: "Preencha Hook e Descrição do Conteúdo", variant: "destructive" });
      return;
    }

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      date: selectedDateForCreate,
      platforms: ["instagram"],
      caption: newPostForm.contentDescription,
      hook: newPostForm.hook,
      painPoint: newPostForm.painPoint,
      emotionalTrigger: newPostForm.emotionalTrigger,
      angle: newPostForm.contentDescription,
      cta: "",
      status: newPostForm.status,
    };

    const updatedPosts = [...posts, newPost];
    setPosts(updatedPosts);

    // Salvar no localStorage
    const scheduled = JSON.parse(localStorage.getItem("scheduledPosts") || "[]");
    scheduled.push(newPost);
    localStorage.setItem("scheduledPosts", JSON.stringify(scheduled));

    toast({ title: "✅ Post criado!", description: "Novo post adicionado ao calendário" });
    setCreateModalOpen(false);
  };

  const monthName = new Date(currentDate.getFullYear(), currentDate.getMonth()).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Calendário de Posts</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">📅 Visualize e gerencie todos os seus posts agendados</p>
        </div>
        <div className="text-right space-y-1 shrink-0">
          <p className="text-xs sm:text-sm text-muted-foreground">Total agendado</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{posts.filter((p) => p.status === "scheduled").length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Calendário */}
        <div className="md:col-span-2 bg-card rounded-lg p-3 sm:p-6 border border-border shadow-soft space-y-3 sm:space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-xl font-bold capitalize truncate">{monthName}</h2>
            <div className="flex gap-1 sm:gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date(2026, 6, 1))}>
                Hoje
              </Button>
              <Button size="sm" variant="outline" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-[10px] sm:text-sm text-muted-foreground py-1 sm:py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-secondary/20 rounded-lg" />;
              }

              const dayPosts = getPostsForDate(day);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (dayPosts.length > 0) {
                      setSelectedPost(dayPosts[0]);
                      setSelectedPostIndex(0);
                    } else {
                      handleOpenCreateModal(day);
                    }
                  }}
                  className={`aspect-square rounded-lg p-1 sm:p-2 border-2 transition-all hover:border-primary/50 flex flex-col items-start justify-between text-left group relative ${
                    isToday
                      ? "bg-primary/20 border-primary/50"
                      : dayPosts.length > 0
                        ? "bg-secondary/50 border-border"
                        : "bg-secondary/20 border-border hover:bg-secondary/40"
                  }`}
                >
                  {/* + Icon for empty days */}
                  {dayPosts.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity">
                      <Plus className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  )}
                  <span className={`text-[9px] sm:text-xs font-semibold ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {day}
                  </span>

                  <div className="space-y-1 w-full">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="flex gap-0.5 sm:gap-1 flex-wrap">
                        {post.platforms.map((platform) => {
                          if (platform === "instagram") {
                            return (
                              <Instagram key={platform} className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-pink-500" />
                            );
                          } else if (platform === "youtube") {
                            return (
                              <Youtube key={platform} className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-red-600" />
                            );
                          } else if (platform === "tiktok") {
                            return (
                              <Music key={platform} className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-black dark:text-white" />
                            );
                          }
                        })}
                      </div>
                    ))}
                    {dayPosts.length > 3 && <span className="text-[9px] sm:text-xs text-muted-foreground font-semibold">+{dayPosts.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Sidebar - Post Details */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-soft space-y-4 h-fit md:sticky md:top-8">
          {selectedPost ? (
            <>
              <div className="space-y-3 pb-4 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {selectedPost.status === "draft" ? "📝" : selectedPost.status === "scheduled" ? "📅" : "✅"}
                    </span>
                    <h3 className="font-semibold text-foreground text-sm">
                      Post {selectedPost && getPostsForDate(parseInt(selectedPost.date.split("-")[2])).length > 1
                        ? `${selectedPostIndex + 1} de ${getPostsForDate(parseInt(selectedPost.date.split("-")[2])).length}`
                        : ""}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    {selectedPost && getPostsForDate(parseInt(selectedPost.date.split("-")[2])).length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const dayNum = parseInt(selectedPost.date.split("-")[2]);
                            const dayPostsArray = getPostsForDate(dayNum);
                            const newIndex = Math.max(0, selectedPostIndex - 1);
                            setSelectedPostIndex(newIndex);
                            setSelectedPost(dayPostsArray[newIndex]);
                          }}
                          disabled={selectedPostIndex === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const dayNum = parseInt(selectedPost.date.split("-")[2]);
                            const dayPostsArray = getPostsForDate(dayNum);
                            const newIndex = Math.min(dayPostsArray.length - 1, selectedPostIndex + 1);
                            setSelectedPostIndex(newIndex);
                            setSelectedPost(dayPostsArray[newIndex]);
                          }}
                          disabled={selectedPostIndex === getPostsForDate(parseInt(selectedPost.date.split("-")[2])).length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <button onClick={() => setSelectedPost(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">DATA</p>
                  <p className="text-sm text-foreground font-medium">
                    {new Date(selectedPost.date + "T00:00:00").toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>


                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">PLATAFORMAS</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedPost.platforms.map((platform) => (
                      <span key={platform} className={`text-xs font-semibold px-2 py-1 rounded text-white ${PLATFORM_CONFIG[platform].color}`}>
                        {PLATFORM_CONFIG[platform].icon} {PLATFORM_CONFIG[platform].label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">STATUS</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdatePostStatus(selectedPost.id, "draft")}
                      className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all ${
                        selectedPost.status === "draft"
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      📝 Rascunho
                    </button>
                    <button
                      onClick={() => handleUpdatePostStatus(selectedPost.id, "scheduled")}
                      className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all ${
                        selectedPost.status === "scheduled"
                          ? "bg-amber-500 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      📅 Agendado
                    </button>
                    <button
                      onClick={() => handleUpdatePostStatus(selectedPost.id, "posted")}
                      className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all ${
                        selectedPost.status === "posted"
                          ? "bg-green-500 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      ✅ Postado
                    </button>
                  </div>
                </div>
              </div>

              {selectedPost.hook && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">🎯 HOOK</p>
                  <p className="text-sm text-foreground bg-primary/10 rounded p-2 border border-primary/20">{selectedPost.hook}</p>
                </div>
              )}

              {selectedPost.emotionalTrigger && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">💭 GATILHO EMOCIONAL</p>
                  <p className="text-sm text-foreground bg-secondary/30 rounded p-2 border border-border">{selectedPost.emotionalTrigger}</p>
                </div>
              )}

              {selectedPost.painPoint && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">🎯 DOR QUE RESOLVE</p>
                  <p className="text-sm text-foreground bg-secondary/30 rounded p-2 border border-border">{selectedPost.painPoint}</p>
                </div>
              )}

              {selectedPost.angle && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">💡 ÂNGULO</p>
                  <p className="text-sm text-foreground bg-secondary/30 rounded p-2 border border-border">{selectedPost.angle}</p>
                </div>
              )}

              {selectedPost.cta && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">🔗 CTA</p>
                  <p className="text-sm text-foreground bg-secondary/30 rounded p-2 border border-border">{selectedPost.cta}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">📝 LEGENDA</p>
                <div className="bg-secondary/30 rounded p-3 border border-border">
                  <p className="text-sm text-foreground line-clamp-4">{selectedPost.caption}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button size="sm" className="w-full gap-2" variant="outline" onClick={() => handleCopyCaption(selectedPost.caption)}>
                  <Copy className="w-4 h-4" />
                  Copiar Legenda
                </Button>

                <Button size="sm" className="w-full gap-2" variant="destructive" onClick={() => handleDeletePost(selectedPost.id)}>
                  <Trash2 className="w-4 h-4" />
                  Deletar Post
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecione um dia com posts para ver detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-green-500/10 rounded-lg p-2.5 sm:p-4 border border-green-500/20">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">AGENDADOS</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{posts.filter((p) => p.status === "scheduled").length}</p>
        </div>

        <div className="bg-blue-500/10 rounded-lg p-2.5 sm:p-4 border border-blue-500/20">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">POSTADOS</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{posts.filter((p) => p.status === "posted").length}</p>
        </div>

        <div className="bg-amber-500/10 rounded-lg p-2.5 sm:p-4 border border-amber-500/20">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">RASCUNHOS</p>
          <p className="text-lg sm:text-2xl font-bold text-amber-600">{posts.filter((p) => p.status === "draft").length}</p>
        </div>

        <div className="bg-primary/10 rounded-lg p-2.5 sm:p-4 border border-primary/20">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">TOTAL</p>
          <p className="text-lg sm:text-2xl font-bold text-primary">{posts.length}</p>
        </div>
      </div>

      {/* Choose Method Modal */}
      <Dialog open={chooseMethodModalOpen} onOpenChange={setChooseMethodModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>📝 Como deseja criar o post?</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-muted-foreground">Escolha se quer usar um hook já pronto ou criar do zero</p>
          </DialogBody>
          <DialogFooter className="flex gap-2 sm:flex-col">
            <Button
              onClick={handleChooseFromHookVault}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <BookOpen className="w-4 h-4" />
              Trazer do Hook Vault
            </Button>
            <Button
              onClick={handleChooseCreateFromZero}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar do Zero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Hook Modal */}
      <Dialog open={selectHookModalOpen} onOpenChange={(open) => {
        setSelectHookModalOpen(open);
        if (!open) {
          setHookSearchInput("");
          setSelectedVertical("");
          setSelectedPainPoint("");
          setSelectedEmotionalTrigger("");
          setHookPage(1);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>📚 Selecione um Hook</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex-1 overflow-y-auto space-y-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar hook..."
                value={hookSearchInput}
                onChange={(e) => {
                  setHookSearchInput(e.target.value);
                  setHookPage(1);
                }}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Filters */}
            <div className="space-y-3 bg-secondary/30 rounded-lg p-3 border border-border">
              {/* Vertical */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">🎯 Vertical</label>
                <select
                  value={selectedVertical}
                  onChange={(e) => {
                    setSelectedVertical(e.target.value);
                    setHookPage(1);
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Todas as verticais</option>
                  {uniqueVerticals.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Pain Point */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">💔 Dor que resolve</label>
                <select
                  value={selectedPainPoint}
                  onChange={(e) => {
                    setSelectedPainPoint(e.target.value);
                    setHookPage(1);
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Todas as dores</option>
                  {uniquePainPoints.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Emotional Trigger */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">💭 Gatilho emocional</label>
                <select
                  value={selectedEmotionalTrigger}
                  onChange={(e) => {
                    setSelectedEmotionalTrigger(e.target.value);
                    setHookPage(1);
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Todos os gatilhos</option>
                  {uniqueEmotionalTriggers.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Info */}
            <div className="text-xs text-muted-foreground">
              {filteredHooksForModal.length} hook{filteredHooksForModal.length !== 1 ? "s" : ""} encontrado{filteredHooksForModal.length !== 1 ? "s" : ""}
            </div>

            {/* Hooks List */}
            <div className="space-y-2">
              {filteredHooksForModal.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum hook encontrado</p>
              ) : (
                paginatedHooks.map((hook) => (
                  <button
                    key={hook.id}
                    onClick={() => handleSelectHook(hook)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors space-y-1"
                  >
                    <p className="text-sm font-medium text-foreground">{hook.text}</p>
                    <div className="flex gap-2 flex-wrap">
                      {hook.format && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          🎬 {hook.format}
                        </span>
                      )}
                      {hook.painPoint && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          🎯 {hook.painPoint}
                        </span>
                      )}
                      {hook.emotionalTrigger && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          💭 {hook.emotionalTrigger}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredHooksForModal.length > HOOKS_PER_PAGE && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHookPage(Math.max(1, hookPage - 1))}
                  disabled={hookPage === 1}
                >
                  ← Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {hookPage} de {totalHookPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHookPage(Math.min(totalHookPages, hookPage + 1))}
                  disabled={hookPage === totalHookPages}
                >
                  Próxima →
                </Button>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Create Post Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📝 Criar Novo Post</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <p className="text-xs font-semibold text-muted-foreground">Data selecionada:</p>
              <p className="text-sm text-foreground font-medium">
                {new Date(selectedDateForCreate + "T00:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            {selectedHookForCreate && (
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <p className="text-xs font-semibold text-muted-foreground mb-1">📚 Hook Selecionado:</p>
                <p className="text-sm text-foreground font-medium">{selectedHookForCreate.text}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selectedHookForCreate.painPoint && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      🎯 {selectedHookForCreate.painPoint}
                    </span>
                  )}
                  {selectedHookForCreate.emotionalTrigger && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      💭 {selectedHookForCreate.emotionalTrigger}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectHookModalOpen(true)}
                  className="mt-2 text-xs"
                >
                  Mudar Hook
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>🎯 Hook ou Gancho (Título) *</Label>
              <Textarea
                placeholder="Ex: Para de fazer X. Começa a fazer Y..."
                value={newPostForm.hook}
                onChange={(e) => setNewPostForm({ ...newPostForm, hook: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>💔 Dor que Resolve</Label>
              <input
                type="text"
                placeholder="Ex: Desperdício de recursos"
                value={newPostForm.painPoint}
                onChange={(e) => setNewPostForm({ ...newPostForm, painPoint: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label>⚡ Gatilho Emocional</Label>
              <input
                type="text"
                placeholder="Ex: Aversão à Perda, Urgência"
                value={newPostForm.emotionalTrigger}
                onChange={(e) => setNewPostForm({ ...newPostForm, emotionalTrigger: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label>📝 Descrição do Conteúdo *</Label>
              <Textarea
                placeholder="O que deve conter no post? (storyline, pontos principais, exemplos...)"
                value={newPostForm.contentDescription}
                onChange={(e) => setNewPostForm({ ...newPostForm, contentDescription: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>🎬 Tipo de Conteúdo</Label>
                <select
                  value={newPostForm.contentType}
                  onChange={(e) => setNewPostForm({ ...newPostForm, contentType: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Reel">📹 Reel</option>
                  <option value="Stories">📖 Stories</option>
                  <option value="Carrossel">📸 Carrossel</option>
                  <option value="Post">📄 Post</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>🕐 Hora</Label>
                <input
                  type="time"
                  value={newPostForm.time}
                  onChange={(e) => setNewPostForm({ ...newPostForm, time: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label>📊 Status</Label>
                <select
                  value={newPostForm.status}
                  onChange={(e) => setNewPostForm({ ...newPostForm, status: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="draft">📝 Rascunho</option>
                  <option value="scheduled">📅 Agendado</option>
                  <option value="posted">✅ Postado</option>
                </select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNewPost} className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Criar Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
