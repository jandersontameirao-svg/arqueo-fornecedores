import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
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
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  AlertTriangle,
  Building2,
  File,
  FileImage,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  contract: "Contrato",
  certificate: "Certidão",
  invoice: "Nota Fiscal",
  license: "Licença",
  other: "Outro",
};

const typeColors: Record<string, string> = {
  contract: "bg-blue-100 text-blue-800",
  certificate: "bg-green-100 text-green-800",
  invoice: "bg-purple-100 text-purple-800",
  license: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

export default function Documents() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expirationFilter, setExpirationFilter] = useState<string>("all");

  const { data: documents, isLoading } = trpc.documents.listAll.useQuery({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    expirationStatus: expirationFilter !== "all" ? expirationFilter : undefined,
  });

  // Janela crítica: somente documentos com ≤15 dias para vencer
  const isExpiringSoon = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 15 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-5 w-5 text-muted-foreground" />;
    if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">
          Visualize todos os documentos de fornecedores
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="certificate">Certidão</SelectItem>
                <SelectItem value="invoice">Nota Fiscal</SelectItem>
                <SelectItem value="license">Licença</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expirationFilter} onValueChange={setExpirationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Expiração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="expiring">Expirando em 15 dias</SelectItem>
                <SelectItem value="valid">Válidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((item) => (
                  <TableRow key={item.document.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(item.document.mimeType)}
                        <div>
                          <p className="font-medium">{item.document.name}</p>
                          <p className="text-xs text-muted-foreground">{item.document.fileName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.supplier ? (
                        <button
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                          onClick={() => setLocation(`/suppliers/${item.supplier!.id}`)}
                        >
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">{item.supplier.companyName}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[item.document.type]}>
                        {typeLabels[item.document.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.document.expiresAt ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(item.document.expiresAt).toLocaleDateString("pt-BR")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem expiração</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isExpired(item.document.expiresAt) ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expirado
                        </Badge>
                      ) : isExpiringSoon(item.document.expiresAt) ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expira em breve
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Válido</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(item.document.fileUrl, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || typeFilter !== "all" || expirationFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Os documentos serão listados aqui"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
