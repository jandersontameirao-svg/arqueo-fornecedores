import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ArrowLeft,
  Link2,
  Building2,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

// ─── Definição de grupos e empresas (mesma estrutura do SelectCompany) ─────────
interface CompanyDef {
  id: string;
  name: string;
  color: string;
}

const GROUPS: Record<string, CompanyDef[]> = {
  "Grupo Arqueo Brasil": [
    { id: "arqueogis-preventiva", name: "Arqueogis Preventiva", color: "#F09327" },
    { id: "arqueoproject", name: "Arqueoproject", color: "#6E0F2B" },
    { id: "arqueogis-geoprocessamento", name: "Arqueogis Geoprocessamento", color: "#D4A017" },
    { id: "arqueocean", name: "Arqueocean", color: "#3178C1" },
  ],
  "Foods and Drinks": [
    { id: "vinho24hbsb", name: "Vinho24hBSB", color: "#6E0F2B" },
  ],
};

// ─── Tipos de etapas do fluxo ─────────────────────────────────────────────────
type Step = "select-group" | "select-source" | "select-supplier" | "select-target" | "confirm";

export default function SupplierLink() {
  const [, setLocation] = useLocation();
  const { selectedCompany } = useSelectedCompany();

  // Estado do fluxo
  const [step, setStep] = useState<Step>("select-group");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [sourceCompany, setSourceCompany] = useState<CompanyDef | null>(null);
  const [targetCompany, setTargetCompany] = useState<CompanyDef | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Empresas disponíveis no grupo selecionado
  const companiesInGroup = useMemo(() => {
    return selectedGroup ? (GROUPS[selectedGroup] || []) : [];
  }, [selectedGroup]);

  // Empresas de destino: mesmo grupo, excluindo a empresa de origem
  const targetCompanies = useMemo(() => {
    if (!sourceCompany || !selectedGroup) return [];
    return companiesInGroup.filter((c) => c.id !== sourceCompany.id);
  }, [companiesInGroup, sourceCompany, selectedGroup]);

  // Query: fornecedores da empresa de origem
  const { data: suppliersData, isLoading: loadingSuppliers } = trpc.suppliers.list.useQuery(
    { companyId: sourceCompany?.id },
    { enabled: !!sourceCompany }
  );

  const suppliers = suppliersData || [];

  // Filtro de busca de fornecedores
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.supplier.companyName?.toLowerCase().includes(q) ||
        s.supplier.cnpj?.toLowerCase().includes(q) ||
        s.supplier.email?.toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearch]);

  // Fornecedor selecionado
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.supplier.id === selectedSupplierId)?.supplier || null;
  }, [suppliers, selectedSupplierId]);

  // Mutation: criar vínculo
  const createLinkMutation = trpc.supplierLinks.create.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor vinculado com sucesso!", {
        description: `${selectedSupplier?.companyName} foi vinculado à ${targetCompany?.name}.`,
      });
      // Reset do fluxo
      setStep("select-group");
      setSelectedGroup("");
      setSourceCompany(null);
      setTargetCompany(null);
      setSelectedSupplierId(null);
      setSupplierSearch("");
      setNotes("");
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao vincular fornecedor", { description: error.message });
      setConfirmOpen(false);
    },
  });

  const handleConfirmLink = () => {
    if (!selectedSupplierId || !sourceCompany || !targetCompany || !selectedGroup) return;
    createLinkMutation.mutate({
      supplierId: selectedSupplierId,
      sourceCompanyId: sourceCompany.id,
      sourceCompanyName: sourceCompany.name,
      targetCompanyId: targetCompany.id,
      targetCompanyName: targetCompany.name,
      groupName: selectedGroup,
      notes: notes || undefined,
    });
  };

  // ─── Renderização por etapa ───────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Etapa 1: Selecionar grupo ──
      case "select-group":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Vínculos só são permitidos entre empresas do <strong>mesmo grupo empresarial</strong>.
                Não é possível vincular fornecedores entre grupos diferentes.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {Object.keys(GROUPS).map((groupName) => (
                <button
                  key={groupName}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    selectedGroup === groupName
                      ? "border-primary bg-primary/5"
                      : "border-border bg-white hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedGroup(groupName);
                    setSourceCompany(null);
                    setTargetCompany(null);
                    setSelectedSupplierId(null);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={16} className="text-muted-foreground" />
                    <span className="font-semibold text-sm text-foreground">{groupName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {GROUPS[groupName].length} empresa{GROUPS[groupName].length !== 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                disabled={!selectedGroup}
                onClick={() => setStep("select-source")}
                className="gap-2"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        );

      // ── Etapa 2: Selecionar empresa de origem ──
      case "select-source":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione a empresa onde o fornecedor está cadastrado originalmente.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {companiesInGroup.map((company) => (
                <button
                  key={company.id}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    sourceCompany?.id === company.id
                      ? "border-2"
                      : "border-border bg-white hover:border-primary/50"
                  }`}
                  style={
                    sourceCompany?.id === company.id
                      ? { borderColor: company.color, backgroundColor: `${company.color}08` }
                      : {}
                  }
                  onClick={() => {
                    setSourceCompany(company);
                    setSelectedSupplierId(null);
                    setSupplierSearch("");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${company.color}18`, color: company.color }}
                    >
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedGroup}</p>
                    </div>
                    {sourceCompany?.id === company.id && (
                      <CheckCircle2 size={16} className="ml-auto shrink-0" style={{ color: company.color }} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("select-group")} className="gap-2">
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button
                disabled={!sourceCompany}
                onClick={() => setStep("select-supplier")}
                className="gap-2"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        );

      // ── Etapa 3: Selecionar fornecedor ──
      case "select-supplier":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione o fornecedor cadastrado em{" "}
              <strong style={{ color: sourceCompany?.color }}>{sourceCompany?.name}</strong> que
              deseja vincular.
            </p>

            {/* Busca */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por razão social, CNPJ ou e-mail..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
            </div>

            {/* Lista de fornecedores */}
            {loadingSuppliers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {suppliers.length === 0
                    ? "Nenhum fornecedor cadastrado nesta empresa."
                    : "Nenhum fornecedor encontrado para a busca."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredSuppliers.map((supplier) => (
                  <button
                    key={supplier.supplier.id}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-150 ${
                      selectedSupplierId === supplier.supplier.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white hover:border-primary/40 hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedSupplierId(supplier.supplier.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {supplier.supplier.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CNPJ: {supplier.supplier.cnpj} · {supplier.supplier.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            supplier.supplier.status === "approved"
                              ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                              : supplier.supplier.status === "pending"
                              ? "border-amber-300 text-amber-700 bg-amber-50"
                              : "border-gray-300 text-gray-600 bg-gray-50"
                          }`}
                        >
                          {supplier.supplier.status === "approved"
                            ? "Aprovado"
                            : supplier.supplier.status === "pending"
                            ? "Pendente"
                            : supplier.supplier.status}
                        </Badge>
                        {selectedSupplierId === supplier.supplier.id && (
                          <CheckCircle2 size={16} className="text-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("select-source")} className="gap-2">
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button
                disabled={!selectedSupplierId}
                onClick={() => setStep("select-target")}
                className="gap-2"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        );

      // ── Etapa 4: Selecionar empresa de destino ──
      case "select-target":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione a empresa de destino para vincular{" "}
              <strong>{selectedSupplier?.companyName}</strong>. Apenas empresas do mesmo grupo (
              <strong>{selectedGroup}</strong>) são permitidas.
            </p>

            {targetCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  Não há outras empresas disponíveis neste grupo para vincular.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {targetCompanies.map((company) => (
                  <button
                    key={company.id}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      targetCompany?.id === company.id
                        ? "border-2"
                        : "border-border bg-white hover:border-primary/50"
                    }`}
                    style={
                      targetCompany?.id === company.id
                        ? { borderColor: company.color, backgroundColor: `${company.color}08` }
                        : {}
                    }
                    onClick={() => setTargetCompany(company)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${company.color}18`, color: company.color }}
                      >
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{company.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedGroup}</p>
                      </div>
                      {targetCompany?.id === company.id && (
                        <CheckCircle2 size={16} className="ml-auto shrink-0" style={{ color: company.color }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-sm">Observações (opcional)</Label>
              <Textarea
                placeholder="Motivo do vínculo, contexto ou informações adicionais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("select-supplier")} className="gap-2">
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button
                disabled={!targetCompany}
                onClick={() => setStep("confirm")}
                className="gap-2"
              >
                Revisar <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        );

      // ── Etapa 5: Confirmação ──
      case "confirm":
        return (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Revise as informações antes de confirmar o vínculo.
            </p>

            {/* Resumo */}
            <div className="bg-muted/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Link2 size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{selectedSupplier?.companyName}</p>
                  <p className="text-xs text-muted-foreground">CNPJ: {selectedSupplier?.cnpj}</p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                {/* Origem */}
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: `${sourceCompany?.color}12`, borderColor: `${sourceCompany?.color}40` }}
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Origem</p>
                  <p className="font-semibold text-sm" style={{ color: sourceCompany?.color }}>
                    {sourceCompany?.name}
                  </p>
                </div>

                {/* Seta */}
                <div className="flex items-center justify-center">
                  <ChevronRight size={20} className="text-muted-foreground" />
                </div>

                {/* Destino */}
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: `${targetCompany?.color}12`, borderColor: `${targetCompany?.color}40` }}
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Destino</p>
                  <p className="font-semibold text-sm" style={{ color: targetCompany?.color }}>
                    {targetCompany?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{selectedGroup}</Badge>
                <span>Vínculo dentro do mesmo grupo empresarial</span>
              </div>

              {notes && (
                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Observações:</p>
                  <p className="text-sm text-foreground">{notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("select-target")} className="gap-2">
                <ArrowLeft size={16} /> Voltar
              </Button>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={createLinkMutation.isPending}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Link2 size={16} />
                {createLinkMutation.isPending ? "Vinculando..." : "Confirmar Vínculo"}
              </Button>
            </div>
          </div>
        );
    }
  };

  // ─── Indicador de progresso ───────────────────────────────────────────────────
  const steps: { id: Step; label: string }[] = [
    { id: "select-group", label: "Grupo" },
    { id: "select-source", label: "Origem" },
    { id: "select-supplier", label: "Fornecedor" },
    { id: "select-target", label: "Destino" },
    { id: "confirm", label: "Confirmar" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/suppliers")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link2 size={22} className="text-primary" />
            Vincular Fornecedores
          </h1>
          <p className="text-muted-foreground text-sm">
            Vincule fornecedores já existentes entre empresas do mesmo grupo empresarial
          </p>
        </div>
      </div>

      {/* Indicador de progresso */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : i === currentStepIndex
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStepIndex ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block ${
                  i === currentStepIndex ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mb-4 transition-all ${
                  i < currentStepIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card principal */}
      <Card className="shadow-warm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">
            {steps[currentStepIndex]?.label}
          </CardTitle>
          <CardDescription>
            {step === "select-group" && "Escolha o grupo empresarial para o vínculo"}
            {step === "select-source" && "Escolha a empresa onde o fornecedor está cadastrado"}
            {step === "select-supplier" && "Escolha o fornecedor que deseja vincular"}
            {step === "select-target" && "Escolha a empresa que receberá o vínculo"}
            {step === "confirm" && "Confirme as informações do vínculo"}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar vínculo</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a vincular{" "}
              <strong>{selectedSupplier?.companyName}</strong> à empresa{" "}
              <strong>{targetCompany?.name}</strong>. O fornecedor passará a aparecer na lista de
              fornecedores dessa empresa. Esta ação pode ser desfeita posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLink}
              disabled={createLinkMutation.isPending}
            >
              {createLinkMutation.isPending ? "Vinculando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
