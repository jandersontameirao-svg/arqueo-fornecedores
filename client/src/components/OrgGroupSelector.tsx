import { useOrgGroupContext } from "@/contexts/OrgGroupContext";
import { Building2, ChevronDown, Globe, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * OrgGroupSelector — Dropdown component for switching between organizational groups.
 * Displays the active group name and allows switching when user has access to multiple groups.
 * Shows a badge for super admins.
 */
export default function OrgGroupSelector() {
  const { groups, activeGroup, setActiveGroupId, isLoading, isSuperAdmin } = useOrgGroupContext();

  if (isLoading) {
    return <Skeleton className="h-9 w-40" />;
  }

  // If user has only one group, show it as a static label
  if (groups.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate max-w-[160px]">
          {activeGroup?.name || "Sem grupo"}
        </span>
        {isSuperAdmin && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600">
            <Shield className="h-3 w-3 mr-0.5" />
            Super
          </Badge>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[220px]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{activeGroup?.name || "Selecionar Grupo"}</span>
          {isSuperAdmin && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-500/50 text-amber-600 shrink-0">
              <Shield className="h-3 w-3" />
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          Grupos Organizacionais
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => setActiveGroupId(group.id)}
            className={`cursor-pointer ${group.id === activeGroup?.id ? "bg-accent" : ""}`}
          >
            <Building2 className="h-4 w-4 mr-2 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{group.name}</span>
              {group.country && (
                <span className="text-[11px] text-muted-foreground">{group.country}</span>
              )}
            </div>
            {group.id === activeGroup?.id && (
              <div className="ml-auto h-2 w-2 rounded-full bg-green-500 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
