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
  AlertCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AIAutofillResult {
  title: string;
  number: string;
  contractType: string;
  object: string;
  totalValue: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  contractorName: string;
  contractorCnpj: string;
  contracteeName: string;
  contracteeCnpj: string;
  legalRepresentative: string;
  deliverables: string;
  notes: string;
  missingFields: string[];
  confidence: "high" | "medium" | "low";
  confidenceNotes: string;
  summary: string;
}

interface AIAutoFillSectionProps {
  templateId: number;
  templateName: string;
  templateContent?: string;
  onApplySuggestions: (data: Partial<AIAutofillResult>) => void;
}

type State =
  | "idle"
  | "uploading"
  | "analyzing"
  | "ready"
  | "error"
  | "no_data"
  | "applied";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];
const ACCEPTED_EXT = [".pdf", ".docx", ".doc", ".txt"];
const MAX_MB = 16;

const confidenceConfig = {
  high: {
    label: "Alta confiança",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  medium: {
    label: "Confiança média",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertTriangle,
  },
  low: {
    label: "Baixa confiança — revise com atenção",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
};

const fieldLabels: Record<string, string> = {
  title: "Título do contrato",
  number: "Número do contrato",
  contractType: "Tipo de contrato",
  object: "Objeto do contrato",
  totalValue: "Valor total",
  startDate: "Data de início",
  endDate: "Data de término",
  paymentTerms: "Condições de pagamento",
  contractorName: "Nome da contratante",
  contractorCnpj: "CNPJ da contratante",
  contracteeName: "Nome da contratada",
  contracteeCnpj: "CNPJ da contratada",
  legalRepresentative: "Representante legal",
  deliverables: "Entregáveis",
  notes: "Informações complementares",
};

const contractTypeLabels: Record<string, string> = {
  service: "Prestação de Serviços",
  supply: "Fornecimento",
  lease: "Locação",
  consulting: "Consultoria",
  maintenance: "Manutenção",
  other: "Outro",
};

function toFileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AIAutoFillSection({
  templateId,
  templateName,
  templateContent,
  onApplySuggestions,
}: AIAutoFillSectionProps) {
  const [state, setState] = useState<State>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<AIAutofillResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.templates.analyzeFileForAutofill.useMutation();

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXT.some(e => f.name.toLowerCase().endsWith(e))) {
      return "Formato não suportado. Use PDF, DOCX, DOC ou TXT.";
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `O arquivo excede o limite de ${MAX_MB}MB.`;
    }
    if (f.size === 0) {
      return "O arquivo está vazio.";
    }
    return null;
  };

  const processFile = useCallback(async (f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    setFile(f);
    setError("");
    setState("uploading");

    try {
      const base64 = await toFileBase64(f);
      setState("analyzing");

      const response = await analyzeMutation.mutateAsync({
        fileBase64: base64,
        fileName: f.name,
        mimeType: f.type,
        templateId,
        templateName,
        templateContent,
      });

      if (!response.success || !response.extracted) {
        setState("error");
        setError("Não foi possível processar o arquivo. Tente novamente ou use um formato diferente.");
        return;
      }

      const extracted = response.extracted as AIAutofillResult;

      // Check if we got any useful data
      const hasData = Object.entries(extracted).some(([k, v]) => {
        if (["missingFields", "confidence", "confidenceNotes", "summary"].includes(k)) return false;
        return typeof v === "string" && v.trim().length > 0;
      });

      if (!hasData) {
        setState("no_data");
        return;
      }

      setResult(extracted);
      setState("ready");
    } catch {
      setState("error");
      setError("Falha ao processar o arquivo. Verifique sua conexão e tente novamente.");
    }
  }, [analyzeMutation, templateId, templateName, templateContent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
    e.target.value = "";
  };

  const handleApply = () => {
    if (!result) return;
    // Build partial data — only non-empty fields
    const partial: Partial<AIAutofillResult> = {};
    (Object.keys(fieldLabels) as (keyof AIAutofillResult)[]).forEach((k) => {
      const v = result[k];
      if (typeof v === "string" && v.trim()) {
        (partial as any)[k] = v;
      }
    });
    onApplySuggestions(partial);
    setState("applied");
  };

  const handleReset = () => {
    setState("idle");
    setFile(null);
    setError("");
    setResult(null);
    setShowDetails(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mt-6">
      <Separator className="mb-6" />

      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Autopreenchimento com I.A.
        </h3>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
          Beta
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Envie um arquivo para que a I.A. identifique dados relevantes e sugira o preenchimento deste contrato com base no template{" "}
        <span className="font-medium text-foreground">{templateName}</span>.
      </p>

      {/* ── IDLE STATE ── */}
      {state === "idle" && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Arraste um arquivo ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, DOC, TXT — até {MAX_MB}MB
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Propostas, minutas, contratos anteriores, fichas cadastrais e documentos institucionais
          </p>
        </div>
      )}

      {/* ── UPLOADING STATE ── */}
      {state === "uploading" && (
        <div className="border rounded-lg p-5 flex items-center gap-4 bg-muted/20">
          <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Carregando arquivo…</p>
            <p className="text-xs text-muted-foreground">{file?.name}</p>
          </div>
        </div>
      )}

      {/* ── ANALYZING STATE ── */}
      {state === "analyzing" && (
        <div className="border rounded-lg p-5 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">A I.A. está analisando o documento…</p>
              <p className="text-xs text-muted-foreground">{file?.name}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {["Lendo o conteúdo do arquivo", "Identificando dados contratuais", "Verificando aderência ao template"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {state === "error" && (
        <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">Não foi possível processar o arquivo</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleReset}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={handleReset}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* ── NO DATA STATE ── */}
      {state === "no_data" && (
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">Dados insuficientes no arquivo</p>
              <p className="text-xs text-amber-700 mt-0.5">
                A I.A. não encontrou informações contratuais suficientes neste documento. Tente com um arquivo diferente ou preencha os campos manualmente.
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleReset}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={handleReset}>
            Usar outro arquivo
          </Button>
        </div>
      )}

      {/* ── READY STATE (suggestions) ── */}
      {state === "ready" && result && (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-foreground">Sugestões prontas para revisão</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Confidence badge */}
            {(() => {
              const conf = confidenceConfig[result.confidence] || confidenceConfig.medium;
              const Icon = conf.icon;
              return (
                <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${conf.color}`}>
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">{conf.label}</span>
                    {result.confidenceNotes && (
                      <p className="mt-0.5 opacity-80">{result.confidenceNotes}</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Summary */}
            {result.summary && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 leading-relaxed">
                {result.summary}
              </div>
            )}

            {/* Missing fields warning */}
            {result.missingFields && result.missingFields.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <span className="font-medium">Campos não encontrados no arquivo:</span>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside opacity-80">
                    {result.missingFields.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Suggestions detail toggle */}
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              onClick={() => setShowDetails(v => !v)}
            >
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showDetails ? "Ocultar dados sugeridos" : "Ver dados sugeridos"}
            </button>

            {showDetails && (
              <div className="rounded-md border divide-y text-xs overflow-hidden">
                {(Object.keys(fieldLabels) as (keyof AIAutofillResult)[]).map((key) => {
                  const val = result[key];
                  if (typeof val !== "string" || !val.trim()) return null;
                  const display = key === "contractType" ? (contractTypeLabels[val] || val) : val;
                  return (
                    <div key={key} className="flex gap-3 px-3 py-2 hover:bg-muted/20">
                      <span className="text-muted-foreground w-36 shrink-0">{fieldLabels[key]}</span>
                      <span className="text-foreground break-words min-w-0">{display}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Instruction */}
            <p className="text-xs text-muted-foreground">
              Revise os dados sugeridos antes de aplicá-los ao contrato. Campos já preenchidos por você não serão sobrescritos.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleApply}
              >
                <Sparkles className="h-3 w-3" />
                Aplicar sugestões
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleReset}
              >
                Descartar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPLIED STATE ── */}
      {state === "applied" && (
        <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800">Sugestões aplicadas com sucesso</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Revise os campos preenchidos e ajuste o que for necessário antes de salvar.
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleReset}>
              <FileText className="h-3 w-3 text-emerald-700" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
