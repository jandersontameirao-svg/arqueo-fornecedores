import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Building2,
  FileText,
  FolderOpen,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Shield,
  ClipboardList,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

// Menu items structure with submenus - Nova Arquitetura v2.0
const menuStructure = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: Building2,
    label: "Gestão de Fornecedores",
    path: "/suppliers",
    subItems: [
      { icon: Building2, label: "Cadastro de Fornecedores", path: "/suppliers" },
      { icon: CheckSquare, label: "Aprovações Pendentes", path: "/approvals" },
      { icon: AlertTriangle, label: "Conformidade", path: "/compliance" },
      { icon: BarChart3, label: "Avaliações", path: "/evaluations" },
    ],
  },
  { icon: FolderOpen, label: "Categorias", path: "/categories" },
  { icon: ClipboardList, label: "Auditoria", path: "/audit", adminOnly: true },
  { icon: FileSpreadsheet, label: "Relatórios", path: "/reports" },
  { icon: Users, label: "Usuários", path: "/users", adminOnly: true },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gestor",
  reader: "Leitura",
};

const roleColors: Record<string, string> = {
  admin: "bg-[oklch(0.90_0.05_15)] text-[oklch(0.40_0.15_15)] dark:bg-[oklch(0.30_0.10_15)] dark:text-[oklch(0.85_0.10_15)]",
  manager: "bg-[oklch(0.90_0.03_250)] text-[oklch(0.35_0.10_250)] dark:bg-[oklch(0.25_0.05_250)] dark:text-[oklch(0.80_0.05_250)]",
  reader: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
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
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Track which collapsible menus are open
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    // Auto-open Fornecedores if current path is a subitem
    const supplierPaths = ["/suppliers", "/documents", "/approvals", "/compliance", "/interactions", "/evaluations"];
    if (supplierPaths.some(p => location === p || location.startsWith("/suppliers/"))) {
      return ["Fornecedores"];
    }
    return [];
  });

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(m => m !== label)
        : [...prev, label]
    );
  };

  // Find active menu item for mobile header
  const findActiveLabel = () => {
    for (const item of menuStructure) {
      if (item.path === location) return item.label;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.path === location || location.startsWith(s.path + "/"));
        if (sub) return sub.label;
      }
    }
    return "Menu";
  };

  const filteredMenuItems = menuStructure.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Check if a path is active (exact match or starts with for detail pages)
  const isPathActive = (path: string) => {
    if (path === "/") return location === "/";
    return location === path || location.startsWith(path + "/");
  };

  // Check if any subitem is active
  const hasActiveSubitem = (subItems?: typeof menuStructure[0]["subItems"]) => {
    if (!subItems) return false;
    return subItems.some(sub => isPathActive(sub.path));
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-[oklch(0.98_0.005_90)] dark:bg-[oklch(0.15_0.02_250)]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-border/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate text-primary">
                    Arqueo Fornecedores
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {filteredMenuItems.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openMenus.includes(item.label);
                const isActive = hasSubItems 
                  ? hasActiveSubitem(item.subItems) 
                  : isPathActive(item.path);

                if (hasSubItems) {
                  return (
                    <Collapsible
                      key={item.label}
                      open={isOpen}
                      onOpenChange={() => toggleMenu(item.label)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.label}
                            className={`h-10 transition-all font-normal ${
                              isActive
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : ""
                            }`}
                          >
                            <item.icon
                              className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                            />
                            <span className="flex-1">{item.label}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems?.map((subItem) => {
                              const isSubActive = isPathActive(subItem.path);
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton
                                    onClick={() => setLocation(subItem.path)}
                                    isActive={isSubActive}
                                    className={`transition-all ${
                                      isSubActive
                                        ? "bg-primary/10 text-primary"
                                        : ""
                                    }`}
                                  >
                                    <subItem.icon className={`h-3.5 w-3.5 ${isSubActive ? "text-primary" : ""}`} />
                                    <span>{subItem.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : ""
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0 bg-primary/10">
                    <AvatarFallback className="text-xs font-medium text-primary bg-primary/10">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${
                          roleColors[user?.role || "reader"]
                        }`}
                      >
                        {roleLabels[user?.role || "reader"]}
                      </Badge>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
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
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-background">
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground font-medium">
                    {findActiveLabel()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
