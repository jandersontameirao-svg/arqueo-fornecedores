import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  Search,
  Filter,
  User,
  Calendar,
  FileText,
  Building2,
  Shield,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

const actionLabels: Record<string, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  approve: "Aprovação",
  reject: "Rejeição",
  upload: "Upload",
  download: "Download",
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  approve: "bg-emerald-100 text-emerald-800",
  reject: "bg-orange-100 text-orange-800",
  upload: "bg-purple-100 text-purple-800",
  download: "bg-gray-100 text-gray-800",
};

const actionIcons: Record<string, React.ReactNode> = {
  create: <FileText className="h-3 w-3" />,
  update: <Edit className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
  approve: <CheckCircle className="h-3 w-3" />,
  reject: <XCircle className="h-3 w-3" />,
  upload: <Upload className="h-3 w-3" />,
  download: <Download className="h-3 w-3" />,
};

const entityLabels: Record<string, string> = {
  supplier: "Fornecedor",
  document: "Documento",
  contact: "Contato",
  interaction: "Interação",
  evaluation: "Avaliação",
  workflow: "Workflow",
  user: "Usuário",
};

export default function Audit() {
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs, isLoading } = trpc.audit.list.useQuery({
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trilha de Auditoria</h1>
        <p className="text-muted-foreground">
          Histórico de todas as ações realizadas no sistema
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                <SelectItem value="supplier">Fornecedor</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="contact">Contato</SelectItem>
                <SelectItem value="interaction">Interação</SelectItem>
                <SelectItem value="evaluation">Avaliação</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
                <SelectItem value="approve">Aprovação</SelectItem>
                <SelectItem value="reject">Rejeição</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="download">Download</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Registros de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((item) => (
                  <TableRow key={item.log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p>{new Date(item.log.createdAt).toLocaleDateString("pt-BR")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.log.createdAt).toLocaleTimeString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.user?.name || "Sistema"}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.log.userEmail || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {entityLabels[item.log.entityType] || item.log.entityType}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        #{item.log.entityId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[item.log.action]}>
                        {actionIcons[item.log.action]}
                        <span className="ml-1">{actionLabels[item.log.action]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.log.changes ? (
                        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
                          {JSON.stringify(item.log.changes).substring(0, 50)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {entityFilter !== "all" || actionFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Os registros de auditoria serão listados aqui"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
