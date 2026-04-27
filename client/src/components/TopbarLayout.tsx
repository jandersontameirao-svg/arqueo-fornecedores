import { useAuth } from "@/_core/hooks/useAuth";
import { useBusinessUnitContext } from "@/contexts/BusinessUnitContext";
import { useSelectedCompany } from "@/contexts/SelectedCompanyContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  LogOut,
  Users,
  Building2,
  FolderOpen,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  Shield,
  ClipboardList,
  FileSpreadsheet,
  ChevronRight,
  LayoutTemplate,
  Home,
  Link2,
  Search,
  Menu,
  X,
  FileText,
  Briefcase,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, Link } from "wouter";

// ==================== TYPES ====================

interface NavItem {
  icon: any;
  label: string;
  path: string;
  adminOnly?: boolean;
  requiresUnit?: boolean;
}

// ==================== NAV STRUCTURE ====================

const primaryNav: NavItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", requiresUnit: true },
  { icon: Building2, label: "Fornecedores", path: "/suppliers", requiresUnit: true },
  { icon: FolderOpen, label: "Categorias", path: "/categories", requiresUnit: true },
  { icon: LayoutTemplate, label: "Templates", path: "/contract-templates", requiresUnit: true },
  { icon: FileSpreadsheet, label: "Relatórios", path: "/reports" },
  { icon: ClipboardList, label: "Auditoria", path: "/audit", adminOnly: true },
  { icon: Users, label: "Usuários", path: "/users", adminOnly: true },
];

const supplierSubNav: NavItem[] = [
  { icon: Building2, label: "Todos", path: "/suppliers" },
  { icon: Link2, label: "Vincular", path: "/suppliers/link" },
  { icon: CheckSquare, label: "Aprovações", path: "/approvals" },
  { icon: AlertTriangle, label: "Conformidade", path: "/compliance" },
  { icon: BarChart3, label: "Avaliações", path: "/evaluations" },
];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gestor",
  reader: "Leitura",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  reader: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// ==================== BREADCRUMBS ====================

