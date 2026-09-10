import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, Copy, Trash2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { RiskScoreBadge } from "@/components/RiskScorePanel";

const STATUS: Record<string, string> = {
  draft: "Rascunho", sent: "Enviado", in_progress: "Em andamento", submitted: "Respondido", reviewed: "Revisado",
};

type Q = { id: string; text: string; type: "yes_no" | "scale_0_10" | "text"; weight: number; riskyAnswer?: "yes" | "no" };

export default function SupplierAssessmentsPanel({ supplierId }: { supplierId: number }) {
  const utils = trpc.useUtils();
  const { data: templates } = trpc.assessmentTemplates.list.useQuery({ activeOnly: true });
  const { data: list } = trpc.assessments.listBySupplier.useQuery({ supplierId });
  const [templateId, setTemplateId] = useState<string>("");

  const invalidate = () => utils.assessments.listBySupplier.invalidate({ supplierId });

  const send = trpc.assessments.create.useMutation({
    onSuccess: (a) => {
      toast.success("Questionário enviado. Copie o link para o fornecedor.");
      copyLink(a.token);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const review = trpc.assessments.review.useMutation({
    onSuccess: () => { toast.success("Marcado como revisado."); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/assessment/${token}`;
    navigator.clipboard?.writeText(url).then(() => toast.success("Link copiado!"), () => {});
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Questionários
          </CardTitle>
          <CardDescription>Envie assessments ao fornecedor via portal tokenizado</CardDescription>
        </div>
        <NewTemplateDialog onCreated={() => utils.assessmentTemplates.list.invalidate()} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enviar novo */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Selecione um questionário" /></SelectTrigger>
              <SelectContent>
                {(templates ?? []).map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                {(!templates || templates.length === 0) && <div className="p-2 text-xs text-muted-foreground">Nenhum template ativo. Crie um.</div>}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={!templateId || send.isPending}
            onClick={() => send.mutate({ supplierId, templateId: Number(templateId) })}>
            <Send className="h-4 w-4 mr-1" /> Enviar
          </Button>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {(!list || list.length === 0) && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum questionário enviado.</p>}
          {list?.map((a) => (
            <div key={a.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs rounded-full bg-muted px-2 py-0.5">{STATUS[a.status] ?? a.status}</span>
                  {a.score != null && a.riskLevel && <RiskScoreBadge score={a.score} level={a.riskLevel as any} />}
                  <span className="text-xs text-muted-foreground">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" title="Copiar link" onClick={() => copyLink(a.token)}>
                  <Copy className="h-4 w-4" />
                </Button>
                {a.status === "submitted" && (
                  <Button variant="ghost" size="icon" title="Marcar revisado" onClick={() => review.mutate({ id: a.id })}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Dialog de criação de template ----
function NewTemplateDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Q[]>([
    { id: crypto.randomUUID(), text: "", type: "yes_no", weight: 5, riskyAnswer: "no" },
  ]);

  const create = trpc.assessmentTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado.");
      setOpen(false); setName(""); setDescription("");
      setQuestions([{ id: crypto.randomUUID(), text: "", type: "yes_no", weight: 5, riskyAnswer: "no" }]);
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  const setQ = (id: string, patch: Partial<Q>) => setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, ...patch } : q));
  const addQ = () => setQuestions((qs) => [...qs, { id: crypto.randomUUID(), text: "", type: "yes_no", weight: 5, riskyAnswer: "no" }]);
  const delQ = (id: string) => setQuestions((qs) => qs.filter((q) => q.id !== id));

  const valid = name.trim() && questions.length > 0 && questions.every((q) => q.text.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Novo template</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo template de questionário</DialogTitle>
          <DialogDescription>Cada pergunta tem um peso (0–10) usado no cálculo do risco inerente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Due diligence de segurança da informação" />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-3">
            <Label>Perguntas</Label>
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground pt-2">{i + 1}.</span>
                  <Input className="flex-1" value={q.text} onChange={(e) => setQ(q.id, { text: e.target.value })} placeholder="Texto da pergunta" />
                  <Button variant="ghost" size="icon" onClick={() => delQ(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-3 gap-2 pl-6">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={q.type} onValueChange={(v) => setQ(q.id, { type: v as Q["type"] })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes_no">Sim/Não</SelectItem>
                        <SelectItem value="scale_0_10">Escala 0–10</SelectItem>
                        <SelectItem value="text">Texto livre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Peso (0–10)</Label>
                    <Input type="number" min={0} max={10} className="h-8" value={q.weight}
                      onChange={(e) => setQ(q.id, { weight: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })} />
                  </div>
                  {q.type === "yes_no" && (
                    <div>
                      <Label className="text-xs">Resposta de risco</Label>
                      <Select value={q.riskyAnswer ?? "no"} onValueChange={(v) => setQ(q.id, { riskyAnswer: v as "yes" | "no" })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="no">Não</SelectItem><SelectItem value="yes">Sim</SelectItem></SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addQ}><Plus className="h-4 w-4 mr-1" /> Adicionar pergunta</Button>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!valid || create.isPending}
            onClick={() => create.mutate({ name, description, questions })}>
            {create.isPending ? "Salvando..." : "Criar template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
