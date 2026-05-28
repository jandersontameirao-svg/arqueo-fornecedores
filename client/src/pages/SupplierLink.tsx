import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { COMPANIES_BY_GROUP, type CompanyDef, hasValidCompanyId } from "@/lib/companies";
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
    return selectedGroup ? (COMPANIES_BY_GROUP[selectedGroup] || []) : [];
  }, [selectedGroup]);

  // Empresas de destino: mesmo grupo, excluindo a empresa de origem
  const targetCompanies = useMemo(() => {
    if (!sourceCompany || !selectedGroup) return [];
    return companiesInGroup.filter((c) => c.id !== sourceCompany.id);
  }, [companiesInGroup, sourceCompany, selectedGroup]);

  // Query: fornecedores da empresa de origem — usa companyId NUMÉRICO
  const { data: suppliersData, isLoading: loadingSuppliers } = trpc.suppliers.list.useQuery(
    { companyId: sourceCompany ? String(sourceCompany.companyId) : undefined },
    { enabled: !!sourceCompany && hasValidCompanyId(sourceCompany) }
  );

  const suppliers = suppliersData || [];

  // Filtro de busca de fornecedores
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(
      (s: any) =>
        s.supplier.companyName?.toLowerCase().includes(q) ||
        s.supplier.tradeName?.toLowerCase().includes(q) ||
        s.supplier.cnpj?.toLowerCase().includes(q) ||
        s.supplier.email?.toLowerCase().includes(q) ||
        s.supplier.phone?.toLowerCase().includes(q) ||
        s.supplier.city?.toLowerCase().includes(q) ||
        s.supplier.state?.toLowerCase().includes(q) ||
        s.supplier.notes?.toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearch]);

  // Fornecedor selecionado
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s: any) => s.supplier.id === selectedSupplierId)?.supplier || null;
  }, [suppliers, selectedSupplierId]);

  // Mutation: criar vínculo canônico em supplierCompanyLinks
  const createLinkMutation = trpc.supplierCompanyLinks.create.useMutation({
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

    // Validação: empresa de destino deve ter companyId numérico válido
    if (!hasValidCompanyId(targetCompany)) {
      toast.error("Empresa de destino sem ID numérico válido", {
        description: "Não é possível vincular a esta empresa. Contate o administrador.",
      });
      setConfirmOpen(false);
      return;
    }

    createLinkMutation.mutate({
      supplierId: selectedSupplierId,
      companyId: targetCompany.companyId,
      internalNotes: notes || undefined,
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
              {Object.keys(COMPANIES_BY_GROUP).map((groupName) => (
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
                    {COMPANIES_BY_GROUP[groupName].length} empresa{COMPANIES_BY_GROUP[groupName].length !== 1 ? "s" : ""}
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
              {companiesInGroup.map((company) => {
                const valid = hasValidCompanyId(company);
                return (
                  <button
                    key={company.id}
                    disabled={!valid}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      !valid
                        ? "opacity-50 cursor-not-allowed border-border bg-muted"
                        : sourceCompany?.id === company.id
                        ? "border-2 hover:-translate-y-0.5"
                        : "border-border bg-white hover:border-primary/50 hover:-translate-y-0.5"
                    }`}
                    style={
                      sourceCompany?.id === company.id
                        ? { borderColor: company.color, backgroundColor: `${company.color}08` }
                        : {}
                    }
                    onClick={() => {
                      if (!valid) {
                        toast.error("Empresa sem ID numérico válido no banco");
                        return;
                      }
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
                      {!valid && (
                        <AlertCircle size={16} className="ml-auto shrink-0 text-destructive" />
                      )}
                    </div>
                  </button>
                );
              })}
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
                placeholder="Buscar por razão social, nome fantasia, CNPJ, e-mail, telefone, cidade, estado..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de fornecedores */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-xl p-3">
              {loadingSuppliers ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Carregando fornecedores...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {suppliers.length === 0
                      ? "Nenhum fornecedor cadastrado nesta empresa."
                      : "Nenhum fornecedor encontrado com esse filtro."}
                  </p>
                </div>
              ) : (
                filteredSuppliers.map((item: any) => {
                  const s = item.supplier;
                  return (
                    <button
                      key={s.id}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedSupplierId === s.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                      onClick={() => setSelectedSupplierId(s.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {s.companyName || s.tradeName || "Sem nome"}
                          </p>
                          {s.tradeName && s.companyName && s.tradeName !== s.companyName && (
                            <p className="text-xs text-muted-foreground">{s.tradeName}</p>
                          )}
                          <div className="flex gap-3 mt-1">
                            {s.cnpj && (
                              <span className="text-xs text-muted-foreground">
                                CNPJ: {s.cnpj}
                              </span>
                            )}
                            {s.email && (
                              <span className="text-xs text-muted-foreground">
                                {s.email}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedSupplierId === s.id && (
                          <CheckCircle2 size={16} className="text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {filteredSuppliers.length} fornecedor{filteredSuppliers.length !== 1 ? "es" : ""} encontrado{filteredSuppliers.length !== 1 ? "s" : ""}
            </p>

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
              Selecione a empresa que receberá o vínculo com{" "}
              <strong>{selectedSupplier?.companyName}</strong>.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {targetCompanies.map((company) => {
                const valid = hasValidCompanyId(company);
                return (
                  <button
                    key={company.id}
                    disabled={!valid}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      !valid
                        ? "opacity-50 cursor-not-allowed border-border bg-muted"
                        : targetCompany?.id === company.id
                        ? "border-2 hover:-translate-y-0.5"
                        : "border-border bg-white hover:border-primary/50 hover:-translate-y-0.5"
                    }`}
                    style={
                      targetCompany?.id === company.id
                        ? { borderColor: company.color, backgroundColor: `${company.color}08` }
                        : {}
                    }
                    onClick={() => {
                      if (!valid) {
                        toast.error("Empresa sem ID numérico válido no banco");
                        return;
                      }
                      setTargetCompany(company);
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
                      {targetCompany?.id === company.id && (
                        <CheckCircle2 size={16} className="ml-auto shrink-0" style={{ color: company.color }} />
                      )}
                      {!valid && (
                        <AlertCircle size={16} className="ml-auto shrink-0 text-destructive" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Notas/observações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações (opcional)</Label>
              <Textarea
                placeholder="Motivo da vinculação, contexto, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
                Próximo <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        );

      // ── Etapa 5: Confirmação ──
      case "confirm":
        return (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-20">Grupo:</span>
                <span className="font-medium">{selectedGroup}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-20">Origem:</span>
                <Badge variant="outline" style={{ borderColor: sourceCompany?.color, color: sourceCompany?.color }}>
                  {sourceCompany?.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-20">Fornecedor:</span>
                <span className="font-medium">{selectedSupplier?.companyName}</span>
                {selectedSupplier?.cnpj && (
                  <span className="text-xs text-muted-foreground">({selectedSupplier.cnpj})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-20">Destino:</span>
                <Badge variant="outline" style={{ borderColor: targetCompany?.color, color: targetCompany?.color }}>
                  {targetCompany?.name}
                </Badge>
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
