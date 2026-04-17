import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Eye,
  Building2,
} from "lucide-react";

interface TemplatePlaceholderFillerProps {
  templateId: number;
  templateContent: string;
  supplierId: number;
  onContentGenerated: (content: string) => void;
}

/**
 * Componente que detecta placeholders no template, preenche automaticamente
 * os do sistema (fornecedor, empresa, contatos), e permite editar os restantes.
 * Ao clicar "Gerar Conteúdo", chama fillFromTemplate no backend.
 */
export function TemplatePlaceholderFiller({
  templateId,
  templateContent,
  supplierId,
  onContentGenerated,
}: TemplatePlaceholderFillerProps) {
  // Detecta placeholders localmente (sem chamada ao backend)
  const placeholders = useMemo(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const set = new Set<string>();
    let match;
    while ((match = regex.exec(templateContent)) !== null) {
      set.add(match[1].trim());
    }
    return Array.from(set);
  }, [templateContent]);

  // Busca empresas para seleção de contratante
  const { data: companies } = trpc.companies.listAll.useQuery();

  // Estado: empresa selecionada e valores customizados
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mutation para preencher o template
  const fillMutation = trpc.contracts.fillFromTemplate.useMutation({
    onSuccess: (result) => {
      if (result.unfilledPlaceholders.length > 0) {
        toast.info(`${result.unfilledPlaceholders.length} placeholder(s) não preenchido(s)`, {
          description: "Preencha manualmente os campos restantes.",
        });
      } else {
        toast.success("Todos os placeholders preenchidos!");
      }
      setPreviewContent(result.filledContent);
      setShowPreview(true);

      // Atualiza os campos customizados com os valores do sistema para referência
      const newCustom = { ...customValues };
      for (const [key, val] of Object.entries(result.systemValues)) {
        if (val && !newCustom[key]) {
          newCustom[key] = val;
        }
      }
      setCustomValues(newCustom);
    },
    onError: (err) => toast.error("Erro ao preencher template", { description: err.message }),
  });

  // Placeholders conhecidos do sistema (preenchidos automaticamente)
  const systemPlaceholders = useMemo(() => new Set([
    "razao_social_contratado", "nome_fantasia_contratado", "cnpj_contratado",
    "endereco_contratado", "email_contratado", "telefone_contratado",
    "inscricao_estadual_contratado", "inscricao_municipal_contratado",
    "banco_contratado", "agencia_contratado", "conta_contratado", "pix_contratado",
    "numero_contrato", "titulo_contrato", "objeto_contrato", "valor_total",
    "condicoes_pagamento", "data_inicio", "data_fim",
    "nome_contratante", "cnpj_contratante", "representante_contratante",
    "empresa_nome", "empresa_cnpj", "empresa_endereco",
    "contato_principal_nome", "contato_principal_email",
    "contato_principal_telefone", "contato_principal_cargo",
    "data_atual", "data_extenso",
  ]), []);

  const systemOnes = placeholders.filter(p => systemPlaceholders.has(p));
  const customOnes = placeholders.filter(p => !systemPlaceholders.has(p));

  const handleFill = () => {
    fillMutation.mutate({
      templateId,
      supplierId,
      companyId: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
      customValues: Object.keys(customValues).length > 0 ? customValues : undefined,
    });
  };

  const handleApplyContent = () => {
    if (previewContent) {
      onContentGenerated(previewContent);
      toast.success("Conteúdo aplicado ao contrato");
    }
  };

  if (placeholders.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
        Este template não contém placeholders ({`{{ }}`}). O conteúdo será usado como está.
      </div>
    );
  }

  return (
    <div className="space-y-4 border border-blue-200 rounded-xl bg-blue-50/50 p-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-blue-600" />
        <p className="font-semibold text-blue-800 text-sm">Preenchimento de Placeholders</p>
        <Badge variant="outline" className="text-xs ml-auto">
          {placeholders.length} placeholder{placeholders.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <p className="text-xs text-blue-700">
        O template contém {placeholders.length} placeholder{placeholders.length !== 1 ? "s" : ""}.
        {systemOnes.length > 0 && ` ${systemOnes.length} serão preenchidos automaticamente com dados do fornecedor/empresa.`}
        {customOnes.length > 0 && ` ${customOnes.length} precisam ser preenchidos manualmente.`}
      </p>

      {/* Seleção de empresa contratante */}
      <div>
        <Label className="text-xs font-medium text-blue-800">Empresa Contratante (opcional)</Label>
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger className="mt-1 bg-white">
            <SelectValue placeholder="Selecione a empresa contratante..." />
          </SelectTrigger>
          <SelectContent>
            {companies?.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  {c.legalName} {c.cnpj ? `(${c.cnpj})` : ""}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Placeholders automáticos do sistema */}
      {systemOnes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Preenchidos automaticamente ({systemOnes.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {systemOnes.map((p) => (
              <Badge key={p} className="text-xs bg-green-100 text-green-700 border-0">
                {`{{${p}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Placeholders customizados (manuais) */}
      {customOnes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Preenchimento manual ({customOnes.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {customOnes.map((p) => (
              <div key={p}>
                <Label className="text-xs text-muted-foreground">{p.replace(/_/g, " ")}</Label>
                <Input
                  value={customValues[p] || ""}
                  onChange={(e) => setCustomValues(prev => ({ ...prev, [p]: e.target.value }))}
                  placeholder={`Valor para {{${p}}}`}
                  className="mt-0.5 bg-white text-sm h-8"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleFill}
          disabled={fillMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          {fillMutation.isPending ? (
            <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Preenchendo...</>
          ) : (
            <><Wand2 className="mr-2 h-3 w-3" />Preencher Placeholders</>
          )}
        </Button>
        {previewContent && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-1 h-3 w-3" />
            {showPreview ? "Ocultar Preview" : "Ver Preview"}
          </Button>
        )}
      </div>

      {/* Preview do conteúdo preenchido */}
      {showPreview && previewContent && (
        <div className="space-y-2">
          <div className="rounded-lg border bg-white p-4 max-h-60 overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">
              {previewContent}
            </pre>
          </div>
          <Button
            onClick={handleApplyContent}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Aplicar ao Contrato
          </Button>
        </div>
      )}
    </div>
  );
}
