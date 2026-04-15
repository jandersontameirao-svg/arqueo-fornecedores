import { useState } from "react";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Globe,
  Building2,
  Plus,
  MapPin,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Unit Card Component (isolates per-unit hook) ────────────────────
function UnitCard({
  unit,
  style,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: {
  unit: { id: number; name: string; code: string | null; description: string | null; status: string };
  style: { accentBar: string; iconClass: string; btnClass: string };
  isAdmin: boolean;
  onSelect: (id: number) => void;
  onEdit: (u: any) => void;
  onDelete: (id: number) => void;
}) {
  const companiesQuery = trpc.businessUnits.getCompanies.useQuery({ businessUnitId: unit.id });
  const companies = Array.isArray(companiesQuery.data) ? companiesQuery.data : [];

  return (
    <div className="group relative bg-white rounded-2xl shadow-warm hover:shadow-warm-lg border border-white/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Accent bar top */}
      <div className={`h-1.5 ${style.accentBar}`} />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${style.iconClass} flex items-center justify-center shrink-0 shadow-sm`}>
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-bold font-heading text-foreground text-[15px] leading-tight">{unit.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {unit.code && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin size={10} /> {unit.code}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-semibold rounded-full">
            Ativa
          </Badge>
        </div>

        {/* Companies */}
        {companies.length > 0 ? (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Empresas vinculadas
            </p>
            <div className="space-y-1">
              {companies.slice(0, 3).map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="w-5 h-5 rounded object-contain" />
                  ) : (
                    <Building2 size={12} className="text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs text-foreground truncate">{c.tradeName || c.legalName}</span>
                  <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 rounded-full border-emerald-200 text-emerald-600">
                    Ativa
                  </Badge>
                </div>
              ))}
              {companies.length > 3 && (
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  +{companies.length - 3} empresa(s)
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/20">
            <Building2 size={12} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Nenhuma empresa vinculada</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onSelect(unit.id)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${style.btnClass} font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200`}
        >
          Acessar
          <ArrowRight size={14} />
        </button>

        {/* Admin actions */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-border/20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit({ id: unit.id, nome: unit.name, descricao: unit.description || undefined, pais: unit.code || undefined }); }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Edit2 size={12} /> Editar
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir área?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{unit.name}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(unit.id)} className="bg-red-600 hover:bg-red-700">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}

// Cores estáticas por unidade (evita classes dinâmicas do Tailwind)
const UNIT_STYLES = [
  {
    accentBar: "bg-arqueo-laranja",
    iconClass: "icon-laranja",
    btnClass: "bg-arqueo-laranja hover:bg-arqueo-laranja-light text-white",
  },
  {
    accentBar: "bg-arqueo-bordo",
    iconClass: "icon-bordo",
    btnClass: "bg-arqueo-bordo hover:bg-arqueo-bordo-light text-white",
  },
  {
    accentBar: "bg-arqueo-roxo",
    iconClass: "icon-roxo",
    btnClass: "bg-arqueo-roxo hover:bg-arqueo-roxo-light text-white",
  },
  {
    accentBar: "bg-arqueo-amarelo",
    iconClass: "icon-amarelo",
    btnClass: "bg-arqueo-amarelo hover:bg-arqueo-amarelo-light text-foreground",
  },
];

// Ordem personalizada das unidades de negócio
const UNIT_ORDER = ["Grupo Arqueo Brasil", "Foods and Drinks", "Grupo Arqueo Africa"];

function sortUnits(units: Array<{ id: number; name: string; code: string | null; description: string | null; status: string }>) {
  return [...units].sort((a, b) => {
    const idxA = UNIT_ORDER.findIndex((n) => a.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(a.name.toLowerCase()));
    const idxB = UNIT_ORDER.findIndex((n) => b.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(b.name.toLowerCase()));
    const posA = idxA === -1 ? 999 : idxA;
    const posB = idxB === -1 ? 999 : idxB;
    return posA - posB;
  });
}

