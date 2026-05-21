import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Shield,
  UserCog,
  Eye,
  Calendar,
  Mail,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  Building2,
  KeyRound,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gestor",
  reader: "Leitura",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  manager: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  reader: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}


type UserFormData = {
  name: string;
  email: string;
  role: "admin" | "manager" | "reader";
  isActive: boolean;
};

const emptyForm: UserFormData = {
  name: "",
  email: "",
  role: "reader",
  isActive: true,
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [accessUser, setAccessUser] = useState<any>(null);
  const [passwordUser, setPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<UserFormData & { general: string }>>({});

  const { data: users, isLoading } = trpc.users.listWithAreas.useQuery();
  const { data: allUnits } = trpc.businessUnits.listAll.useQuery(undefined, { enabled: currentUser?.role === "admin" });
  const { data: userAccess, refetch: refetchAccess } = trpc.businessUnits.getUserAccess.useQuery(
    { userId: accessUser?.id },
    { enabled: !!accessUser }
  );
  const assignMutation = trpc.businessUnits.assignUser.useMutation({
    onSuccess: () => { refetchAccess(); toast.success("Área vinculada!"); },
    onError: (e) => toast.error(e.message),
  });
  const removeMutation = trpc.businessUnits.removeUser.useMutation({
    onSuccess: () => { refetchAccess(); toast.success("Área desvinculada!"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      utils.users.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm);
      setFormErrors({});
    },
    onError: (error) => {
      toast.error(error.message);
      setFormErrors({ general: error.message });
    },
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      utils.users.list.invalidate();
      setEditingUser(null);
      setForm(emptyForm);
      setFormErrors({});
    },
    onError: (error) => {
      toast.error(error.message);
      setFormErrors({ general: error.message });
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário desativado com sucesso!");
      utils.users.list.invalidate();
      setDeletingUser(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetPasswordMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setPasswordUser(null);
      setNewPassword("");
    },
    onError: (error) => toast.error(error.message),
  });

  const setPasswordMutation = trpc.users.setPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha definida com sucesso! O usuário agora pode fazer login por email/senha.");
      utils.users.list.invalidate();
      setPasswordUser(null);
      setNewPassword("");
    },
    onError: (error) => toast.error(error.message),
  });

  const isAdmin = currentUser?.role === "admin";

  // ── Form helpers ───────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Partial<UserFormData & { general: string }> = {};
    if (!form.name || form.name.trim().length < 2) errors.name = "Nome deve ter pelo menos 2 caracteres" as any;
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "E-mail inválido" as any;
    if (!form.role) errors.role = "Perfil é obrigatório" as any;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setCreateOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      isActive: user.isActive,
    });
    setFormErrors({});
    setEditingUser(user);
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    createMutation.mutate(form);
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    if (!validateForm()) return;
    updateMutation.mutate({ id: editingUser.id, ...form });
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteMutation.mutate({ id: deletingUser.id });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCount = users?.length || 0;
  const adminCount = users?.filter((u) => u.role === "admin").length || 0;
  const managerCount = users?.filter((u) => u.role === "manager").length || 0;
  const readerCount = users?.filter((u) => u.role === "reader").length || 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários e suas permissões</p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{adminCount}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gestores</CardTitle>
            <UserCog className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{managerCount}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leitura</CardTitle>
            <Eye className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{readerCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-base font-medium">Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-medium">Usuário</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Perfil</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Último Acesso</TableHead>
                  <TableHead className="font-medium">Cadastro</TableHead>
                  {isAdmin && <TableHead className="font-medium">Áreas</TableHead>}
                  {isAdmin && <TableHead className="font-medium text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name || "Sem nome"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {user.email || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${roleColors[user.role]} font-medium px-3 py-1`}
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          Ativo
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          Inativo
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {user.lastSignedIn
                          ? new Date(user.lastSignedIn).toLocaleDateString("pt-BR")
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.role === "admin" ? (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Todas</Badge>
                          ) : (user as any).areas?.length > 0 ? (
                            (user as any).areas.map((area: string) => (
                              <Badge key={area} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{area}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 w-8 hover:bg-muted"
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {user.role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setAccessUser(user)}
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              title="Gerenciar acesso a áreas de negócio"
                            >
                              <Building2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setPasswordUser(user); setNewPassword(""); }}
                            className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
                            title={user.passwordHash ? "Redefinir senha" : "Definir senha"}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingUser(user)}
                            disabled={user.id === currentUser?.id}
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            title={user.id === currentUser?.id ? "Não é possível desativar sua própria conta" : "Desativar usuário"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Os usuários serão listados aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal: Criar Usuário ─────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setFormErrors({}); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <UserForm form={form} setForm={setForm} errors={formErrors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setFormErrors({}); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Editar Usuário ────────────────────────────────────────────── */}
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) { setEditingUser(null); setFormErrors({}); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Edite os dados do usuário <strong>{editingUser?.name || editingUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <UserForm form={form} setForm={setForm} errors={formErrors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingUser(null); setFormErrors({}); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Gerenciar Acesso a Áreas ────────────────────────────────── */}
      <Dialog open={!!accessUser} onOpenChange={(open) => { if (!open) setAccessUser(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Acesso a Áreas de Negócio
            </DialogTitle>
            <DialogDescription>
              Selecione quais áreas <strong>{accessUser?.name || accessUser?.email}</strong> pode acessar.
              {accessUser?.role === "admin" && " Administradores têm acesso total automaticamente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
            {allUnits && allUnits.length > 0 ? allUnits.map((unit: any) => {
              const isAssigned = userAccess?.some((ua: any) => ua.businessUnitId === unit.id);
              return (
                <label
                  key={unit.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isAssigned ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={isAssigned}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        assignMutation.mutate({ userId: accessUser.id, businessUnitId: unit.id });
                      } else {
                        removeMutation.mutate({ userId: accessUser.id, businessUnitId: unit.id });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{unit.name}</p>
                    {unit.code && <p className="text-xs text-muted-foreground">{unit.code}</p>}
                  </div>
                </label>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma área de negócio cadastrada.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccessUser(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Redefinir/Definir Senha ──────────────────────────────────── */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => { if (!open) { setPasswordUser(null); setNewPassword(""); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {passwordUser?.passwordHash ? "Redefinir Senha" : "Definir Senha"}
            </DialogTitle>
            <DialogDescription>
              {passwordUser?.passwordHash
                ? `Defina uma nova senha para ${passwordUser?.name || passwordUser?.email}.`
                : `Este usuário usa login OAuth. Defina uma senha para habilitar login por email/senha.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordUser(null); setNewPassword(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (newPassword.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }
                if (passwordUser?.passwordHash) {
                  resetPasswordMutation.mutate({ id: passwordUser.id, newPassword });
                } else {
                  setPasswordMutation.mutate({ id: passwordUser.id, password: newPassword });
                }
              }}
              disabled={resetPasswordMutation.isPending || setPasswordMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {(resetPasswordMutation.isPending || setPasswordMutation.isPending) ? "Salvando..." : "Salvar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Confirmar Exclusão ─────────────────────────────────────── */}   <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{deletingUser?.name || deletingUser?.email}</strong> será desativado e não poderá mais acessar o sistema. Esta ação pode ser revertida editando o usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sub-componente: formulário reutilizável ──────────────────────────────────
function UserForm({
  form,
  setForm,
  errors,
}: {
  form: UserFormData;
  setForm: (f: UserFormData) => void;
  errors: Partial<{ name: string; email: string; role: string; isActive: boolean; general: string }>;
}) {
  return (
    <div className="space-y-4 py-2">
      {errors.general && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {errors.general}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="user-name">Nome completo *</Label>
        <Input
          id="user-name"
          placeholder="Ex: João da Silva"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={errors.name ? "border-red-400" : ""}
        />
        {errors.name && <p className="text-xs text-red-500">{String(errors.name)}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="user-email">E-mail *</Label>
        <Input
          id="user-email"
          type="email"
          placeholder="usuario@empresa.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={errors.email ? "border-red-400" : ""}
        />
        {errors.email && <p className="text-xs text-red-500">{String(errors.email)}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="user-role">Perfil de acesso *</Label>
        <Select
          value={form.role}
          onValueChange={(v) => setForm({ ...form, role: v as "admin" | "manager" | "reader" })}
        >
          <SelectTrigger id="user-role" className={errors.role ? "border-red-400" : ""}>
            <SelectValue placeholder="Selecione o perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador — Acesso total</SelectItem>
            <SelectItem value="manager">Gestor — Criar e editar fornecedores</SelectItem>
            <SelectItem value="reader">Leitura — Apenas visualização</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-xs text-red-500">{String(errors.role)}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="user-status">Status</Label>
        <Select
          value={form.isActive ? "active" : "inactive"}
          onValueChange={(v) => setForm({ ...form, isActive: v === "active" })}
        >
          <SelectTrigger id="user-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

