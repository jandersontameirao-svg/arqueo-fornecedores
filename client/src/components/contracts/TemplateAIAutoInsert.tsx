import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtractedTemplateData {
  name: string;
  contractType: string;
  description: string;
  content: string;
  confidence: "high" | "medium" | "low";
  confidenceNotes: string;
  summary: string;
  missingFields: string[];
}

interface TemplateAIAutoInsertProps {
  /** Callback chamado quando o usuário aplica as sugestões */
  onApply: (data: Partial<{
    name: string;
    contractType: string;
    description: string;
    content: string;
  }>) => void;
}

// ─── Estado da máquina ────────────────────────────────────────────────────────
type State =
  | "idle"        // 1. Botão "Auto-Inserção com I.A." visível
  | "expanded"    // 2. Painel aberto, aguardando upload
  | "dragging"    // 3. Arquivo sendo arrastado sobre a área
  | "uploading"   // 4. Enviando arquivo ao servidor
  | "analyzing"   // 5. IA processando
  | "suggestion"  // 6. Sugestões prontas para revisão
  | "applied"     // 7. Sugestões aplicadas com sucesso
  | "error";      // 8. Erro no processo

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];
const ACCEPTED_EXT = [".pdf", ".docx", ".doc", ".txt"];
const MAX_SIZE_MB = 16;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confidenceBadge(confidence: string) {
  if (confidence === "high")
    return <Badge className="bg-green-100 text-green-700 border-green-200">Alta confiança</Badge>;
  if (confidence === "medium")
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Confiança média</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">Baixa confiança</Badge>;
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  service: "Prestação de Serviços",
  supply: "Fornecimento",
  lease: "Locação",
  consulting: "Consultoria",
  maintenance: "Manutenção",
  other: "Outro",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateAIAutoInsert({ onApply }: TemplateAIAutoInsertProps) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [extracted, setExtracted] = useState<ExtractedTemplateData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showContent, setShowContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.templates.analyzeFileForTemplate.useMutation({
    onSuccess: (data) => {
      if (!data.success || !data.extracted) {
        setState("error");
        setErrorMsg(data.error || "Não foi possível processar o arquivo.");
        return;
      }
      setExtracted(data.extracted as ExtractedTemplateData);
      setState("suggestion");
    },
    onError: (err) => {
      setState("error");
      setErrorMsg(err.message || "Erro ao analisar o arquivo.");
    },
  });

  // ── File validation & processing ──────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.some((e) => file.name.endsWith(e))) {
      toast.error("Formato não suportado", { description: "Use PDF, DOCX, DOC ou TXT." });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: `Limite de ${MAX_SIZE_MB}MB.` });
      return;
    }
    setSelectedFile(file);
    setState("uploading");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setState("analyzing");
      analyzeMutation.mutate({
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(file);
  }, [analyzeMutation, toast]);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setState("dragging"); };
  const onDragLeave = () => { if (state === "dragging") setState("expanded"); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Apply ─────────────────────────────────────────────────────────────────

  const handleApply = () => {
    if (!extracted) return;
    onApply({
      name: extracted.name || undefined,
      contractType: extracted.contractType || undefined,
      description: extracted.description || undefined,
      content: extracted.content || undefined,
    });
    setState("applied");
    toast.success("Sugestões aplicadas!", { description: "Revise e ajuste os campos conforme necessário." });
  };

  const handleReset = () => {
    setState("expanded");
    setExtracted(null);
    setSelectedFile(null);
    setErrorMsg("");
    setShowContent(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Estado 1: Botão discreto
  if (state === "idle") {
    return (
      <div className="flex justify-end mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-[#8B1A2E] border-[#8B1A2E]/30 hover:bg-[#8B1A2E]/5 hover:border-[#8B1A2E]/60"
          onClick={() => setState("expanded")}
        >
          <Sparkles className="w-4 h-4" />
          Auto-Inserção com I.A.
        </Button>
      </div>
    );
  }

  // Estado 7: Aplicado com sucesso
  if (state === "applied") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Sugestões da I.A. aplicadas com sucesso. Revise os campos abaixo.</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-green-700 hover:text-green-900 gap-1"
          onClick={handleReset}
        >
          <RefreshCw className="w-3 h-3" />
          Usar outro arquivo
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#8B1A2E]/20 bg-[#8B1A2E]/[0.02] mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#8B1A2E]/[0.04] border-b border-[#8B1A2E]/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B1A2E]" />
          <span className="text-sm font-semibold text-[#8B1A2E]">Auto-Inserção com I.A.</span>
          <span className="text-xs text-muted-foreground">— Envie um arquivo e a I.A. preenche o template automaticamente</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setState("idle")}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">

        {/* Estados 2 e 3: Upload / Dragging */}
        {(state === "expanded" || state === "dragging") && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${state === "dragging"
                ? "border-[#8B1A2E] bg-[#8B1A2E]/10 scale-[1.01]"
                : "border-[#8B1A2E]/30 hover:border-[#8B1A2E]/60 hover:bg-[#8B1A2E]/5"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXT.join(",")}
              className="hidden"
              onChange={onFileChange}
            />
            <Upload className={`w-8 h-8 mx-auto mb-3 ${state === "dragging" ? "text-[#8B1A2E]" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium text-foreground mb-1">
              {state === "dragging" ? "Solte o arquivo aqui" : "Arraste ou clique para selecionar"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, DOC ou TXT — máx. {MAX_SIZE_MB}MB</p>
            <p className="text-xs text-muted-foreground mt-2">
              A I.A. extrairá nome, tipo, descrição e conteúdo do documento, substituindo dados específicos por placeholders.
            </p>
          </div>
        )}

        {/* Estado 4: Enviando */}
        {state === "uploading" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B1A2E]" />
            <p className="text-sm font-medium">Enviando arquivo…</p>
            {selectedFile && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-4 h-4" />
                {selectedFile.name}
              </div>
            )}
          </div>
        )}

        {/* Estado 5: Analisando */}
        {state === "analyzing" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-[#8B1A2E] animate-pulse" />
            </div>
            <p className="text-sm font-medium">I.A. analisando o documento…</p>
            <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
            {selectedFile && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-4 h-4" />
                {selectedFile.name}
              </div>
            )}
          </div>
        )}

        {/* Estado 8: Erro */}
        {state === "error" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Não foi possível processar o arquivo</p>
                <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Estado 6: Sugestões */}
        {state === "suggestion" && extracted && (
          <div className="space-y-4">
            {/* Cabeçalho da sugestão */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold">Extração concluída</span>
                {confidenceBadge(extracted.confidence)}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs">
                <RefreshCw className="w-3 h-3" />
                Outro arquivo
              </Button>
            </div>

            {/* Resumo da IA */}
            {extracted.summary && (
              <div className="rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground italic">
                {extracted.summary}
              </div>
            )}

            {/* Campos extraídos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extracted.name && (
                <div className="rounded-md border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Nome do Template</p>
                  <p className="text-sm font-medium">{extracted.name}</p>
                </div>
              )}
              {extracted.contractType && (
                <div className="rounded-md border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Tipo de Contrato</p>
                  <p className="text-sm font-medium">{CONTRACT_TYPE_LABELS[extracted.contractType] || extracted.contractType}</p>
                </div>
              )}
              {extracted.description && (
                <div className="rounded-md border bg-card p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{extracted.description}</p>
                </div>
              )}
            </div>

            {/* Conteúdo extraído (expansível) */}
            {extracted.content && (
              <div className="rounded-md border bg-card overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
                  onClick={() => setShowContent((v) => !v)}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Conteúdo extraído ({Math.round(extracted.content.length / 1000)}k caracteres)
                  </span>
                  {showContent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showContent && (
                  <div className="px-4 pb-4">
                    <Separator className="mb-3" />
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                      {extracted.content.substring(0, 3000)}
                      {extracted.content.length > 3000 && "\n\n[... conteúdo truncado para visualização ...]"}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Campos não encontrados */}
            {extracted.missingFields.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-yellow-700 mb-1">Campos não identificados:</p>
                  <p className="text-xs text-yellow-600">{extracted.missingFields.join(", ")}</p>
                </div>
              </div>
            )}

            {/* Nota de confiança */}
            {extracted.confidenceNotes && (
              <p className="text-xs text-muted-foreground italic">{extracted.confidenceNotes}</p>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-[#8B1A2E] hover:bg-[#6d1524] text-white"
                onClick={handleApply}
              >
                <Check className="w-4 h-4" />
                Aplicar sugestões ao formulário
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <X className="w-4 h-4" />
                Descartar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
