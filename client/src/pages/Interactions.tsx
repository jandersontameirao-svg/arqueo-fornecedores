import { trpc } from "@/lib/trpc";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Building2,
  Calendar,
  Phone,
  Mail,
  Video,
  MapPin,
  FileText,
  ArrowRight,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  email: "Email",
  phone: "Telefone",
  meeting: "Reunião",
  visit: "Visita",
  note: "Nota",
  other: "Outro",
};

const typeColors: Record<string, string> = {
  email: "bg-blue-100 text-blue-800",
  phone: "bg-green-100 text-green-800",
  meeting: "bg-purple-100 text-purple-800",
  visit: "bg-orange-100 text-orange-800",
  note: "bg-gray-100 text-gray-800",
  other: "bg-gray-100 text-gray-800",
};

const typeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  meeting: <Video className="h-4 w-4" />,
  visit: <MapPin className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  other: <MessageSquare className="h-4 w-4" />,
};

type InteractionItem = { interaction: { id: number; type: string; subject: string; description?: string | null; contactName?: string | null; interactionDate: Date; followUpDate?: Date | null }; supplier: { id: number; companyName: string } | null; createdBy: { name: string } | null };

export default function Interactions() {
  const [, setLocation] = useLocation();
  const { selectedCompany } = useSelectedCompany();
  const { data: interactions, isLoading } = trpc.interactions.listRecent.useQuery({ limit: 50, companyId: selectedCompany?.id });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interações</h1>
        <p className="text-muted-foreground">
          Histórico de comunicações com fornecedores
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interactions?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(interactions as InteractionItem[] | undefined)?.filter((i: InteractionItem) => i.interaction.type === "email").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reuniões</CardTitle>
            <Video className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(interactions as InteractionItem[] | undefined)?.filter((i: InteractionItem) => i.interaction.type === "meeting").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <MapPin className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(interactions as InteractionItem[] | undefined)?.filter((i: InteractionItem) => i.interaction.type === "visit").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : interactions && interactions.length > 0 ? (
            <div className="space-y-4">
              {(interactions as InteractionItem[]).map((item: InteractionItem) => (
                <div
                  key={item.interaction.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeColors[item.interaction.type]}`}>
                    {typeIcons[item.interaction.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.interaction.subject}</h4>
                      <Badge className={typeColors[item.interaction.type]}>
                        {typeLabels[item.interaction.type]}
                      </Badge>
                    </div>
                    {item.interaction.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.interaction.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {item.supplier && (
                        <button
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          onClick={() => setLocation(`/suppliers/${item.supplier!.id}`)}
                        >
                          <Building2 className="h-3 w-3" />
                          {item.supplier.companyName}
                        </button>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.interaction.interactionDate).toLocaleDateString("pt-BR")}
                      </span>
                      {item.interaction.contactName && (
                        <span>Contato: {item.interaction.contactName}</span>
                      )}
                    </div>
                  </div>
                  {item.supplier && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/suppliers/${item.supplier!.id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma interação registrada</h3>
              <p className="text-muted-foreground text-sm mt-1">
                As interações com fornecedores serão listadas aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
