import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

type RiskLevel = "low" | "medium" | "high" | "critical";

const LEVEL_META: Record<RiskLevel, { label: string; color: string; bg: string; ring: string }> = {
  low: { label: "Baixo", color: "text-emerald-700", bg: "bg-emerald-500", ring: "ring-emerald-200" },
  medium: { label: "Médio", color: "text-amber-700", bg: "bg-amber-500", ring: "ring-amber-200" },
  high: { label: "Alto", color: "text-orange-700", bg: "bg-orange-500", ring: "ring-orange-200" },
  critical: { label: "Crítico", color: "text-red-700", bg: "bg-red-500", ring: "ring-red-200" },
};

/** Badge compacto de score de risco — reutilizável em listas e cabeçalhos. */
export function RiskScoreBadge({ score, level }: { score: number; level: RiskLevel }) {
  const m = LEVEL_META[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${m.bg}`}>
      <ShieldAlert className="h-3 w-3" />
      {score} · {m.label}
    </span>
  );
}

export default function RiskScorePanel({ supplierId }: { supplierId: number }) {
  const utils = trpc.useUtils();
  const { data: latest } = trpc.risk.latest.useQuery({ supplierId });
  const { data: preview } = trpc.risk.preview.useQuery({ supplierId });
  const { data: history } = trpc.risk.history.useQuery({ supplierId, limit: 12 });

  const compute = trpc.risk.compute.useMutation({
    onSuccess: () => {
      toast.success("Score de risco recalculado.");
      utils.risk.latest.invalidate({ supplierId });
      utils.risk.history.invalidate({ supplierId });
      utils.risk.preview.invalidate({ supplierId });
    },
    onError: (e) => toast.error(e.message || "Erro ao recalcular."),
  });

  // Usa o último salvo; se não houver, mostra a prévia calculada
  const current = latest ?? (preview ? { score: preview.total, level: preview.level, breakdown: preview, computedAt: null } : null);
  const level = (current?.level ?? "low") as RiskLevel;
  const m = LEVEL_META[level];
  const score = current?.score ?? 0;
  const pct = Math.min(100, Math.round((score / 1000) * 100));
  const factors = (current?.breakdown as any)?.factors ?? preview?.factors ?? [];

  // Tendência: compara os dois últimos scores do histórico
  let trend: "up" | "down" | "flat" = "flat";
  if (history && history.length >= 2) {
    const diff = history[0].score - history[1].score;
    trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Medidor principal */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className={`h-4 w-4 ${m.color}`} />
            Score de Risco
          </CardTitle>
          <CardDescription>Modelo ponderado 0–1000 (maior = mais arriscado)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <span className={`text-5xl font-bold ${m.color}`}>{score}</span>
            <span className="text-muted-foreground text-sm mb-1.5">/ 1000</span>
            {trend !== "flat" && (
              trend === "up"
                ? <TrendingUp className="h-5 w-5 text-red-500 mb-2" />
                : <TrendingDown className="h-5 w-5 text-emerald-500 mb-2" />
            )}
            {trend === "flat" && <Minus className="h-5 w-5 text-muted-foreground mb-2" />}
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${m.bg} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <RiskScoreBadge score={score} level={level} />
            {current?.computedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(current.computedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={compute.isPending}
            onClick={() => compute.mutate({ supplierId })}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${compute.isPending ? "animate-spin" : ""}`} />
            {compute.isPending ? "Recalculando..." : "Recalcular score"}
          </Button>
          {!latest && (
            <p className="text-xs text-muted-foreground text-center">
              Prévia calculada em tempo real — clique em recalcular para salvar no histórico.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Composição do score */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Composição do risco</CardTitle>
          <CardDescription>Como cada fator contribui para o score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {factors.length === 0 && <p className="text-sm text-muted-foreground">Sem dados para calcular.</p>}
          {factors.map((f: any) => (
            <div key={f.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="tabular-nums text-muted-foreground">+{f.points}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${Math.min(100, (f.points / 300) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{f.detail}</p>
            </div>
          ))}

          {history && history.length > 0 && (
            <div className="pt-2 border-t mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Histórico</p>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <span key={h.id} className={`text-xs rounded px-2 py-1 ${LEVEL_META[h.level as RiskLevel].bg} text-white`}>
                    {h.score}
                    <span className="opacity-80 ml-1">
                      {h.computedAt ? new Date(h.computedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
