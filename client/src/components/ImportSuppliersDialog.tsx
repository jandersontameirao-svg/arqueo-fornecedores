import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

// Aceita cabeçalhos em PT ou EN. Chave = campo do sistema; valores = aliases aceitos.
const HEADER_ALIASES: Record<string, string[]> = {
  companyName: ["companyname", "razao social", "razão social", "razaosocial", "nome", "empresa"],
  cnpj: ["cnpj"],
  email: ["email", "e-mail"],
  tradeName: ["tradename", "nome fantasia", "fantasia"],
  phone: ["phone", "telefone", "fone"],
  website: ["website", "site", "web"],
  city: ["city", "cidade"],
  state: ["state", "estado", "uf"],
  criticality: ["criticality", "criticidade"],
  notes: ["notes", "observacoes", "observações", "obs"],
};
const CRIT_MAP: Record<string, string> = {
  baixa: "low", baixo: "low", low: "low",
  media: "medium", média: "medium", medio: "medium", médio: "medium", medium: "medium",
  alta: "high", alto: "high", high: "high",
  critica: "critical", crítica: "critical", critico: "critical", crítico: "critical", critical: "critical",
};

// Parser CSV simples: detecta ; ou , como separador, respeita aspas.
function parseCSV(text: string): string[][] {
  const clean = text.replace(/^﻿/, ""); // remove BOM
  const firstLine = clean.split(/\r?\n/)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* ignore */ }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function mapHeaders(headers: string[]): (string | null)[] {
  return headers.map((h) => {
    const norm = h.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(norm)) return field;
    }
    return null;
  });
}

export default function ImportSuppliersDialog({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const importMut = trpc.suppliers.importBatch.useMutation({
    onSuccess: (res) => {
      setResult(res);
      if (res.created > 0) toast.success(`${res.created} fornecedor(es) importado(s).`);
      if (res.failed > 0) toast.error(`${res.failed} linha(s) com erro.`);
      onDone?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (file: File) => {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const matrix = parseCSV(String(reader.result || ""));
      if (matrix.length < 2) { toast.error("CSV vazio ou sem linhas de dados."); return; }
      const fields = mapHeaders(matrix[0]);
      if (!fields.includes("companyName") || !fields.includes("cnpj") || !fields.includes("email")) {
        toast.error("O CSV precisa ter as colunas: nome/razão social, cnpj e email.");
        return;
      }
      const parsed = matrix.slice(1).map((cols) => {
        const obj: any = {};
        fields.forEach((f, idx) => { if (f) obj[f] = (cols[idx] ?? "").trim(); });
        if (obj.criticality) obj.criticality = CRIT_MAP[obj.criticality.toLowerCase()] ?? undefined;
        Object.keys(obj).forEach((k) => { if (obj[k] === "") delete obj[k]; });
        return obj;
      }).filter((o) => o.companyName && o.cnpj && o.email);
      setRows(parsed);
      if (parsed.length === 0) toast.error("Nenhuma linha válida encontrada.");
    };
    reader.readAsText(file, "utf-8");
  };

  const downloadTemplate = () => {
    const csv = "razao_social;cnpj;email;nome_fantasia;telefone;cidade;uf;criticidade;observacoes\n" +
      "Fornecedor Exemplo LTDA;12.345.678/0001-90;contato@exemplo.com.br;Exemplo;(11) 99999-9999;São Paulo;SP;alta;fornecedor de teste\n";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo_importacao_fornecedores.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setRows([]); setResult(null); setFileName(""); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-sm">
          <Upload className="h-4 w-4 mr-2" /> Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar fornecedores via CSV</DialogTitle>
          <DialogDescription>Cadastro em lote. Colunas obrigatórias: razão social, CNPJ e e-mail.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-primary">
            <Download className="h-4 w-4 mr-1" /> Baixar modelo CSV
          </Button>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-muted/40">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{fileName || "Clique para selecionar um arquivo .csv"}</span>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>

          {rows.length > 0 && !result && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 inline mr-1 text-emerald-600" />
              {rows.length} linha(s) válida(s) prontas para importar.
            </div>
          )}

          {result && (
            <div className="space-y-2 text-sm">
              <div className="flex gap-4">
                <span className="text-emerald-700 font-medium">{result.created} criados</span>
                {result.failed > 0 && <span className="text-red-700 font-medium">{result.failed} com erro</span>}
              </div>
              {result.errors?.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded border p-2 space-y-1">
                  {result.errors.map((er: any, i: number) => (
                    <p key={i} className="text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Linha {er.row} ({er.companyName}): {er.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => setOpen(false)}>Concluir</Button>
          ) : (
            <Button disabled={rows.length === 0 || importMut.isPending}
              onClick={() => importMut.mutate({ rows })}>
              {importMut.isPending ? "Importando..." : `Importar ${rows.length || ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
