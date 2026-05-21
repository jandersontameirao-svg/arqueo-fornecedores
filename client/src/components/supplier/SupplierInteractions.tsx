import { useState, useRef } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Paperclip,
  Upload,
  X,
  Sparkles,
  Loader2,
  ExternalLink,
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

const ACCEPTED_TYPES = ".pdf,.txt,.md,.jpg,.jpeg,.png,.docx,.doc";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function SupplierInteractions({ supplierId, canEdit }: SupplierInteractionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [uploadingAttachmentFor, setUploadingAttachmentFor] = useState<number | null>(null);
  const [aiContentVisible, setAiContentVisible] = useState<Record<number, boolean>>({});
  const attachmentInputRef = useRef<HTMLInputElement>(null);
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
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Download seguro: gera URL assinada fresca via R2 usando attachmentKey permanente
  const getSignedUrlMutation = trpc.storage.getSignedUrl.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: () => {
      toast.error("Não foi possível gerar o link de download. Tente novamente.");
    },
  });

  const handleAttachmentDownload = (attachmentKey: string | null | undefined, attachmentUrl: string | null | undefined) => {
    if (attachmentKey) {
      getSignedUrlMutation.mutate({ fileKey: attachmentKey });
    } else if (attachmentUrl) {
      // Fallback para registros legados sem attachmentKey
      window.open(attachmentUrl, "_blank");
    } else {
      toast.error("Arquivo não disponível.");
    }
  };

  const uploadAttachmentMutation = trpc.interactions.uploadAttachment.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.aiExtractedContent
          ? "Anexo enviado e analisado pela IA!"
          : "Anexo enviado com sucesso!"
      );
      utils.interactions.list.invalidate({ supplierId });
      setUploadingAttachmentFor(null);
    },
    onError: (error) => {
      toast.error("Erro ao enviar anexo: " + error.message);
      setUploadingAttachmentFor(null);
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

  const handleAttachmentUpload = async (interactionId: number, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo excede o limite de 10MB");
      return;
    }
    setUploadingAttachmentFor(interactionId);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAttachmentMutation.mutate({
        interactionId,
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
      setUploadingAttachmentFor(null);
    };
    reader.readAsDataURL(file);
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
                            <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
                          </SelectItem>
                          <SelectItem value="phone">
                            <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> Telefone</span>
                          </SelectItem>
                          <SelectItem value="meeting">
                            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Reunião</span>
                          </SelectItem>
                          <SelectItem value="visit">
                            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Visita</span>
                          </SelectItem>
                          <SelectItem value="note">
                            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Anotação</span>
                          </SelectItem>
                          <SelectItem value="other">
                            <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Outro</span>
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
                {interactions.map((item) => {
                  const colors = typeColors[item.interaction.type];
                  const isFollowUpPending = item.interaction.followUpDate &&
                    new Date(item.interaction.followUpDate) >= new Date();
                  const isUploading = uploadingAttachmentFor === item.interaction.id;
                  const hasAiContent = !!item.interaction.aiExtractedContent;
                  const showAi = aiContentVisible[item.interaction.id];

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

                            {/* Anexo */}
                            {(item.interaction.attachmentUrl || item.interaction.attachmentKey) && (
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAttachmentDownload(item.interaction.attachmentKey, item.interaction.attachmentUrl)}
                                  disabled={getSignedUrlMutation.isPending}
                                  className="flex items-center gap-2 text-xs text-[oklch(0.45_0.12_250)] hover:underline bg-[oklch(0.95_0.02_250)] px-2 py-1 rounded-md disabled:opacity-50"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {item.interaction.attachmentName || "Anexo"}
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                                {hasAiContent && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-[oklch(0.45_0.15_300)] hover:text-[oklch(0.35_0.15_300)]"
                                    onClick={() => setAiContentVisible((prev) => ({ ...prev, [item.interaction.id]: !prev[item.interaction.id] }))}
                                  >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {showAi ? "Ocultar análise IA" : "Ver análise IA"}
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Conteúdo extraído por IA */}
                            {hasAiContent && showAi && (
                              <div className="mt-3 p-3 rounded-lg bg-[oklch(0.97_0.02_300)] border border-[oklch(0.90_0.05_300)]">
                                <p className="text-xs font-medium text-[oklch(0.45_0.12_300)] flex items-center gap-1 mb-2">
                                  <Sparkles className="h-3 w-3" />
                                  Análise do Documento por IA
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {item.interaction.aiExtractedContent}
                                </p>
                              </div>
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
                            <div className="flex flex-col items-end gap-1">
                              {/* Botão de anexar */}
                              {!item.interaction.attachmentUrl && (
                                <>
                                  <input
                                    type="file"
                                    accept={ACCEPTED_TYPES}
                                    className="hidden"
                                    id={`attach-${item.interaction.id}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleAttachmentUpload(item.interaction.id, file);
                                      e.target.value = "";
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-[oklch(0.45_0.12_250)]"
                                    title="Anexar documento"
                                    disabled={isUploading}
                                    onClick={() => document.getElementById(`attach-${item.interaction.id}`)?.click()}
                                  >
                                    {isUploading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Paperclip className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteConfirmId(item.interaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Interação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta interação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId !== null && deleteMutation.mutate({ id: deleteConfirmId })}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