function Breadcrumbs() {
  const [location] = useLocation();
  const { activeUnit } = useBusinessUnitContext();
  const { selectedCompany } = useSelectedCompany();

  const crumbs = useMemo(() => {
    const parts: { label: string; path?: string }[] = [];

    if (activeUnit) {
      parts.push({ label: activeUnit.name, path: "/" });
    }
    // Em rotas de contexto de unidade, não exibir empresa ativa no breadcrumb
    if (selectedCompany && location !== "/unit-suppliers") {
      parts.push({ label: selectedCompany.name, path: "/select-company" });
    }

    const pathMap: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/suppliers": "Fornecedores",
      "/suppliers/new": "Novo Fornecedor",
      "/suppliers/link": "Vincular",
      "/categories": "Categorias",
      "/approvals": "Aprovações",
      "/compliance": "Conformidade",
      "/evaluations": "Avaliações",
      "/audit": "Auditoria",
      "/users": "Usuários",
      "/reports": "Relatórios",
      "/contract-templates": "Templates",
      "/select-company": "Selecionar Empresa",
      "/unit-suppliers": "Fornecedores da Unidade",
    };

    if (location !== "/") {
      // Check for supplier detail page
      const supplierMatch = location.match(/^\/suppliers\/(\d+)/);
      if (supplierMatch) {
        parts.push({ label: "Fornecedores", path: "/suppliers" });
        if (location.endsWith("/edit")) {
          parts.push({ label: `#${supplierMatch[1]}`, path: `/suppliers/${supplierMatch[1]}` });
          parts.push({ label: "Editar" });
        } else {
          parts.push({ label: `#${supplierMatch[1]}` });
        }
      } else if (pathMap[location]) {
        // If it's a supplier sub-page, add Fornecedores parent
        if (["/approvals", "/compliance", "/evaluations", "/suppliers/link"].includes(location)) {
          parts.push({ label: "Fornecedores", path: "/suppliers" });
        }
        parts.push({ label: pathMap[location] });
      }
    }

    return parts;
  }, [location, activeUnit, selectedCompany]);

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground px-6 py-2 border-b border-border/40 bg-muted/30">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {crumb.path ? (
            <Link href={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ==================== GLOBAL SEARCH ====================

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = trpc.globalSearch.search.useQuery(
    { query, limit: 8 },
    { enabled: query.length >= 2 }
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalResults = results
    ? results.suppliers.length + results.documents.length + results.contracts.length + results.companies.length
    : 0;

  const handleSelect = (type: string, id: number) => {
    setIsOpen(false);
    setQuery("");
    if (type === "supplier") setLocation(`/suppliers/${id}`);
    else if (type === "contract") setLocation(`/suppliers/${id}`);
    else if (type === "document") setLocation(`/documents`);
    else if (type === "company") setLocation(`/select-company`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Buscar fornecedores, documentos, contratos... (Ctrl+K)"
          className="pl-9 pr-12 h-9 bg-muted/50 border-border/50 focus:bg-background"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhum resultado para "{query}"</div>
          ) : (
            <div className="py-1">
              {results!.suppliers.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fornecedores</div>
                  {results!.suppliers.map((s) => (
                    <button
                      key={`s-${s.id}`}
                      onClick={() => handleSelect("supplier", s.id)}
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.companyName}</p>
                        {s.cnpj && <p className="text-xs text-muted-foreground">{s.cnpj}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results!.contracts.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-t">Contratos</div>
                  {results!.contracts.map((c) => (
                    <button
                      key={`c-${c.id}`}
                      onClick={() => handleSelect("contract", c.supplierId)}
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.title}</p>
                        {c.number && <p className="text-xs text-muted-foreground">{c.number}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results!.documents.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-t">Documentos</div>
                  {results!.documents.map((d) => (
                    <button
                      key={`d-${d.id}`}
                      onClick={() => handleSelect("document", d.id)}
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium truncate text-sm">{d.name}</p>
                    </button>
                  ))}
                </div>
              )}
              {results!.companies.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-t">Empresas</div>
                  {results!.companies.map((c) => (
                    <button
                      key={`co-${c.id}`}
                      onClick={() => handleSelect("company", c.id)}
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                    >
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium truncate text-sm">{c.legalName}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== HORIZONTAL NAV ====================

function HorizontalNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { activeUnitId } = useBusinessUnitContext();
  const hasActiveUnit = !!activeUnitId;

  // Show supplier sub-nav when on supplier-related pages
  const isSupplierSection = ["/suppliers", "/approvals", "/compliance", "/evaluations"].some(
    (p) => location === p || location.startsWith(p + "/") || location.startsWith("/suppliers/")
  );

  const filteredPrimaryNav = primaryNav.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") return false;
    if (item.requiresUnit && !hasActiveUnit) return false;
    return true;
  });

  const isPathActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/suppliers") {
      return (location === "/suppliers" || location.startsWith("/suppliers/")) && !isSupplierSection;
    }
    return location === path || location.startsWith(path + "/");
  };

  const isSupplierGroupActive = (path: string) => {
    if (path === "/suppliers") return location === "/suppliers" || location.match(/^\/suppliers\/\d/);
    return location === path;
  };

  return (
    <div className="border-b border-border/40">
      {/* Primary nav */}
      <div className="overflow-x-auto">
        <nav className="flex items-center gap-1 px-6 min-w-max">
          {filteredPrimaryNav.map((item) => {
            const Icon = item.icon;
            const active = item.path === "/suppliers"
              ? isSupplierSection
              : isPathActive(item.path);

            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Supplier sub-nav */}
      {isSupplierSection && (
        <div className="bg-muted/30 overflow-x-auto">
          <nav className="flex items-center gap-1 px-6 min-w-max">
            {supplierSubNav.map((item) => {
              const Icon = item.icon;
              const active = isSupplierGroupActive(item.path);

              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                      active
                        ? "border-primary/70 text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

// ==================== MOBILE MENU ====================

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { activeUnitId } = useBusinessUnitContext();

  const filteredNav = primaryNav.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") return false;
    if (item.requiresUnit && !activeUnitId) return false;
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo-arqueo.svg" alt="Grupo Arqueo" className="h-8 w-8" />
            <span className="font-semibold">Arqueo</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="p-2">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = location === item.path || location.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 border bg-primary/10">
              <AvatarFallback className="text-xs font-medium text-primary bg-primary/10">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <Badge variant="secondary" className={`text-[10px] ${roleColors[user?.role || "reader"]}`}>
                {roleLabels[user?.role || "reader"]}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== MAIN LAYOUT ====================

export default function TopbarLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { selectedCompany, clearSelectedCompany } = useSelectedCompany();
  const isMobile = useIsMobile();

  // Rotas de seleção não exibem nav horizontal nem breadcrumbs
  const isSelectionRoute = location === "/" || location === "/select-company";
  // Rotas de contexto de unidade: ocultar menu horizontal e indicador de empresa
  // Inclui a home da central e todas as páginas internas acessadas por ela
  const UNIT_ROUTES = [
    "/unit-suppliers",
    "/suppliers",
    "/categories",
    "/contract-templates",
    "/reports",
    "/audit",
    "/users",
    "/approvals",
    "/compliance",
    "/evaluations",
  ];
  const isUnitRoute =
    UNIT_ROUTES.includes(location) ||
    location.startsWith("/suppliers/") ||
    location.startsWith("/unit-suppliers/");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Gestão de Fornecedores
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Acesse a plataforma para gerenciar fornecedores, documentos e
              avaliações do Grupo Arqueo.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Entrar na Plataforma
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          {/* Left: Logo + Mobile menu */}
          <div className="flex items-center gap-3">
            <MobileMenu />
            <button
              onClick={() => {
                clearSelectedCompany();
                setLocation("/");
              }}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <img src="/logo-arqueo.svg" alt="Grupo Arqueo" className="h-8 w-8" />
              {!isMobile && (
                <span className="font-semibold text-lg tracking-tight">Arqueo Fornecedores</span>
              )}
            </button>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <GlobalSearch />
          </div>

          {/* Right: Company indicator + User */}
          <div className="flex items-center gap-3">
            {/* Company indicator: ocultar em rotas de contexto de unidade */}
            {selectedCompany && !isUnitRoute && (
              <button
                onClick={() => setLocation("/select-company")}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 hover:bg-accent transition-colors text-sm"
                title="Trocar empresa"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: selectedCompany.color }}
                />
                <span className="font-medium truncate max-w-[120px]" style={{ color: selectedCompany.color }}>
                  {selectedCompany.name}
                </span>
              </button>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-accent transition-colors p-1 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border bg-primary/10">
                    <AvatarFallback className="text-xs font-medium text-primary bg-primary/10">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {user?.name?.split(" ")[0]}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge
                    variant="secondary"
                    className={`mt-1 text-[10px] ${roleColors[user?.role || "reader"]}`}
                  >
                    {roleLabels[user?.role || "reader"]}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Horizontal navigation (desktop only) — oculta nas telas de seleção e nas páginas internas da central */}
      {!isSelectionRoute && !isUnitRoute && (
        <div className="hidden md:block">
          <HorizontalNav />
        </div>
      )}

      {/* Breadcrumbs — ocultos nas telas de seleção */}
      {!isSelectionRoute && <Breadcrumbs />}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
