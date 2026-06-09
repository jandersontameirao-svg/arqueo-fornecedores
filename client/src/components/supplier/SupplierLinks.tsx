import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Plus, Link2, Unlink, Calendar, Tag, AlertTriangle } from "lucide-react";

interface SupplierLinksProps {
  supplierId: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
  inactive: "Inativo",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-orange-100 text-orange-800",
  inactive: "bg-gray-100 text-gray-800",
};

const criticalityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export default function SupplierLinks({ supplierId }: SupplierLinksProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [criticality, setCriticality] = useState("medium");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  const isAdmin = user?.role === "admin";

  const { data: links, isLoading } = trpc.supplierCompanyLinks.getBySupplier.useQuery({ supplierId });
  const { data: companies } = trpc.companies.listAll.useQuery();

  const createMutation = trpc.supplierCompanyLinks.create.useMutation({
    onSuccess: () => {
      toast.success("Vínculo criado com sucesso!");
      utils.supplierCompanyLinks.getBySupplier.invalidate({ supplierId });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const removeMutation = trpc.supplierCompanyLinks.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Vínculo removido com sucesso!");
      utils.supplierCompanyLinks.getBySupplier.invalidate({ supplierId });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedCompanyId("");
    setCriticality("medium");
    setStatus("pending");
    setNotes("");
  };

  const handleCreate = () => {
    if (!selectedCompanyId) {
      toast.error("Selecione uma empresa");
      return;
    }
    createMutation.mutate({
      supplierId,
      companyId: parseInt(selectedCompanyId, 10),
      criticality: criticality as "low" | "medium" | "high" | "critical",
      internalNotes: notes || undefined,
    });
  };

  // Filter out companies that are already linked
  const linkedCompanyIds = links?.map((l: any) => l.link.companyId) || [];
  const availableCompanies = companies?.filter((c: any) => !linkedCompanyIds.includes(c.id)) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vínculos com Empresas</h3>
          <p className="text-sm text-muted-foreground">
            Empresas do Grupo Arqueo que utilizam este fornecedor
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Vincular Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular a uma Empresa</DialogTitle>
                <DialogDescription>
                  Associe este fornecedor a uma empresa do Grupo Arqueo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  {availableCompanies.length > 0 ? (
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCompanies.map((company: any) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.tradeName || company.legalName || `Empresa ${company.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este fornecedor já está vinculado a todas as empresas disponíveis.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas sobre este vínculo..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!selectedCompanyId || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Vinculando..." : "Vincular"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {links && links.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {links.map((item: any) => (
            <Card key={item.link.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.company?.tradeName || item.company?.legalName || `Empresa ${item.link.companyId}`}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusColors[item.link.status] || "bg-gray-100 text-gray-800"} variant="secondary">
                          {statusLabels[item.link.status] || item.link.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {criticalityLabels[item.link.criticality] || item.link.criticality}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desvincular empresa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O fornecedor será desvinculado de {item.company?.tradeName || item.company?.legalName || `Empresa ${item.link.companyId}`}.
                            Esta ação pode ser revertida criando um novo vínculo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => removeMutation.mutate({ id: item.link.id })}
                          >
                            Desvincular
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {item.link.notes && (
                  <p className="text-sm text-muted-foreground mt-3 pl-12">
                    {item.link.notes}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Vinculado em {new Date(item.link.linkedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Link2 className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <h4 className="font-medium">Nenhum vínculo encontrado</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Este fornecedor ainda não está vinculado a nenhuma empresa do grupo.
            </p>
            {isAdmin && (
              <Button className="mt-4 gap-1.5" size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Vincular Empresa
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
