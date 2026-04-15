import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PenLine,
  LayoutTemplate,
  Copy,
  Sparkles,
  FileUp,
} from "lucide-react";

export type ContractCreationMode = "manual" | "template" | "duplicate" | "ai" | "pdf";

interface ContractCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: ContractCreationMode) => void;
}

const modes = [
  {
    id: "manual" as ContractCreationMode,
    icon: PenLine,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    title: "Do Zero",
    description: "Crie uma proposta em branco e preencha manualmente",
  },
  {
    id: "template" as ContractCreationMode,
    icon: LayoutTemplate,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    title: "A partir de Template",
    description: "Crie a proposta e carregue um template de cronograma automaticamente",
  },
  {
    id: "duplicate" as ContractCreationMode,
    icon: Copy,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
    title: "Duplicar Proposta Existente",
    description: "Copie o conteúdo de uma proposta anterior como ponto de partida",
  },
  {
    id: "ai" as ContractCreationMode,
    icon: Sparkles,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    title: "Gerar com IA",
    description: "Entre com o escopo (texto, PDF ou foto) e a IA gera a proposta completa",
  },
  {
    id: "pdf" as ContractCreationMode,
    icon: FileUp,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    title: "Importar PDF",
    description: "Faça upload de um contrato em PDF e a IA extrai os dados automaticamente",
  },
];

export function ContractCreationModal({ open, onOpenChange, onSelect }: ContractCreationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Novo Contrato</DialogTitle>
          <p className="text-sm text-muted-foreground">Escolha como deseja criar o contrato</p>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  onSelect(mode.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl border border-border",
                  "hover:border-primary/50 hover:bg-accent/40 transition-all duration-150",
                  "text-left group cursor-pointer"
                )}
              >
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", mode.iconBg)}>
                  <Icon className={cn("h-5 w-5", mode.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {mode.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
