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
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const SEV: Record<string, { label: string; cls: string }> = {
  low: { label: "Baixo", cls: "bg-emerald-500" },
  medium: { label: "Médio", cls: "bg-amber-500" },
  high: { label: "Alto", cls: "bg-orange-500" },
  critical: { label: "Crítico", cls: "bg-red-500" },
};
const STATUS: Record<string, string> = {
  open: "Aberto", in_treatment: "Em tratamento", mitigated: "Mitigado", accepted: "Aceito", closed: "Encerrado",
};
const CATEGORY: Record<string, string> = {
  operational: "Operacional", financial: "Financeiro", compliance: "Compliance", security: "Segurança",
  reputational: "Reputacional", strategic: "Estratégico", other: "Outro",
};

export default function SupplierRisksPanel({ supplierId }: { supplierId: number }) {
  const utils = trpc.useUtils();
  const { data: risks } = trpc.risks.list.useQuery({ supplierId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "operational", likelihood: "medium", impact: "medium", treatmentPlan: "",
  });

  const invalidate = () => {
    utils.risks.list.invalidate({ supplierId });
    utils.risk.latest.invalidate({ supplierId });
    utils.risk.preview.invalidate({ supplierId });
  };

  const create = trpc.risks.create.useMutation({
    onSuccess: () => {
      toast.success("Risco registrado.");
      setOpen(false);
      setForm({ title: "", description: "", category: "operational", likelihood: "medium", impact: "medium", treatmentPlan: "" });
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.risks.update.useMutation({ onSuccess: invalidate, onError: (e) => toast.error(e.message) });
  const remove = trpc.risks.delete.useMutation({
    onSuccess: () => { toast.success("Risco removido."); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Registro de Riscos
          </CardTitle>
          <CardDescription>Riscos e issues do fornecedor, com plano de tratamento</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo risco</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo risco</DialogTitle>
              <DialogDescription>A severidade é calculada por probabilidade × impacto.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Dependência de fornecedor único" />
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Probabilidade</Label>
                  <Select value={form.likelihood} onValueChange={(v) => setForm({ ...form, likelihood: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Impacto</Label>
                  <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="low">Baixo</SelectItem><SelectItem value="medium">Médio</SelectItem><SelectItem value="high">Alto</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Plano de tratamento</Label>
                <Textarea value={form.treatmentPlan} onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!form.title.trim() || create.isPending}
                onClick={() => create.mutate({ supplierId, ...form } as any)}
              >
                {create.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {(!risks || risks.length === 0) && (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum risco registrado.</p>
        )}
        {risks?.map((r) => (
          <div key={r.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white ${SEV[r.severity].cls}`}>{SEV[r.severity].label}</span>
                  <span className="text-xs text-muted-foreground">{CATEGORY[r.category]}</span>
                  <span className="font-medium truncate">{r.title}</span>
                </div>
                {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                {r.treatmentPlan && <p className="text-xs mt-1"><span className="font-medium">Tratamento:</span> {r.treatmentPlan}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: r.id })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Status:</Label>
              <Select value={r.status} onValueChange={(v) => update.mutate({ id: r.id, status: v as any })}>
                <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
