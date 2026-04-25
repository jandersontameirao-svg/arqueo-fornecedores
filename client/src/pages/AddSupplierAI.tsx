import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Brain,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  Search,
  Link2,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";

type Step = "upload" | "extracting" | "review" | "confirm";

interface ExtractedData {
  companyName?: string;
  tradeName?: string;
  cnpj?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  email?: string;
  phone?: string;
  website?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  pixKey?: string;
  legalRepresentatives?: Array<{ name: string; cpf: string; role: string }>;
}

export default function AddSupplierAI() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState<ExtractedData>({});
  const [fieldsFound, setFieldsFound] = useState<string[]>([]);
  const [existingSupplier, setExistingSupplier] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [criticality, setCriticality] = useState("medium");
  const [serviceScope, setServiceScope] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const { data: companies } = trpc.companies.listAll.useQuery();

  const extractMutation = trpc.aiExtraction.extractSupplierData.useMutation({
    onSuccess: (result) => {
      setFormData(result.extracted);
      setFieldsFound(result.fieldsFound);
      setExistingSupplier(result.existingSupplier);
      setStep("review");
      if (result.existingSupplier) {
        toast.info("Fornecedor já existe na base geral! Você pode vinculá-lo à sua empresa.");
      } else {
        toast.success("Dados extraídos com sucesso! Revise antes de confirmar.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao extrair dados do documento.");
      setStep("upload");
    },
  });

  const createSupplierMutation = trpc.suppliers.create.useMutation({
    onSuccess: (result) => {
      toast.success("Fornecedor cadastrado na base geral!");
      if (selectedCompanyId) {
        linkToCompany(result.id);
      } else {
        setLocation(`/suppliers/${result.id}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar fornecedor.");
    },
  });

  const linkMutation = trpc.supplierCompanyLinks.create.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor vinculado à empresa com sucesso!");
      const supplierId = existingSupplier?.id || createSupplierMutation.data?.id;
      setLocation(`/suppliers/${supplierId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao vincular fornecedor.");
    },
  });

  const linkToCompany = (supplierId: number) => {
    if (!selectedCompanyId) return;
    setIsLinking(true);
    linkMutation.mutate({
      supplierId,
      companyId: parseInt(selectedCompanyId, 10),
      criticality: criticality as "low" | "medium" | "high" | "critical",
      serviceScope: serviceScope || undefined,
      internalNotes: internalNotes || undefined,
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setStep("extracting");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      extractMutation.mutate({
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmNew = () => {
    if (!formData.companyName) {
      toast.error("Razão social é obrigatória.");
      return;
    }
    createSupplierMutation.mutate({
      companyName: formData.companyName,
      tradeName: formData.tradeName || "",
      cnpj: formData.cnpj || "",
      email: formData.email || "",
      phone: formData.phone || "",
      street: formData.street || "",
      neighborhood: formData.neighborhood || "",
      city: formData.city || "",
      state: formData.state || "",
      zipCode: formData.zipCode || "",
      country: formData.country || "Brasil",
      bankName: formData.bankName || "",
      bankAgency: formData.bankAgency || "",
      bankAccount: formData.bankAccount || "",
      bankAccountType: (formData.bankAccountType as "checking" | "savings") || "checking",
      pixKey: formData.pixKey || "",
      criticality: "medium",
      companyId: selectedCompanyId || "grupo-arqueo",
      groupId: 1,
    });
  };

  const handleLinkExisting = () => {
    if (!existingSupplier || !selectedCompanyId) {
      toast.error("Selecione uma empresa para vincular.");
      return;
    }
    linkToCompany(existingSupplier.id);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFieldExtracted = (field: string) => fieldsFound.includes(field);

  const renderFieldBadge = (field: string) => {
    if (isFieldExtracted(field)) {
      return (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 ml-2">
          <Sparkles className="h-3 w-3 mr-1" />
          IA
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200 ml-2">
        Manual
      </Badge>
    );
  };

  // Step indicators
  const steps = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "extracting", label: "Extração IA", icon: Brain },
    { id: "review", label: "Revisão", icon: Search },
    { id: "confirm", label: "Confirmação", icon: CheckCircle },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isPast =
            steps.findIndex((x) => x.id === step) > i;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              Adicionar Fornecedor com IA
            </CardTitle>
            <CardDescription className="text-base">
              Envie um documento do fornecedor e a IA extrairá os dados automaticamente.
              Aceita: Cartão CNPJ, Contrato Social, Proposta Comercial, Nota Fiscal, Certidões, Comprovantes Bancários e outros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-green-400 bg-green-50"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Arraste e solte o documento aqui</p>
                    <p className="text-sm text-muted-foreground">
                      ou clique para selecionar um arquivo
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, PNG, JPG, TXT, DOC, DOCX — máximo 16MB
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLocation("/suppliers")}>
                Cancelar
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!file}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                Extrair com IA
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Extracting */}
      {step === "extracting" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <h3 className="text-xl font-semibold mb-2">Analisando documento...</h3>
            <p className="text-muted-foreground max-w-md">
              A IA está lendo o documento e extraindo os dados do fornecedor.
              Isso pode levar alguns segundos.
            </p>
            <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>Processando: {file?.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-6">
          {/* Existing supplier alert */}
          {existingSupplier && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Fornecedor já existe na base geral!</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      <strong>{existingSupplier.companyName}</strong> (CNPJ: {existingSupplier.cnpj}) já está cadastrado.
                      Você pode vinculá-lo à sua empresa sem duplicar o cadastro.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => setStep("confirm")}
                        className="gap-1.5"
                      >
                        <Link2 className="h-4 w-4" />
                        Vincular à minha empresa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/suppliers/${existingSupplier.id}`)}
                      >
                        Ver cadastro existente
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted data form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Revisão dos Dados Extraídos
              </CardTitle>
              <CardDescription>
                Revise e corrija os dados antes de confirmar. Campos marcados com
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 mx-1">
                  <Sparkles className="h-3 w-3 mr-1" />IA
                </Badge>
                foram extraídos automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados principais */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  Dados Principais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Razão Social *</Label>
                      {renderFieldBadge("companyName")}
                    </div>
                    <Input
                      value={formData.companyName || ""}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      placeholder="Razão social do fornecedor"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Nome Fantasia</Label>
                      {renderFieldBadge("tradeName")}
                    </div>
                    <Input
                      value={formData.tradeName || ""}
                      onChange={(e) => updateField("tradeName", e.target.value)}
                      placeholder="Nome fantasia"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>CNPJ</Label>
                      {renderFieldBadge("cnpj")}
                    </div>
                    <Input
                      value={formData.cnpj || ""}
                      onChange={(e) => updateField("cnpj", e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Inscrição Estadual</Label>
                      {renderFieldBadge("stateRegistration")}
                    </div>
                    <Input
                      value={formData.stateRegistration || ""}
                      onChange={(e) => updateField("stateRegistration", e.target.value)}
                      placeholder="Inscrição estadual"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contato */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  Contato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>E-mail</Label>
                      {renderFieldBadge("email")}
                    </div>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Telefone</Label>
                      {renderFieldBadge("phone")}
                    </div>
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center">
                      <Label>Website</Label>
                      {renderFieldBadge("website")}
                    </div>
                    <Input
                      value={formData.website || ""}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://www.empresa.com"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  Endereço
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center">
                      <Label>Logradouro</Label>
                      {renderFieldBadge("street")}
                    </div>
                    <Input
                      value={formData.street || ""}
                      onChange={(e) => updateField("street", e.target.value)}
                      placeholder="Rua, Av., etc."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Número</Label>
                      {renderFieldBadge("number")}
                    </div>
                    <Input
                      value={formData.number || ""}
                      onChange={(e) => updateField("number", e.target.value)}
                      placeholder="Nº"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Complemento</Label>
                      {renderFieldBadge("complement")}
                    </div>
                    <Input
                      value={formData.complement || ""}
                      onChange={(e) => updateField("complement", e.target.value)}
                      placeholder="Sala, Andar, etc."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Bairro</Label>
                      {renderFieldBadge("neighborhood")}
                    </div>
                    <Input
                      value={formData.neighborhood || ""}
                      onChange={(e) => updateField("neighborhood", e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Cidade</Label>
                      {renderFieldBadge("city")}
                    </div>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Estado</Label>
                      {renderFieldBadge("state")}
                    </div>
                    <Input
                      value={formData.state || ""}
                      onChange={(e) => updateField("state", e.target.value)}
                      placeholder="UF"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>CEP</Label>
                      {renderFieldBadge("zipCode")}
                    </div>
                    <Input
                      value={formData.zipCode || ""}
                      onChange={(e) => updateField("zipCode", e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dados bancários */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  Dados Bancários
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Banco</Label>
                      {renderFieldBadge("bankName")}
                    </div>
                    <Input
                      value={formData.bankName || ""}
                      onChange={(e) => updateField("bankName", e.target.value)}
                      placeholder="Nome do banco"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Agência</Label>
                      {renderFieldBadge("bankAgency")}
                    </div>
                    <Input
                      value={formData.bankAgency || ""}
                      onChange={(e) => updateField("bankAgency", e.target.value)}
                      placeholder="Agência"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Conta</Label>
                      {renderFieldBadge("bankAccount")}
                    </div>
                    <Input
                      value={formData.bankAccount || ""}
                      onChange={(e) => updateField("bankAccount", e.target.value)}
                      placeholder="Número da conta"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Label>Chave PIX</Label>
                      {renderFieldBadge("pixKey")}
                    </div>
                    <Input
                      value={formData.pixKey || ""}
                      onChange={(e) => updateField("pixKey", e.target.value)}
                      placeholder="Chave PIX"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Resumo da Extração</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {fieldsFound.length} campos extraídos automaticamente pela IA.
                  {fieldsFound.length < 10 && " Preencha os campos faltantes manualmente."}
                </p>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setFile(null);
                    setFormData({});
                    setFieldsFound([]);
                    setExistingSupplier(null);
                  }}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  className="gap-2"
                >
                  Próximo: Vinculação
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Confirm & Link */}
      {step === "confirm" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {existingSupplier ? "Vincular Fornecedor Existente" : "Confirmar Cadastro e Vincular"}
              </CardTitle>
              <CardDescription>
                {existingSupplier
                  ? `Vincule ${existingSupplier.companyName} à empresa desejada.`
                  : "Confirme os dados e vincule o novo fornecedor a uma empresa do grupo."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supplier summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {existingSupplier?.companyName || formData.companyName || "Fornecedor"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {existingSupplier?.cnpj || formData.cnpj || "Não informado"}
                    </p>
                  </div>
                  {existingSupplier && (
                    <Badge className="ml-auto bg-blue-100 text-blue-700">Já cadastrado</Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Link configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Configuração do Vínculo</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Empresa/Unidade *</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies?.map((company: any) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.name || company.legalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Criticidade</Label>
                    <Select value={criticality} onValueChange={setCriticality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Escopo de Serviço</Label>
                    <Input
                      value={serviceScope}
                      onChange={(e) => setServiceScope(e.target.value)}
                      placeholder="Ex: Consultoria arqueológica, Serviços de campo..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Observações Internas</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Notas internas sobre este vínculo..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {!selectedCompanyId && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Selecione uma empresa para vincular. Você também pode pular a vinculação e cadastrar apenas na base geral.
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("review")}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex gap-2">
                  {!existingSupplier && (
                    <Button
                      variant="outline"
                      onClick={handleConfirmNew}
                      disabled={createSupplierMutation.isPending || !formData.companyName}
                    >
                      {createSupplierMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Cadastrar sem vincular
                    </Button>
                  )}
                  <Button
                    onClick={existingSupplier ? handleLinkExisting : handleConfirmNew}
                    disabled={
                      createSupplierMutation.isPending ||
                      linkMutation.isPending ||
                      (!existingSupplier && !formData.companyName)
                    }
                    className="gap-2"
                  >
                    {(createSupplierMutation.isPending || linkMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {existingSupplier ? "Vincular" : "Cadastrar e Vincular"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
