import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { useOrgGroupContext } from "@/hooks/useOrgGroupContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, Building2, MapPin, CreditCard, FileText } from "lucide-react";

interface SupplierFormProps {
  id?: number;
}

export default function SupplierForm({ id }: SupplierFormProps) {
  const [, setLocation] = useLocation();
  const isEditing = !!id;
  const { selectedCompany } = useSelectedCompany();
  const { activeGroupId } = useOrgGroupContext();

  // Company selection for linking
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const { data: companies } = trpc.companies.listAll.useQuery();

  const currentGroupCompanies = useMemo(() => {
    if (!companies) return [];
    if (!selectedCompany?.groupId && !activeGroupId) return companies;
    const gid = selectedCompany?.groupId ?? activeGroupId;
    return companies.filter((c: any) => c.businessUnitId === gid || c.organizationalGroupId === gid);
  }, [companies, selectedCompany?.groupId, activeGroupId]);

  const isMultiCompanyGroup = currentGroupCompanies.length > 1;

  const linkMutation = trpc.supplierCompanyLinks.create.useMutation({
    onError: (error: any) => {
      toast.error(error.message || "Erro ao vincular fornecedor à empresa.");
    },
  });

  const linkSupplierToCompanies = (supplierId: number) => {
    if (!selectedCompanyId) return;

    if (selectedCompanyId === "all_group_companies") {
      for (const company of currentGroupCompanies) {
        linkMutation.mutate({
          supplierId,
          companyId: company.id,
          criticality: formData.criticality,
        });
      }
    } else {
      linkMutation.mutate({
        supplierId,
        companyId: parseInt(selectedCompanyId, 10),
        criticality: formData.criticality,
      });
    }
  };

  const [formData, setFormData] = useState({
    companyName: "",
    tradeName: "",
    cnpj: "",
    stateRegistration: "",
    municipalRegistration: "",
    email: "",
    phone: "",
    website: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
    bankName: "",
    bankAgency: "",
    bankAccount: "",
    bankAccountType: "checking" as "checking" | "savings",
    pixKey: "",
    categoryId: undefined as number | undefined,
    criticality: "medium" as "low" | "medium" | "high" | "critical",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: existingSupplier, isLoading: loadingSupplier } = trpc.suppliers.getById.useQuery(
    { id: id! },
    { enabled: isEditing }
  );

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: (data) => {
      // Invalidar lista e contagens para refletir o novo fornecedor sem F5.
      utils.suppliers.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.supplierCompanyLinks.countByCompanyStringId.invalidate();
      utils.supplierCompanyLinks.countByBusinessUnit.invalidate();
      toast.success("Fornecedor cadastrado com sucesso!");
      if (selectedCompanyId) {
        linkSupplierToCompanies(data.id);
      }
      setLocation(`/suppliers/${data.id}`);
    },
    onError: (error) => {
      console.error("[suppliers.create] mutation failed", error);
      const msg = error.message;
      if (msg.includes("CNPJ") || msg.includes("cnpj") || msg.includes("Duplicate") || msg.includes("duplicado") || msg.includes("já existe") || msg.includes("Já existe")) {
        toast.error("Já existe um fornecedor cadastrado com este CNPJ no sistema.");
      } else {
        toast.error(msg || "Erro ao cadastrar fornecedor. Tente novamente.");
      }
    },
  });

  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      utils.suppliers.getById.invalidate({ id: id! });
      toast.success("Fornecedor atualizado com sucesso!");
      setLocation(`/suppliers/${id}`);
    },
    onError: (error) => {
      console.error("[suppliers.update] mutation failed", error);
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (existingSupplier?.supplier) {
      const s = existingSupplier.supplier;
      setFormData({
        companyName: s.companyName,
        tradeName: s.tradeName || "",
        cnpj: s.cnpj,
        stateRegistration: s.stateRegistration || "",
        municipalRegistration: s.municipalRegistration || "",
        email: s.email,
        phone: s.phone || "",
        website: s.website || "",
        street: s.street || "",
        number: s.number || "",
        complement: s.complement || "",
        neighborhood: s.neighborhood || "",
        city: s.city || "",
        state: s.state || "",
        zipCode: s.zipCode || "",
        country: s.country || "Brasil",
        bankName: s.bankName || "",
        bankAgency: s.bankAgency || "",
        bankAccount: s.bankAccount || "",
        bankAccountType: (s.bankAccountType as "checking" | "savings") || "checking",
        pixKey: s.pixKey || "",
        categoryId: s.categoryId || undefined,
        criticality: (s.criticality as "low" | "medium" | "high" | "critical") || "medium",
        notes: s.notes || "",
      });
    }
  }, [existingSupplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.cnpj || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    // Convert empty strings to undefined for optional fields
    const sanitize = (v: string | undefined) => (v === "" ? undefined : v);
    const data = {
      ...formData,
      tradeName: sanitize(formData.tradeName),
      stateRegistration: sanitize(formData.stateRegistration),
      municipalRegistration: sanitize(formData.municipalRegistration),
      phone: sanitize(formData.phone),
      website: sanitize(formData.website),
      street: sanitize(formData.street),
      number: sanitize(formData.number),
      complement: sanitize(formData.complement),
      neighborhood: sanitize(formData.neighborhood),
      city: sanitize(formData.city),
      state: formData.state && formData.state.length === 2 ? formData.state : undefined,
      zipCode: sanitize(formData.zipCode),
      country: sanitize(formData.country),
      bankName: sanitize(formData.bankName),
      bankAgency: sanitize(formData.bankAgency),
      bankAccount: sanitize(formData.bankAccount),
      pixKey: sanitize(formData.pixKey),
      notes: sanitize(formData.notes),
      categoryId: formData.categoryId || undefined,
      companyId: selectedCompanyId === "all_group_companies"
        ? String(currentGroupCompanies[0]?.id || "")
        : (selectedCompanyId || (selectedCompany?.companyId ? String(selectedCompany.companyId) : undefined)),
      groupId: selectedCompany?.groupId || undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: id!, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleChange = (field: string, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isEditing && loadingSupplier) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isEditing ? `/suppliers/${id}` : "/suppliers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Atualize as informações do fornecedor"
              : selectedCompany
              ? `Cadastrando fornecedor para: ${selectedCompany.name}`
              : "Cadastre um novo fornecedor no sistema"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informações Básicas
            </CardTitle>
            <CardDescription>Dados principais do fornecedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.tradeName}
                  onChange={(e) => handleChange("tradeName", e.target.value)}
                  placeholder="Nome comercial"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => handleChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>Inscrição Estadual</Label>
                <Input
                  value={formData.stateRegistration}
                  onChange={(e) => handleChange("stateRegistration", e.target.value)}
                  placeholder="Inscrição estadual"
                />
              </div>
              <div className="space-y-2">
                <Label>Inscrição Municipal</Label>
                <Input
                  value={formData.municipalRegistration}
                  onChange={(e) => handleChange("municipalRegistration", e.target.value)}
                  placeholder="Inscrição municipal"
                />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://www.empresa.com"
                />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoryId?.toString() || "none"}
                  onValueChange={(value) => handleChange("categoryId", value === "none" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Criticidade</Label>
                <Select
                  value={formData.criticality}
                  onValueChange={(value: "low" | "medium" | "high" | "critical") => handleChange("criticality", value)}
                >
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
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Empresa/Unidade (vínculo)</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {isMultiCompanyGroup && currentGroupCompanies.length > 1 && (
                      <SelectItem value="all_group_companies" className="font-semibold text-violet-700">
                        Todas as {currentGroupCompanies.length} empresas do grupo
                      </SelectItem>
                    )}
                    {companies?.map((company: any) => (
                      <SelectItem key={company.id} value={String(company.id)}>
                        {company.tradeName || company.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </CardTitle>
            <CardDescription>Localização do fornecedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Logradouro</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
                  placeholder="Nº"
                />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={formData.complement}
                  onChange={(e) => handleChange("complement", e.target.value)}
                  placeholder="Sala, Andar, etc."
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.state || "_none"}
                  onValueChange={(value) => handleChange("state", value === "_none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Selecionar</SelectItem>
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Dados Bancários
            </CardTitle>
            <CardDescription>Informações para pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Banco</Label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  placeholder="Nome do banco"
                />
              </div>
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input
                  value={formData.bankAgency}
                  onChange={(e) => handleChange("bankAgency", e.target.value)}
                  placeholder="0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input
                  value={formData.bankAccount}
                  onChange={(e) => handleChange("bankAccount", e.target.value)}
                  placeholder="00000-0"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select
                  value={formData.bankAccountType}
                  onValueChange={(value: "checking" | "savings") => handleChange("bankAccountType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Conta Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input
                  value={formData.pixKey}
                  onChange={(e) => handleChange("pixKey", e.target.value)}
                  placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </CardTitle>
            <CardDescription>Informações adicionais</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observações sobre o fornecedor..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(isEditing ? `/suppliers/${id}` : "/suppliers")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Salvar Alterações" : "Cadastrar Fornecedor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
