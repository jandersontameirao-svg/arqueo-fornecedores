import { useAuth } from "@/_core/hooks/useAuth";
import AccessDenied from "@/pages/AccessDenied";

/**
 * AdminRoute — wrapper que exibe AccessDenied (403) se o usuário
 * autenticado não for admin. Não faz redirect, apenas substitui o
 * conteúdo da rota pela tela de acesso negado.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Enquanto carrega, não renderiza nada (o TopbarLayout já exibe skeleton)
  if (loading) return null;

  // Usuário autenticado mas sem permissão de admin
  if (user && user.role !== "admin") {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
