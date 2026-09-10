import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Aberto", cls: "bg-muted text-foreground" },
  in_progress: { label: "Em andamento", cls: "bg-amber-500 text-white" },
  completed: { label: "Concluído", cls: "bg-emerald-500 text-white" },
  cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
};

export default function SupplierOffboardingPanel({ supplierId }: { supplierId: number }) {
  const utils = trpc.useUtils();
  const { data: checklist } = trpc.offboarding.get.useQuery({ supplierId });
  const [reason, setReason] = useState("");

  const invalidate = () => utils.offboarding.get.invalidate({ supplierId });

  const start = trpc.offboarding.start.useMutation({
    onSuccess: () => { toast.success("Offboarding iniciado."); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateItems = trpc.offboarding.updateItems.useMutation({ onSuccess: invalidate, onError: (e) => toast.error(e.message) });
  const setStatus = trpc.offboarding.setStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado."); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (!checklist || checklist.status === "cancelled") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><LogOut className="h-4 w-4 text-muted-foreground" /> Offboarding</CardTitle>
          <CardDescription>Encerramento estruturado do relacionamento com o fornecedor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist?.status === "cancelled" && (
            <p className="text-sm text-muted-foreground">O offboarding anterior foi cancelado. Você pode iniciar um novo.</p>
          )}
          <div className="space-y-1">
            <Label className="text-sm">Motivo do encerramento (opcional)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ex.: fim de contrato, desempenho, reestruturação..." />
          </div>
          <Button disabled={start.isPending} onClick={() => start.mutate({ supplierId, reason: reason || undefined })}>
            <LogOut className="h-4 w-4 mr-1" /> Iniciar offboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = (checklist.items as any[]) ?? [];
  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const st = STATUS[checklist.status];
  const readonly = checklist.status === "completed";

  const toggle = (idx: number, done: boolean) => {
    const next = items.map((it, i) => i === idx ? { ...it, done } : it);
    updateItems.mutate({ id: checklist.id, items: next as any });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><LogOut className="h-4 w-4" /> Offboarding</CardTitle>
          <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${st.cls}`}>{st.label}</span>
        </div>
        <CardDescription>{doneCount} de {items.length} etapas concluídas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={pct} className="h-2" />
        {checklist.reason && <p className="text-sm"><span className="font-medium">Motivo:</span> {checklist.reason}</p>}
        <div className="space-y-2">
          {items.map((it, idx) => (
            <label key={it.id} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
              <Checkbox checked={it.done} disabled={readonly} onCheckedChange={(v) => toggle(idx, !!v)} className="mt-0.5" />
              <div className="min-w-0">
                <span className={`text-sm ${it.done ? "line-through text-muted-foreground" : ""}`}>{it.label}</span>
                {it.doneAt && <span className="block text-xs text-muted-foreground">Concluído em {new Date(it.doneAt).toLocaleDateString("pt-BR")}</span>}
              </div>
            </label>
          ))}
        </div>

        {!readonly && (
          <div className="flex gap-2 pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" disabled={doneCount < items.length}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir offboarding
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Concluir offboarding?</AlertDialogTitle>
                  <AlertDialogDescription>Confirme que todas as etapas de encerramento foram realizadas.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setStatus.mutate({ id: checklist.id, status: "completed" })}>Concluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={() => setStatus.mutate({ id: checklist.id, status: "cancelled" })}>
              <XCircle className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