export default function SelectBusinessUnit() {
  const { user } = useAuth();
  const { units, isLoading, setActiveUnitId } = useBusinessUnitContext();
  const { isAdmin } = useCompanyContext();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // --- Create dialog ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [novaArea, setNovaArea] = useState({ nome: "", descricao: "", pais: "Brasil" });

  const createMutation = trpc.businessUnits.create.useMutation({
    onSuccess: () => {
      toast.success("Área de negócio criada com sucesso!");
      utils.businessUnits.list.invalidate();
      setIsCreateOpen(false);
      setNovaArea({ nome: "", descricao: "", pais: "Brasil" });
    },
    onError: (error: any) => toast.error(error.message),
  });

  // --- Edit dialog ---
  const [editingArea, setEditingArea] = useState<{
    id: number;
    nome: string;
    descricao?: string;
    pais?: string;
  } | null>(null);

  const updateMutation = trpc.businessUnits.update.useMutation({
    onSuccess: () => {
      toast.success("Área de negócio atualizada!");
      utils.businessUnits.list.invalidate();
      setEditingArea(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  // --- Delete ---
  const deleteMutation = trpc.businessUnits.delete.useMutation({
    onSuccess: () => {
      toast.success("Área de negócio excluída!");
      utils.businessUnits.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleCreate = () => {
    if (!novaArea.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    createMutation.mutate({
      name: novaArea.nome,
      description: novaArea.descricao || undefined,
      code: novaArea.pais || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingArea) return;
    updateMutation.mutate({
      id: editingArea.id,
      name: editingArea.nome,
      description: editingArea.descricao || undefined,
      code: editingArea.pais || undefined,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const handleSelectUnit = (unitId: number) => {
    setActiveUnitId(unitId);
    setLocation("/dashboard");
  };

  const firstName = user?.name?.split(" ")[0] || "Usuário";

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-[1400px] mx-auto">

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground">
            {greeting}, <span className="text-arqueo-laranja">{firstName}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de Fornecedores — Grupo Arqueo
          </p>
        </div>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028979380/DW8xBeDMWJhhN24cgAUDzG/arqueo-10anos-logo_cb7a67b6.webp"
          alt="Grupo Arqueo - 10 Anos"
          className="h-16 md:h-20 w-auto"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          ÁREAS DE NEGÓCIO
      ═══════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl icon-bordo flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="font-bold font-heading text-foreground text-lg">Áreas de Negócio</h2>
              <p className="text-xs text-muted-foreground">Selecione uma unidade para começar</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="arqueo-gradient-warm text-white font-semibold rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-[1.02] transition-all gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Nova Área
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/80 rounded-2xl shadow-warm p-6 border border-white/50 animate-pulse h-56" />
            ))}
          </div>
        ) : units && units.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sortUnits(units).map((unit, idx) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                style={UNIT_STYLES[idx % UNIT_STYLES.length]}
                isAdmin={isAdmin}
                onSelect={handleSelectUnit}
                onEdit={setEditingArea}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl icon-laranja flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles size={28} />
            </div>
            <p className="text-muted-foreground text-lg mb-4">Nenhuma área de negócio criada ainda</p>
            {isAdmin && (
              <Button onClick={() => setIsCreateOpen(true)} className="arqueo-gradient-warm text-white font-semibold rounded-xl shadow-warm hover:shadow-warm-lg gap-2">
                <Plus className="h-4 w-4" /> Criar Primeira Área
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          DIALOGS
      ═══════════════════════════════════════════════════════ */}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nova Área de Negócio</DialogTitle>
            <DialogDescription>Crie uma nova unidade de negócio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={novaArea.nome} onChange={(e) => setNovaArea({ ...novaArea, nome: e.target.value })} placeholder="Ex: Grupo Arqueo Brasil" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={novaArea.descricao} onChange={(e) => setNovaArea({ ...novaArea, descricao: e.target.value })} placeholder="Descrição da área..." className="rounded-xl mt-1" />
            </div>
            <div>
              <Label htmlFor="pais">País</Label>
              <Input id="pais" value={novaArea.pais} onChange={(e) => setNovaArea({ ...novaArea, pais: e.target.value })} placeholder="Ex: Brasil" className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="arqueo-gradient-warm text-white rounded-xl">
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingArea} onOpenChange={(open) => !open && setEditingArea(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Área de Negócio</DialogTitle>
            <DialogDescription>Atualize as informações da área</DialogDescription>
          </DialogHeader>
          {editingArea && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nome">Nome</Label>
                <Input id="edit-nome" value={editingArea.nome} onChange={(e) => setEditingArea({ ...editingArea, nome: e.target.value })} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea id="edit-descricao" value={editingArea.descricao || ""} onChange={(e) => setEditingArea({ ...editingArea, descricao: e.target.value })} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-pais">País</Label>
                <Input id="edit-pais" value={editingArea.pais || ""} onChange={(e) => setEditingArea({ ...editingArea, pais: e.target.value })} className="rounded-xl mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingArea(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="arqueo-gradient-warm text-white rounded-xl">
              {updateMutation.isPending ? "Atualizando..." : "Atualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
