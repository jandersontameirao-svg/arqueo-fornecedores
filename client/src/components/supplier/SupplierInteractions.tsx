import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  MessageSquare,
  Plus,
  Mail,
  Phone,
  Calendar,
  Users,
  MapPin,
  FileText,
  Trash2,
  Clock,
  Bell,
  ChevronRight,
} from "lucide-react";

interface SupplierInteractionsProps {
  supplierId: number;
  canEdit: boolean;
}

const typeLabels: Record<string, string> = {
  email: "Email",
  phone: "Telefone",
  meeting: "Reunião",
  visit: "Visita",
  note: "Anotação",
  other: "Outro",
};

const typeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  visit: <MapPin className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  other: <MessageSquare className="h-4 w-4" />,
};

const typeColors: Record<string, { bg: string; text: string; icon: string }> = {
  email: { bg: "bg-[oklch(0.95_0.03_250)]", text: "text-[oklch(0.40_0.10_250)]", icon: "bg-[oklch(0.50_0.10_250)]" },
  phone: { bg: "bg-[oklch(0.95_0.03_145)]", text: "text-[oklch(0.40_0.10_145)]", icon: "bg-[oklch(0.50_0.10_145)]" },
  meeting: { bg: "bg-[oklch(0.95_0.03_300)]", text: "text-[oklch(0.40_0.10_300)]", icon: "bg-[oklch(0.50_0.10_300)]" },
  visit: { bg: "bg-[oklch(0.95_0.05_45)]", text: "text-[oklch(0.45_0.12_45)]", icon: "bg-[oklch(0.55_0.12_45)]" },
  note: { bg: "bg-[oklch(0.95_0.01_250)]", text: "text-[oklch(0.40_0.05_250)]", icon: "bg-[oklch(0.50_0.05_250)]" },
  other: { bg: "bg-[oklch(0.95_0.02_350)]", text: "text-[oklch(0.40_0.08_350)]", icon: "bg-[oklch(0.50_0.08_350)]" },
};

export default function SupplierInteractions({ supplierId, canEdit }: SupplierInteractionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "note" as "email" | "phone" | "meeting" | "visit" | "note" | "other",
    subject: "",
    description: "",
    contactName: "",
    interactionDate: new Date().toISOString().split("T")[0],
    followUpDate: "",
  });

  const utils = trpc.useUtils();
  const { data: interactions, isLoading } = trpc.interactions.list.useQuery({ supplierId });

  const createMutation = trpc.interactions.create.useMutation({
    onSuccess: () => {
      toast.success("Interação registrada!");
      utils.interactions.list.invalidate({ supplierId });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.interactions.delete.useMutation({
    onSuccess: () => {
      toast.success("Interação removida");
      utils.interactions.list.invalidate({ supplierId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      type: "note",
      subject: "",
      description: "",
      contactName: "",
      interactionDate: new Date().toISOString().split("T")[0],
      followUpDate: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.subject) {
      toast.error("Informe o assunto da interação");
      return;
    }

    createMutation.mutate({
      supplierId,
      ...formData,
      followUpDate: formData.followUpDate || undefined,
    });
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const pendingFollowUps = interactions?.filter(
    (item) => item.interaction.followUpDate && new Date(item.interaction.followUpDate) >= new Date()
  ).length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[oklch(0.50_0.12_350)]" />
            Histórico de Interações
          </CardTitle>
          <CardDescription className="mt-1">
            Registre e acompanhe todas as comunicações com este fornecedor
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {pendingFollowUps > 0 && (
            <Badge variant="outline" className="bg-[oklch(0.95_0.05_45)] border-[oklch(0.85_0.08_45)] text-[oklch(0.45_0.12_45)]">
              <Bell className="h-3 w-3 mr-1" />
              {pendingFollowUps} follow-up{pendingFollowUps > 1 ? "s" : ""}
            </Badge>
          )}
          {canEdit && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[oklch(0.45_0.15_350)] hover:bg-[oklch(0.40_0.15_350)]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Interação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Interação</DialogTitle>
                  <DialogDescription>
                    Registre uma interação com este fornecedor
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <span className="flex items-center gap-2">
                              <Mail className="h-4 w-4" /> Email
                            </span>
                          </SelectItem>
                          <SelectItem value="phone">
                            <span className="flex items-center gap-2">
                              <Phone className="h-4 w-4" /> Telefone
                            </span>
                          </SelectItem>
                          <SelectItem value="meeting">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" /> Reunião
                            </span>
                          </SelectItem>
                          <SelectItem value="visit">
                            <span className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" /> Visita
                            </span>
                          </SelectItem>
                          <SelectItem value="note">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4" /> Anotação
                            </span>
                          </SelectItem>
                          <SelectItem value="other">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" /> Outro
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data *</Label>
                      <Input
                        type="date"
                        value={formData.interactionDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, interactionDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Assunto *</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Resumo da interação"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contato</Label>
                    <Input
                      value={formData.contactName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Detalhes da interação..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Data de Follow-up
                    </Label>
                    <Input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, followUpDate: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createMutation.isPending}
                    className="bg-[oklch(0.45_0.15_350)] hover:bg-[oklch(0.40_0.15_350)]"
                  >
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : interactions && interactions.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[oklch(0.45_0.15_350)] via-border to-transparent" />
              
              <div className="space-y-4">
                {interactions.map((item, index) => {
                  const colors = typeColors[item.interaction.type];
                  const isFollowUpPending = item.interaction.followUpDate && 
                    new Date(item.interaction.followUpDate) >= new Date();
                  
                  return (
                    <div key={item.interaction.id} className="relative pl-12">
                      {/* Timeline dot */}
                      <div className={`
                        absolute left-3 top-4 h-5 w-5 rounded-full flex items-center justify-center
                        ${colors.icon} text-white shadow-sm
                      `}>
                        {typeIcons[item.interaction.type]}
                      </div>
                      
                      <div className={`
                        p-4 rounded-xl border transition-all hover:shadow-md
                        ${isFollowUpPending 
                          ? "bg-gradient-to-r from-[oklch(0.98_0.02_45)] to-transparent border-[oklch(0.90_0.05_45)]" 
                          : "bg-card"
                        }
                      `}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge className={`${colors.bg} ${colors.text} border-0`}>
                                {typeLabels[item.interaction.type]}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeDate(item.interaction.interactionDate)}
                              </span>
                              {item.interaction.contactName && (
                                <span className="text-xs text-muted-foreground">
                                  • {item.interaction.contactName}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="font-medium text-foreground">{item.interaction.subject}</h4>
                            
                            {item.interaction.description && (
                              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-3">
                                {item.interaction.description}
                              </p>
                            )}
                            
                            {isFollowUpPending && (
                              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-[oklch(0.95_0.05_45)]">
                                <Bell className="h-4 w-4 text-[oklch(0.55_0.12_45)]" />
                                <span className="text-sm text-[oklch(0.45_0.12_45)]">
                                  Follow-up: {new Date(item.interaction.followUpDate!).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            )}
                            
                            {item.createdBy && (
                              <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                                Registrado por {item.createdBy.name}
                              </p>
                            )}
                          </div>
                          
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => deleteMutation.mutate({ id: item.interaction.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">Nenhuma interação registrada</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Comece a registrar as comunicações e reuniões com este fornecedor
            </p>
            {canEdit && (
              <Button 
                className="mt-4 bg-[oklch(0.45_0.15_350)] hover:bg-[oklch(0.40_0.15_350)]" 
                onClick={() => setIsOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Interação
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
