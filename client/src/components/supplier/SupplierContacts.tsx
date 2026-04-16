import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Users, Plus, Mail, Phone, Trash2, Star, Edit, MoreVertical, Copy, ExternalLink } from "lucide-react";
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

interface SupplierContactsProps {
  supplierId: number;
  canEdit: boolean;
}

export default function SupplierContacts({ supplierId, canEdit }: SupplierContactsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    isPrimary: false,
  });

  const utils = trpc.useUtils();
  const { data: contacts, isLoading } = trpc.suppliers.getContacts.useQuery({ supplierId });

  const createMutation = trpc.suppliers.createContact.useMutation({
    onSuccess: () => {
      toast.success("Contato adicionado!");
      utils.suppliers.getContacts.invalidate({ supplierId });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.suppliers.updateContact.useMutation({
    onSuccess: () => {
      toast.success("Contato atualizado!");
      utils.suppliers.getContacts.invalidate({ supplierId });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.suppliers.deleteContact.useMutation({
    onSuccess: () => {
      toast.success("Contato removido");
      utils.suppliers.getContacts.invalidate({ supplierId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", role: "", email: "", phone: "", isPrimary: false });
    setEditingId(null);
  };

  const handleEdit = (contact: any) => {
    setFormData({
      name: contact.name,
      role: contact.role || "",
      email: contact.email || "",
      phone: contact.phone || "",
      isPrimary: contact.isPrimary || false,
    });
    setEditingId(contact.id);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Informe o nome do contato");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate({
        supplierId,
        ...formData,
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-[oklch(0.85_0.08_350)]",
      "bg-[oklch(0.85_0.08_45)]",
      "bg-[oklch(0.85_0.08_250)]",
      "bg-[oklch(0.85_0.08_145)]",
      "bg-[oklch(0.85_0.08_85)]",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
            Contatos do Fornecedor
          </CardTitle>
          <CardDescription className="mt-1">
            Gerencie os contatos e responsáveis deste fornecedor
          </CardDescription>
        </div>
        {canEdit && (
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[oklch(0.45_0.15_350)] hover:bg-[oklch(0.40_0.15_350)]">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Contato" : "Novo Contato"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Atualize as informações do contato" : "Adicione um novo contato para este fornecedor"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="Ex: Gerente Comercial"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label className="font-medium">Contato Principal</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Marque se este é o contato principal do fornecedor
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPrimary: checked }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[oklch(0.45_0.15_350)] hover:bg-[oklch(0.40_0.15_350)]"
                >
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`
                  relative p-4 rounded-xl border transition-all
                  ${contact.isPrimary 
                    ? "bg-gradient-to-br from-[oklch(0.98_0.01_85)] to-[oklch(0.95_0.02_85)] border-[oklch(0.85_0.08_85)]" 
                    : "bg-card hover:bg-muted/50"
                  }
                `}
              >
                {contact.isPrimary && (
                  <div className="absolute bottom-3 right-3">
                    <Badge className="bg-[oklch(0.90_0.08_85)] text-[oklch(0.45_0.15_85)] border-0">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Principal
                    </Badge>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <Avatar className={`h-12 w-12 ${getAvatarColor(contact.name)}`}>
                    <AvatarFallback className="text-white font-medium">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{contact.name}</p>
                    {contact.role && (
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    )}
                    <div className="mt-3 space-y-1.5">
                      {contact.email && (
                        <button
                          onClick={() => copyToClipboard(contact.email!, "Email")}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-full"
                        >
                          <Mail className="h-3.5 w-3.5 text-[oklch(0.50_0.10_250)]" />
                          <span className="truncate">{contact.email}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                        </button>
                      )}
                      {contact.phone && (
                        <button
                          onClick={() => copyToClipboard(contact.phone!, "Telefone")}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group w-full"
                        >
                          <Phone className="h-3.5 w-3.5 text-[oklch(0.50_0.10_145)]" />
                          <span>{contact.phone}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(contact)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {contact.email && (
                          <DropdownMenuItem onClick={() => window.open(`mailto:${contact.email}`)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteConfirmId(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">Nenhum contato cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Adicione os contatos e responsáveis deste fornecedor para facilitar a comunicação
            </p>
            {canEdit && (
              <Button 
                className="mt-4 bg-[oklch(0.45_0.15_350)] hover:bg-[oklch(0.40_0.15_350)]" 
                onClick={() => setIsOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Contato
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Modal de confirmação de exclusão de contato */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId !== null && deleteMutation.mutate({ id: deleteConfirmId })}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
