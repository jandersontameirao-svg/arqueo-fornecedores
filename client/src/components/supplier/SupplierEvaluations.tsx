import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BarChart3, Plus, Calendar, Star, TrendingUp, TrendingDown } from "lucide-react";

interface SupplierEvaluationsProps {
  supplierId: number;
  canEdit: boolean;
}

const kpiLabels: Record<string, string> = {
  qualityScore: "Qualidade",
  deliveryScore: "Entrega",
  priceScore: "Preço",
  communicationScore: "Comunicação",
  complianceScore: "Conformidade",
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

export default function SupplierEvaluations({ supplierId, canEdit }: SupplierEvaluationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    evaluationPeriod: "",
    qualityScore: 70,
    deliveryScore: 70,
    priceScore: 70,
    communicationScore: 70,
    complianceScore: 70,
    strengths: "",
    improvements: "",
    comments: "",
  });

  const utils = trpc.useUtils();
  const { data: evaluations, isLoading } = trpc.evaluations.list.useQuery({ supplierId });

  const createMutation = trpc.evaluations.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação registrada!");
      utils.evaluations.list.invalidate({ supplierId });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      evaluationPeriod: "",
      qualityScore: 70,
      deliveryScore: 70,
      priceScore: 70,
      communicationScore: 70,
      complianceScore: 70,
      strengths: "",
      improvements: "",
      comments: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.evaluationPeriod) {
      toast.error("Informe o período de avaliação");
      return;
    }

    createMutation.mutate({
      supplierId,
      ...formData,
    });
  };

  const calculateOverall = () => {
    const scores = [
      formData.qualityScore,
      formData.deliveryScore,
      formData.priceScore,
      formData.communicationScore,
      formData.complianceScore,
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Avaliações de Desempenho</CardTitle>
        {canEdit && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Avaliação de Desempenho</DialogTitle>
                <DialogDescription>
                  Avalie o desempenho do fornecedor em diferentes critérios
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Período de Avaliação *</Label>
                  <Input
                    value={formData.evaluationPeriod}
                    onChange={(e) => setFormData((prev) => ({ ...prev, evaluationPeriod: e.target.value }))}
                    placeholder="Ex: Q4 2024, Janeiro 2025, etc."
                  />
                </div>

                <div className="grid gap-6">
                  {Object.entries(kpiLabels).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{label}</Label>
                        <span className={`font-bold ${getScoreColor(formData[key as keyof typeof formData] as number)}`}>
                          {formData[key as keyof typeof formData]}
                        </span>
                      </div>
                      <Slider
                        value={[formData[key as keyof typeof formData] as number]}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, [key]: value[0] }))}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pontuação Geral</span>
                    <span className={`text-2xl font-bold ${getScoreColor(calculateOverall())}`}>
                      {calculateOverall()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pontos Fortes</Label>
                  <Textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData((prev) => ({ ...prev, strengths: e.target.value }))}
                    placeholder="Descreva os pontos fortes do fornecedor..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pontos de Melhoria</Label>
                  <Textarea
                    value={formData.improvements}
                    onChange={(e) => setFormData((prev) => ({ ...prev, improvements: e.target.value }))}
                    placeholder="Descreva os pontos que precisam de melhoria..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comentários Adicionais</Label>
                  <Textarea
                    value={formData.comments}
                    onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))}
                    placeholder="Observações gerais..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  Salvar Avaliação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : evaluations && evaluations.length > 0 ? (
          <div className="space-y-4">
            {evaluations.map((item) => {
              const overallScore = parseFloat(item.evaluation.overallScore || "0");
              return (
                <div
                  key={item.evaluation.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.evaluation.evaluationPeriod}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avaliado em {new Date(item.evaluation.createdAt).toLocaleDateString("pt-BR")}
                        {item.evaluatedBy && ` por ${item.evaluatedBy.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                        {overallScore.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {Object.entries(kpiLabels).map(([key, label]) => {
                      const score = parseFloat(item.evaluation[key as keyof typeof item.evaluation] as string || "0");
                      return (
                        <div key={key} className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">{label}</p>
                          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 h-full ${getProgressColor(score)}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <p className={`text-xs font-medium mt-1 ${getScoreColor(score)}`}>
                            {score.toFixed(0)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {(item.evaluation.strengths || item.evaluation.improvements) && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      {item.evaluation.strengths && (
                        <div>
                          <p className="text-xs font-medium text-green-600 flex items-center gap-1 mb-1">
                            <TrendingUp className="h-3 w-3" />
                            Pontos Fortes
                          </p>
                          <p className="text-xs text-muted-foreground">{item.evaluation.strengths}</p>
                        </div>
                      )}
                      {item.evaluation.improvements && (
                        <div>
                          <p className="text-xs font-medium text-orange-600 flex items-center gap-1 mb-1">
                            <TrendingDown className="h-3 w-3" />
                            Melhorias
                          </p>
                          <p className="text-xs text-muted-foreground">{item.evaluation.improvements}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma avaliação registrada</p>
            {canEdit && (
              <Button className="mt-3" size="sm" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar avaliação
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
