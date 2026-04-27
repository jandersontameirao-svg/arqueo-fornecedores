import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import {
  Users,
  Tag,
  FileText,
  BarChart2,
  Shield,
  UserCog,
  ArrowRight,
  Building2,
} from "lucide-react";

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  path: string;
  countKey?: "suppliers" | "categories" | "templates" | "users" | "audit";
  countLabel?: string;
}

const MODULES: ModuleCard[] = [
  {
    id: "suppliers",
    title: "Fornecedores",
    description: "Cadastro e gestão centralizada de todos os fornecedores da unidade",
    icon: Users,
    color: "#b45309",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    path: "/suppliers",
    countKey: "suppliers",
    countLabel: "fornecedores",
  },
  {
    id: "categories",
    title: "Categorias",
    description: "Organize fornecedores por tipo de serviço ou produto",
    icon: Tag,
    color: "#6d28d9",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    path: "/categories",
    countKey: "categories",
    countLabel: "categorias",
  },
  {
    id: "templates",
    title: "Templates",
    description: "Modelos de contrato para agilizar a formalização",
    icon: FileText,
    color: "#0369a1",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    path: "/contract-templates",
    countKey: "templates",
    countLabel: "templates",
  },
  {
    id: "reports",
    title: "Relatórios",
    description: "Análises, exportações e indicadores de fornecedores",
    icon: BarChart2,
    color: "#047857",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    path: "/reports",
  },
  {
    id: "audit",
    title: "Auditoria",
    description: "Histórico de alterações e rastreabilidade de ações",
    icon: Shield,
    color: "#b91c1c",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    path: "/audit",
    countKey: "audit",
    countLabel: "registros",
  },
  {
    id: "users",
    title: "Usuários",
    description: "Gerenciamento de acessos e permissões do sistema",
    icon: UserCog,
    color: "#1d4ed8",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    path: "/users",
    countKey: "users",
    countLabel: "usuários",
  },
];

export default function UnitSuppliers() {
  const [, setLocation] = useLocation();
  const { activeUnit } = useBusinessUnitContext();

  const { data: stats, isLoading: statsLoading } = trpc.supplierCompanyLinks.unitStats.useQuery(
    { businessUnitId: activeUnit?.id ?? 0 },
    { enabled: !!activeUnit?.id }
  );

  const getCount = (key?: "suppliers" | "categories" | "templates" | "users" | "audit") => {
    if (!key || !stats) return null;
    return stats[key];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Building2 size={14} />
            <span>{activeUnit?.name ?? "Unidade de Negócio"}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-foreground">Central de </span>
            <span className="text-amber-600">Fornecedores</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecione uma área para gerenciar
          </p>
        </div>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028979380/DW8xBeDMWJhhN24cgAUDzG/arqueo-10anos-logo_cb7a67b6.webp"
          alt="Grupo Arqueo"
          className="h-14 w-auto hidden sm:block"
        />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const count = getCount(mod.countKey);

          return (
            <button
              key={mod.id}
              onClick={() => setLocation(mod.path)}
              className={`group text-left rounded-2xl border ${mod.borderColor} ${mod.bgColor} p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${mod.color}18` }}
                >
                  <Icon size={22} style={{ color: mod.color }} />
                </div>
                <ArrowRight
                  size={18}
                  className="text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-200 mt-1"
                />
              </div>

              <h2 className="text-base font-semibold text-foreground mb-1">{mod.title}</h2>
              <p className="text-sm text-muted-foreground leading-snug mb-4">{mod.description}</p>

              {mod.countKey && (
                <div className="mt-auto">
                  {statsLoading ? (
                    <div className="h-5 w-20 rounded bg-muted/60 animate-pulse" />
                  ) : count !== null ? (
                    <span
                      className="text-sm font-semibold"
                      style={{ color: mod.color }}
                    >
                      {count} {mod.countLabel}
                    </span>
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
