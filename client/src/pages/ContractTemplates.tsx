import { trpc } from "@/lib/trpc";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  Sparkles,
  FileText,
  Search,
  Eye,
  Copy,
  LayoutTemplate,
  Wand2,
} from "lucide-react";

const contractTypeLabels: Record<string, string> = {
  service: "Prestação de Serviços",
  supply: "Fornecimento",
  lease: "Locação",
  consulting: "Consultoria",
  maintenance: "Manutenção",
  other: "Outro",
};

const contractTypeColors: Record<string, string> = {
  service: "bg-blue-100 text-blue-700",
  supply: "bg-green-100 text-green-700",
  lease: "bg-orange-100 text-orange-700",
  consulting: "bg-purple-100 text-purple-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

// ===== TEMPLATE FORM DIALOG =====
interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: Record<string, unknown>;
  templateId?: number;
  onSuccess: () => void;
}

function TemplateFormDialog({ open, onClose, initial, templateId, onSuccess }: TemplateFormDialogProps) {
  const [name, setName] = useState((initial?.name as string) || "");
  const [description, setDescription] = useState((initial?.description as string) || "");
  const [contractType, setContractType] = useState((initial?.contractType as string) || "service");
  const [content, setContent] = useState((initial?.content as string) || "");

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => { toast.success("Template criado!"); onSuccess(); onClose(); },
    onError: (e) => toast.error("Erro ao criar template", { description: e.message }),
  });

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => { toast.success("Template atualizado!"); onSuccess(); onClose(); },
    onError: (e) => toast.error("Erro ao atualizar template", { description: e.message }),
  });

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      toast.error("Preencha o nome e o conteúdo do template");
      return;
    }
    if (templateId) {
      updateMutation.mutate({
        id: templateId,
        name, description,
        contractType: contractType as "service" | "supply" | "lease" | "consulting" | "maintenance" | "other",
        content,
      });
    } else {
      createMutation.mutate({
        name, description,
        contractType: contractType as "service" | "supply" | "lease" | "consulting" | "maintenance" | "other",
        content,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            {templateId ? "Editar Template" : "Novo Template de Contrato"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Nome do Template *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Contrato Padrão de Serviços" />
            </div>
            <div className="space-y-1">
              <Label>Tipo de Contrato</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(contractTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do template..." />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Conteúdo do Template *</Label>
              <p className="text-xs text-muted-foreground">
                Use marcadores como <code className="bg-muted px-1 rounded">[NOME_EMPRESA]</code>, <code className="bg-muted px-1 rounded">[CNPJ]</code>, <code className="bg-muted px-1 rounded">[VALOR]</code>, <code className="bg-muted px-1 rounded">[DATA_INICIO]</code>, <code className="bg-muted px-1 rounded">[DATA_FIM]</code>, <code className="bg-muted px-1 rounded">[OBJETO]</code> para campos variáveis.
              </p>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="font-mono text-xs"
                placeholder="CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Entre as partes:
CONTRATANTE: [NOME_EMPRESA], inscrita no CNPJ sob o nº [CNPJ]...

OBJETO: [OBJETO]

VALOR: R$ [VALOR]

VIGÊNCIA: De [DATA_INICIO] a [DATA_FIM]..."
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {templateId ? "Salvar Alterações" : "Criar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== AI GENERATION DIALOG =====
function AIGenerateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [contractType, setContractType] = useState("service");
  const [description, setDescription] = useState("");

  const generateMutation = trpc.templates.generateWithAI.useMutation({
    onSuccess: () => {
      toast.success("Template gerado pela IA com sucesso!");
      onSuccess();
      onClose();
      setName("");
      setDescription("");
    },
    onError: (e) => toast.error("Erro ao gerar template", { description: e.message }),
  });

  const handleGenerate = () => {
    if (!name.trim() || !description.trim()) {
      toast.error("Preencha o nome e a descrição para a IA gerar o template");
      return;
    }
    generateMutation.mutate({
      name,
      contractType: contractType as "service" | "supply" | "lease" | "consulting" | "maintenance" | "other",
      description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-emerald-600" />
            Gerar Template com IA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-xs text-emerald-700">
              A IA irá criar um template completo com todas as cláusulas padrão para o tipo de contrato selecionado, incluindo marcadores para campos variáveis.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Nome do Template *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Template Serviços de TI" />
          </div>
          <div className="space-y-1">
            <Label>Tipo de Contrato *</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(contractTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Descrição / Contexto *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descreva o contexto do contrato, setor de atuação, particularidades importantes, cláusulas específicas que devem ser incluídas..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Gerando...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-1.5" />Gerar com IA</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== PREVIEW DIALOG =====
function PreviewDialog({ template, open, onClose }: { template: Record<string, unknown> | null; open: boolean; onClose: () => void }) {
  if (!template) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {template.name as string}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {template.contractType != null && (
              <Badge className={`text-xs border-0 ${contractTypeColors[String(template.contractType)] || ""}`}>
                {contractTypeLabels[String(template.contractType)] || String(template.contractType)}
              </Badge>
            )}
            {template.description != null && (
              <span className="text-xs text-muted-foreground">{String(template.description)}</span>
            )}
          </div>
          <div className="rounded-lg border bg-muted/20 p-4 max-h-[60vh] overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">
              {template.content as string}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN PAGE =====
export default function ContractTemplatesPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Record<string, unknown> | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: templates, isLoading } = trpc.templates.listAll.useQuery();

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template excluído");
      utils.templates.listAll.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const filtered = (templates || []).filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.contractType === filterType;
    return matchSearch && matchType;
  });

  const handleSuccess = () => utils.templates.listAll.invalidate();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Templates de Contratos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Biblioteca de modelos reutilizáveis para elaboração de contratos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAI(true)}>
              <Sparkles className="h-4 w-4 mr-1.5 text-emerald-600" />
              Gerar com IA
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Template
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(contractTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{templates?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total de Templates</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {templates?.filter((t) => t.isActive).length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Templates Ativos</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {new Set(templates?.map((t) => t.contractType).filter(Boolean)).size}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Tipos Cobertos</p>
          </div>
        </div>

        {/* Template Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <div key={t.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewTemplate(t as unknown as Record<string, unknown>)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTemplate(t as unknown as Record<string, unknown>)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm leading-tight">{t.name}</p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  {t.contractType && (
                    <Badge className={`text-xs border-0 ${contractTypeColors[t.contractType] || ""}`}>
                      {contractTypeLabels[t.contractType] || String(t.contractType)}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t.content ? `${String(t.content).length} chars` : "Vazio"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <LayoutTemplate className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">
              {search || filterType !== "all" ? "Nenhum template encontrado" : "Nenhum template cadastrado"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || filterType !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Crie templates manualmente ou use a IA para gerar modelos completos"}
            </p>
            {!search && filterType === "all" && (
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowAI(true)}>
                  <Sparkles className="h-4 w-4 mr-1.5 text-emerald-600" />Gerar com IA
                </Button>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />Criar Manualmente
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TemplateFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={handleSuccess}
      />

      {editTemplate && (
        <TemplateFormDialog
          open={true}
          onClose={() => setEditTemplate(null)}
          initial={editTemplate}
          templateId={editTemplate.id as number}
          onSuccess={handleSuccess}
        />
      )}

      <AIGenerateDialog
        open={showAI}
        onClose={() => setShowAI(false)}
        onSuccess={handleSuccess}
      />

      <PreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onClose={() => setPreviewTemplate(null)}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              O template será desativado e não estará mais disponível para novos contratos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
