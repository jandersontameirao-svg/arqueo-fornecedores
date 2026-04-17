import { trpc } from "@/lib/trpc";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Building2,
  Calendar,
  Star,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

type EvalItem = { evaluation: { id: number; overallScore: string | null; evaluationPeriod: string; qualityScore: string | null; deliveryScore: string | null; priceScore: string | null; communicationScore: string | null }; supplier: { id: number; companyName: string } | null };

export default function Evaluations() {
  const [, setLocation] = useLocation();
  const { selectedCompany } = useSelectedCompany();
  const { data: evaluations, isLoading } = trpc.evaluations.getLatest.useQuery({
    limit: 20,
    companyId: selectedCompany?.id || undefined,
    groupId: !selectedCompany?.id && selectedCompany?.groupId ? selectedCompany.groupId : undefined,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avaliações de Desempenho</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho dos fornecedores
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations && evaluations.length > 0
                ? (
                    (evaluations as EvalItem[]).reduce((acc: number, e: EvalItem) => acc + (parseFloat(e.evaluation.overallScore || "0")), 0) /
                    evaluations.length
                  ).toFixed(1)
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acima de 80%</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(evaluations as EvalItem[] | undefined)?.filter((e: EvalItem) => parseFloat(e.evaluation.overallScore || "0") >= 80).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abaixo de 60%</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(evaluations as EvalItem[] | undefined)?.filter((e: EvalItem) => parseFloat(e.evaluation.overallScore || "0") < 60).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : evaluations && evaluations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Comunicação</TableHead>
                  <TableHead>Score Geral</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(evaluations as EvalItem[]).map((item: EvalItem) => {
                  const overallScore = parseFloat(item.evaluation.overallScore || "0");
                  return (
                    <TableRow key={item.evaluation.id}>
                      <TableCell>
                        {item.supplier ? (
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{item.supplier.companyName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {item.evaluation.evaluationPeriod}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(parseFloat(item.evaluation.qualityScore || "0"))}>
                          {item.evaluation.qualityScore || "—"}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(parseFloat(item.evaluation.deliveryScore || "0"))}>
                          {item.evaluation.deliveryScore || "—"}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(parseFloat(item.evaluation.priceScore || "0"))}>
                          {item.evaluation.priceScore || "—"}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(parseFloat(item.evaluation.communicationScore || "0"))}>
                          {item.evaluation.communicationScore || "—"}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(overallScore)}`}
                              style={{ width: `${overallScore}%` }}
                            />
                          </div>
                          <span className={`font-medium ${getScoreColor(overallScore)}`}>
                            {overallScore.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.supplier && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/suppliers/${item.supplier!.id}`)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma avaliação registrada</h3>
              <p className="text-muted-foreground text-sm mt-1">
                As avaliações de desempenho serão listadas aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
