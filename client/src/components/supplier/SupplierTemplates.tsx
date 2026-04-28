import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
  LayoutTemplate,
  Wand2,
  Upload,
  ScrollText,
} from "lucide-react";
import { TemplateAIAutoInsert } from "@/components/contracts/TemplateAIAutoInsert";

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
  const [name, setName] = useState(String(initial?.name || ""));
  const [contractType, setContractType] = useState(String(initial?.contractType || "service"));
  const [description, setDescription] = useState(String(initial?.description || ""));
  const [content, setContent] = useState(String(initial?.content || ""));
  const utils = trpc.useUtils();

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      utils.templates.listAll.invalidate();
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error("Erro ao criar template", { description: e.message }),
  });

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado!");
      utils.templates.listAll.invalidate();
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error("Erro ao atualizar template", { description: e.message }),
  });

  const handleSave = () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    if (templateId) {
      updateMutation.mutate({ id: templateId, name, contractType: contractType as "service" | "supply" | "lease" | "consulting" | "maintenance" | "other", description, content });
    } else {
      createMutation.mutate({ name, contractType: contractType as "service" | "supply" | "lease" | "consulting" | "maintenance" | "other", description, content });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{templateId ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do template" />
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
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do template" />
          </div>
          <div className="space-y-1">
            <Label>Conteúdo do Template</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Insira o conteúdo do contrato aqui. Use {{campo}} para campos variáveis ou [CAMPO] para placeholders..."
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {templateId ? "Salvar Alterações" : "Criar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== AI GENERATE DIALOG =====
function AIGenerateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [contractType, setContractType] = useState("service");
  const [description, setDescription] = useState("");

  const generateMutation = trpc.templates.generateWithAI.useMutation({
    onSuccess: () => {
      toast.success("Template gerado pela IA com sucesso!");
      onSuccess();
      onClose();
      setName(""); setDescription("");
    },
    onError: (e) => toast.error("Erro ao gerar template", { description: e.message }),
  });

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
              A IA irá criar um template completo com todas as cláusulas padrão para o tipo de contrato selecionado.
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
              placeholder="Descreva o contexto do contrato, setor de atuação, particularidades importantes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!name.trim() || !description.trim()) { toast.error("Preencha nome e descrição"); return; }
              generateMutation.mutate({ name, contractType: contractType as "service" | "supply" | "lease" | "consulting" | "maintenance" | "other", description });
            }}
            disabled={generateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {generateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Gerando...</> : <><Sparkles className="h-4 w-4 mr-1.5" />Gerar com IA</>}
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
          <div className="flex items-center gap-2 flex-wrap">
            {template.contractType != null && (
              <Badge className={`text-xs border-0 ${contractTypeColors[String(template.contractType)] || ""}`}>
                {contractTypeLabels[String(template.contractType)] || String(template.contractType)}
              </Badge>
            )}
            {template.description != null && (
              <span className="text-sm text-muted-foreground">{String(template.description)}</span>
            )}
          </div>
          {template.content ? (
            <pre className="whitespace-pre-wrap text-sm bg-muted/40 rounded-lg p-4 font-mono leading-relaxed max-h-[60vh] overflow-y-auto border">
              {String(template.content)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem conteúdo cadastrado.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== UPLOAD WORD DIALOG =====
function UploadWordDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [contractType, setContractType] = useState("service");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.templates.uploadWord.useMutation({
    onSuccess: () => {
      toast.success("Template importado com sucesso!");
      onSuccess();
      onClose();
      setName(""); setDescription(""); setFile(null);
    },
    onError: (e) => toast.error("Erro ao importar", { description: e.message }),
  });

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande (máx. 10MB)"); return; }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  }, [name]);

  const handleUpload = async () => {
    if (!file || !name.trim()) { toast.error("Selecione um arquivo e informe o nome"); return; }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({ name, contractType: contractType as "service" | "supply" | "lease" | "consulting" | "maintenance" | "other", description, fileBase64: base64, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Importar Template Word
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input ref={fileRef} type="file" accept=".docx,.doc" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file ? (
              <p className="text-sm font-medium text-primary">{file.name}</p>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Arraste um arquivo .docx ou clique para selecionar</p>
              </>
            )}
          </div>
          <div className="space-y-1">
            <Label>Nome do Template *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do template" />
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
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={uploadMutation.isPending || !file}>
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN COMPONENT =====
interface SupplierTemplatesProps {
  supplierId: number;
  supplierName: string;
}

export default function SupplierTemplates({ supplierId, supplierName }: SupplierTemplatesProps) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showUploadWord, setShowUploadWord] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Record<string, unknown> | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // autoInsert state reserved for future use
  const [showAutoInsert] = useState(false);
  const [autoInsertTemplateId] = useState<number | null>(null);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            Templates de Contratos
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Biblioteca de modelos — use "Gerar Contrato" para vincular ao fornecedor <span className="font-medium text-foreground">{supplierName}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowUploadWord(true)}>
            <Upload className="h-4 w-4 mr-1.5 text-blue-600" />
            Importar Word
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAI(true)}>
            <Sparkles className="h-4 w-4 mr-1.5 text-emerald-600" />
            Gerar com IA
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Template
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => navigate(`/generate-contract?supplierId=${supplierId}`)}
          >
            <ScrollText className="h-4 w-4 mr-1.5" />
            Gerar Contrato
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
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
                  <FileText className="h-4 w-4 text-primary" />
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
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                {t.contractType && (
                  <Badge className={`text-xs border-0 ${contractTypeColors[t.contractType] || ""}`}>
                    {contractTypeLabels[t.contractType] || t.contractType}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-xs h-7"
                  onClick={() => navigate(`/generate-contract?supplierId=${supplierId}&templateId=${t.id}`)}
                >
                  <ScrollText className="h-3 w-3 mr-1" />
                  Usar Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <LayoutTemplate className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">Nenhum template encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filterType !== "all" ? "Tente ajustar os filtros" : "Crie seu primeiro template de contrato"}
          </p>
          {!search && filterType === "all" && (
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowAI(true)}>
                <Sparkles className="h-4 w-4 mr-1.5 text-emerald-600" />
                Gerar com IA
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Novo Template
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <TemplateFormDialog open={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleSuccess} />
      <TemplateFormDialog
        open={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        initial={editTemplate || undefined}
        templateId={editTemplate ? Number(editTemplate.id) : undefined}
        onSuccess={handleSuccess}
      />
      <AIGenerateDialog open={showAI} onClose={() => setShowAI(false)} onSuccess={handleSuccess} />
      <UploadWordDialog open={showUploadWord} onClose={() => setShowUploadWord(false)} onSuccess={handleSuccess} />
      <PreviewDialog template={previewTemplate} open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} />

      {/* TemplateAIAutoInsert reserved for future use */}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
