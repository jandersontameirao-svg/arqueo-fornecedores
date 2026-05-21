import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface SupplierDocumentsProps {
  supplierId: number;
  canEdit: boolean;
}

interface FileWithPreview {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  documentType: string;
  expiresAt: string;
  error?: string;
}

const typeLabels: Record<string, string> = {
  contract: "Contrato",
  certificate: "Certidão",
  invoice: "Nota Fiscal",
  license: "Licença",
  insurance: "Seguro",
  registration: "Registro",
  other: "Outro",
};

const typeColors: Record<string, string> = {
  contract: "bg-[oklch(0.90_0.03_250)] text-[oklch(0.35_0.10_250)]",
  certificate: "bg-green-100 text-green-800",
  invoice: "bg-purple-100 text-purple-800",
  license: "bg-[oklch(0.90_0.05_45)] text-[oklch(0.45_0.15_45)]",
  insurance: "bg-cyan-100 text-cyan-800",
  registration: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800",
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function SupplierDocuments({ supplierId, canEdit }: SupplierDocumentsProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.documents.list.useQuery({ supplierId });

  // Download seguro: gera URL assinada fresca via R2 usando fileKey permanente
  const getSignedUrlMutation = trpc.storage.getSignedUrl.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: () => {
      toast.error("Não foi possível gerar o link de download. Tente novamente.");
    },
  });

  const handleDownload = (fileKey: string | null | undefined, fileUrl: string | null | undefined) => {
    if (fileKey) {
      getSignedUrlMutation.mutate({ fileKey });
    } else if (fileUrl) {
      // Fallback para registros legados sem fileKey
      window.open(fileUrl, "_blank");
    } else {
      toast.error("Arquivo não disponível.");
    }
  };

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate({ supplierId });
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

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    addFiles(selectedFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`Arquivo "${file.name}" excede o limite de 10MB`);
        return false;
      }
      return true;
    });

    const fileObjects: FileWithPreview[] = validFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending" as const,
      progress: 0,
      documentType: "other",
      expiresAt: "",
    }));

    setFiles((prev) => [...prev, ...fileObjects]);
    if (!isUploadOpen) setIsUploadOpen(true);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileField = (id: string, field: keyof FileWithPreview, value: any) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const uploadFile = async (fileItem: FileWithPreview) => {
    updateFileField(fileItem.id, "status", "uploading");
    updateFileField(fileItem.id, "progress", 10);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(fileItem.file);

      updateFileField(fileItem.id, "progress", 30);
      const base64Data = await base64Promise;
      updateFileField(fileItem.id, "progress", 60);

      await uploadMutation.mutateAsync({
        supplierId,
        name: fileItem.name.split(".")[0],
        type: fileItem.documentType,
        fileData: base64Data,
        fileName: fileItem.name,
        mimeType: fileItem.type,
        expiresAt: fileItem.expiresAt ? new Date(fileItem.expiresAt).toISOString() : undefined,
      });

      updateFileField(fileItem.id, "progress", 100);
      updateFileField(fileItem.id, "status", "success");
      toast.success(`"${fileItem.name}" enviado com sucesso!`);
    } catch (error: any) {
      updateFileField(fileItem.id, "status", "error");
      updateFileField(fileItem.id, "error", error.message || "Erro ao enviar arquivo");
      toast.error(`Erro ao enviar "${fileItem.name}"`);
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  const clearCompletedFiles = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "success"));
  };

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
    if (!mimeType) return <File className="h-8 w-8 text-muted-foreground" />;
    if (mimeType.startsWith("image/")) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (mimeType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (mimeType.includes("zip") || mimeType.includes("rar")) return <FileArchive className="h-8 w-8 text-yellow-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Zone */}
        {canEdit && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <div className="flex flex-col items-center gap-2">
              <div className={`
                h-12 w-12 rounded-full flex items-center justify-center
                ${isDragging ? "bg-primary/20" : "bg-muted"}
              `}>
                <Upload className={`h-6 w-6 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragging ? "Solte os arquivos aqui" : "Arraste e solte arquivos aqui"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou clique para selecionar (máx. 10MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Queue */}
        {files.length > 0 && (
          <Collapsible open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {isUploadOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="font-medium">
                    Fila de Upload ({files.length})
                    {successCount > 0 && (
                      <span className="text-green-600 ml-2">• {successCount} enviado{successCount > 1 ? "s" : ""}</span>
                    )}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <div className="flex gap-2">
                {successCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCompletedFiles}>
                    Limpar enviados
                  </Button>
                )}
                {pendingCount > 0 && (
                  <Button size="sm" onClick={uploadAllFiles} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Enviar {pendingCount}
                  </Button>
                )}
              </div>
            </div>
            <CollapsibleContent className="space-y-2 mt-2">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={`
                    p-3 rounded-lg border
                    ${fileItem.status === "success" ? "border-green-200 bg-green-50/50" : ""}
                    ${fileItem.status === "error" ? "border-red-200 bg-red-50/50" : ""}
                    ${fileItem.status === "pending" || fileItem.status === "uploading" ? "border-border bg-card" : ""}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      h-9 w-9 rounded-lg flex items-center justify-center shrink-0
                      ${fileItem.status === "success" ? "bg-green-100" : ""}
                      ${fileItem.status === "error" ? "bg-red-100" : ""}
                      ${fileItem.status === "pending" || fileItem.status === "uploading" ? "bg-muted" : ""}
                    `}>
                      {fileItem.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : fileItem.status === "error" ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : fileItem.status === "uploading" ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{fileItem.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(fileItem.size)}</p>
                        </div>
                        {fileItem.status === "pending" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(fileItem.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {fileItem.status === "uploading" && (
                        <Progress value={fileItem.progress} className="h-1.5" />
                      )}

                      {fileItem.status === "error" && fileItem.error && (
                        <p className="text-xs text-red-600">{fileItem.error}</p>
                      )}

                      {fileItem.status === "pending" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo</Label>
                            <Select
                              value={fileItem.documentType}
                              onValueChange={(value) => updateFileField(fileItem.id, "documentType", value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(typeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Validade
                            </Label>
                            <Input
                              type="date"
                              className="h-8 text-xs"
                              value={fileItem.expiresAt}
                              onChange={(e) => updateFileField(fileItem.id, "expiresAt", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Document List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((item) => (
              <div
                key={item.document.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(item.document.mimeType)}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{item.document.name}</p>
                      <Badge className={typeColors[item.document.type] || typeColors.other}>
                        {typeLabels[item.document.type] || "Outro"}
                      </Badge>
                      {isExpired(item.document.expiresAt) && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expirado
                        </Badge>
                      )}
                      {isExpiringSoon(item.document.expiresAt) && !isExpired(item.document.expiresAt) && (
                        <Badge variant="outline" className="text-[oklch(0.55_0.15_85)] border-[oklch(0.55_0.15_85)] text-xs">
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
                    onClick={() => handleDownload(item.document.fileKey, item.document.fileUrl)}
                    disabled={getSignedUrlMutation.isPending}
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
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum documento cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
