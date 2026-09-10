import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AssessmentPortal() {
  const params = useParams();
  const token = (params as any).token as string;
  const { data, isLoading, isError, refetch } = trpc.assessments.portalGet.useQuery({ token }, { retry: false });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const submit = trpc.assessments.portalSubmit.useMutation({
    onSuccess: () => { toast.success("Respostas enviadas. Obrigado!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md"><CardContent className="pt-6 text-center text-muted-foreground">
          Questionário não encontrado ou link inválido.
        </CardContent></Card>
      </div>
    );
  }

  const done = data.submitted;
  const questions = data.questions ?? [];
  const current = { ...(data.answers ?? {}), ...answers };

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <ClipboardList className="h-10 w-10 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">{data.templateName}</h1>
          {data.description && <p className="text-muted-foreground mt-1">{data.description}</p>}
        </div>

        {done ? (
          <Card><CardContent className="pt-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
            <p className="font-medium">Questionário respondido com sucesso.</p>
            <p className="text-sm text-muted-foreground">Você já pode fechar esta página.</p>
          </CardContent></Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responda às perguntas abaixo</CardTitle>
              <CardDescription>Suas respostas serão avaliadas pela equipe de gestão de fornecedores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {questions.map((q: any, i: number) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-sm">{i + 1}. {q.text}</Label>
                  {q.type === "yes_no" && (
                    <div className="flex gap-2">
                      {["yes", "no"].map((opt) => (
                        <Button key={opt} type="button" size="sm"
                          variant={current[q.id] === opt ? "default" : "outline"}
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })}>
                          {opt === "yes" ? "Sim" : "Não"}
                        </Button>
                      ))}
                    </div>
                  )}
                  {q.type === "scale_0_10" && (
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 11 }, (_, n) => (
                        <Button key={n} type="button" size="sm" className="w-9"
                          variant={String(current[q.id]) === String(n) ? "default" : "outline"}
                          onClick={() => setAnswers({ ...answers, [q.id]: n })}>
                          {n}
                        </Button>
                      ))}
                    </div>
                  )}
                  {q.type === "text" && (
                    <Input value={current[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                  )}
                </div>
              ))}
              <Button className="w-full" disabled={submit.isPending}
                onClick={() => submit.mutate({ token, answers: current })}>
                {submit.isPending ? "Enviando..." : "Enviar respostas"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
