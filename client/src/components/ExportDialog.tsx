import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Array<{ id: number; name: string }>;
}

const availableFields = [
  { id: "companyName", label: "Razão Social", default: true },
  { id: "tradeName", label: "Nome Fantasia", default: false },
  { id: "cnpj", label: "CNPJ", default: true },
  { id: "email", label: "Email", default: true },
  { id: "phone", label: "Telefone", default: true },
  { id: "website", label: "Website", default: false },
  { id: "street", label: "Rua", default: false },
  { id: "city", label: "Cidade", default: false },
  { id: "state", label: "Estado", default: false },
  { id: "zipCode", label: "CEP", default: false },
  { id: "bankName", label: "Banco", default: false },
  { id: "status", label: "Status", default: true },
  { id: "criticality", label: "Criticidade", default: true },
];

export function ExportDialog({ open, onOpenChange, categories }: ExportDialogProps) {
  const [format, setFormat] = useState<"excel" | "pdf">("excel");
  const [categoryId, setCategoryId] = useState<string>("__all__");
  const [status, setStatus] = useState<string>("__all__");
  const [criticality, setCriticality] = useState<string>("__all__");
  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.filter((f) => f.default).map((f) => f.id)
  );

  const exportMutation = trpc.export.suppliers.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Exportação concluída!", {
        description: `Arquivo ${data.filename} baixado com sucesso.`,
      });
      
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro na exportação", {
        description: error.message,
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate({
      format,
      filters: {
        categoryId: (categoryId && categoryId !== "__all__") ? parseInt(categoryId) : undefined,
        status: (status && status !== "__all__") ? status : undefined,
        criticality: (criticality && criticality !== "__all__") ? criticality : undefined,
      },
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    });
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(availableFields.map((f) => f.id));
  };

  const deselectAllFields = () => {
    setSelectedFields([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-[oklch(0.50_0.15_15)]" />
            Exportar Fornecedores
          </DialogTitle>
          <DialogDescription>
            Selecione o formato, filtros e campos para exportar os dados dos fornecedores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formato */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Formato de Exportação</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as "excel" | "pdf")}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Excel (.xlsx)</div>
                    <div className="text-sm text-muted-foreground">
                      Planilha editável com formatação e filtros
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">PDF (.pdf)</div>
                    <div className="text-sm text-muted-foreground">
                      Documento formatado para impressão
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Filtros (Opcional)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="criticality" className="text-sm">Criticidade</Label>
                <Select value={criticality} onValueChange={setCriticality}>
                  <SelectTrigger id="criticality">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Campos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Campos para Exportar</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFields}
                  className="h-8 text-xs"
                >
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllFields}
                  className="h-8 text-xs"
                >
                  Limpar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
              {availableFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  />
                  <Label
                    htmlFor={field.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={exportMutation.isPending || selectedFields.length === 0}
            className="bg-[oklch(0.50_0.15_15)] hover:bg-[oklch(0.45_0.15_15)]"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
