import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentUploadProps {
  supplierId: number;
  onSuccess?: () => void;
}

interface FileWithPreview {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  documentType?: string;
  expiresAt?: string;
  error?: string;
}

const documentTypes = [
  { value: "contract", label: "Contrato" },
  { value: "certificate", label: "Certidão" },
  { value: "invoice", label: "Nota Fiscal" },
  { value: "license", label: "Licença/Alvará" },
  { value: "insurance", label: "Seguro" },
  { value: "registration", label: "Registro/Cadastro" },
  { value: "other", label: "Outro" },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function DocumentUpload({ supplierId, onSuccess }: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate({ supplierId });
      onSuccess?.();
    },
  });

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
      // Convert file to base64
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
        name: fileItem.name,
        type: fileItem.documentType || "other",
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

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
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
        <div className="flex flex-col items-center gap-3">
          <div className={`
            h-14 w-14 rounded-full flex items-center justify-center
            ${isDragging ? "bg-primary/20" : "bg-muted"}
          `}>
            <Upload className={`h-7 w-7 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragging ? "Solte os arquivos aqui" : "Arraste e solte arquivos aqui"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ou clique para selecionar (máx. 10MB por arquivo)
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Arquivos ({files.length})
              {successCount > 0 && (
                <span className="text-green-600 ml-2">
                  • {successCount} enviado{successCount > 1 ? "s" : ""}
                </span>
              )}
            </h4>
            {pendingCount > 0 && (
              <Button onClick={uploadAllFiles} size="sm" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Enviar {pendingCount} arquivo{pendingCount > 1 ? "s" : ""}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => (
              <Card key={fileItem.id} className={`
                ${fileItem.status === "success" ? "border-green-200 bg-green-50/50" : ""}
                ${fileItem.status === "error" ? "border-red-200 bg-red-50/50" : ""}
              `}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className={`
                      h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                      ${fileItem.status === "success" ? "bg-green-100" : ""}
                      ${fileItem.status === "error" ? "bg-red-100" : ""}
                      ${fileItem.status === "pending" || fileItem.status === "uploading" ? "bg-muted" : ""}
                    `}>
                      {fileItem.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : fileItem.status === "error" ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : fileItem.status === "uploading" ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{fileItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileItem.size)}
                          </p>
                        </div>
                        {fileItem.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeFile(fileItem.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Upload Progress */}
                      {fileItem.status === "uploading" && (
                        <Progress value={fileItem.progress} className="h-1.5" />
                      )}

                      {/* Error Message */}
                      {fileItem.status === "error" && fileItem.error && (
                        <p className="text-xs text-red-600">{fileItem.error}</p>
                      )}

                      {/* Document Settings (only for pending files) */}
                      {fileItem.status === "pending" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Tipo de Documento</Label>
                            <Select
                              value={fileItem.documentType}
                              onValueChange={(value) =>
                                updateFileField(fileItem.id, "documentType", value)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {documentTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Data de Validade
                            </Label>
                            <Input
                              type="date"
                              className="h-8 text-xs"
                              value={fileItem.expiresAt}
                              onChange={(e) =>
                                updateFileField(fileItem.id, "expiresAt", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
