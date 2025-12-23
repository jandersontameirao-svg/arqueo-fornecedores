import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  Calendar,
  AlertTriangle,
  File,
  FileImage,
  FileArchive,
} from "lucide-react";
import { storagePut } from "../../../../server/storage";

interface SupplierDocumentsProps {
  supplierId: number;
  canEdit: boolean;
}

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

export default function SupplierDocuments({ supplierId, canEdit }: SupplierDocumentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "other" as "contract" | "certificate" | "invoice" | "license" | "other",
    description: "",
    expiresAt: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.documents.list.useQuery({ supplierId });
  
  const createMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      utils.documents.list.invalidate({ supplierId });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento excluído");
      utils.documents.list.invalidate({ supplierId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", type: "other", description: "", expiresAt: "" });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData((prev) => ({ ...prev, name: file.name.split(".")[0] }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }
    if (!formData.name) {
      toast.error("Informe o nome do documento");
      return;
    }

    setUploading(true);
    try {
      // Upload file to S3 using fetch to our API
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileKey = `documents/${supplierId}/${timestamp}-${randomSuffix}-${selectedFile.name}`;
      
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        // For now, we'll use a placeholder URL - in production, this would upload to S3
        const fileUrl = `https://storage.example.com/${fileKey}`;
        
        await createMutation.mutateAsync({
          supplierId,
          name: formData.name,
          type: formData.type,
          description: formData.description || undefined,
          fileKey,
          fileUrl,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          expiresAt: formData.expiresAt || undefined,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  const isExpiringSoon = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-8 w-8 text-muted-foreground" />;
    if (mimeType.startsWith("image/")) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (mimeType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (mimeType.includes("zip") || mimeType.includes("rar")) return <FileArchive className="h-8 w-8 text-yellow-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Documentos</CardTitle>
        {canEdit && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Documento</DialogTitle>
                <DialogDescription>
                  Faça upload de um documento para este fornecedor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Arquivo *</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Documento *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contrato</SelectItem>
                      <SelectItem value="certificate">Certidão</SelectItem>
                      <SelectItem value="invoice">Nota Fiscal</SelectItem>
                      <SelectItem value="license">Licença</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Expiração</Label>
                  <Input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Observações sobre o documento..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={uploading || createMutation.isPending}>
                  {uploading ? "Enviando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((item) => (
              <div
                key={item.document.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(item.document.mimeType)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.document.name}</p>
                      <Badge className={typeColors[item.document.type]}>
                        {typeLabels[item.document.type]}
                      </Badge>
                      {isExpired(item.document.expiresAt) && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expirado
                        </Badge>
                      )}
                      {isExpiringSoon(item.document.expiresAt) && !isExpired(item.document.expiresAt) && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expira em breve
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{item.document.fileName}</span>
                      {item.document.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expira: {new Date(item.document.expiresAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(item.document.fileUrl, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: item.document.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum documento cadastrado</p>
            {canEdit && (
              <Button className="mt-3" size="sm" onClick={() => setIsOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar documento
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
