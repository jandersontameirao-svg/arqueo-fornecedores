import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function AccessDenied() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 animate-arqueo-fade-in"
      style={{
        background:
          "radial-gradient(ellipse at 15% 25%, #1A3A5C 0%, transparent 50%), radial-gradient(ellipse at 85% 15%, #E85D04 0%, transparent 40%), radial-gradient(ellipse at 65% 85%, #8B1538 0%, transparent 55%), linear-gradient(135deg, #0f1c2e 0%, #1e0a14 50%, #0f1c2e 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full text-center">

        {/* Logo */}
        <div className="relative animate-arqueo-slide-up">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{ background: "radial-gradient(circle, #E85D04 0%, #F5A623 60%, transparent 100%)", transform: "scale(1.8)" }}
          />
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028979380/KbiCF9FN7rZHpjZqbGxEKZ/logo-grupo-arqueo-a_5ae27f44.png"
            alt="Grupo Arqueo"
            className="relative w-20 h-20 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Ícone de erro */}
        <div className="animate-arqueo-slide-up-delay-1 flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(139, 21, 56, 0.25)", border: "1.5px solid rgba(139, 21, 56, 0.5)" }}
          >
            <ShieldX className="w-10 h-10" style={{ color: "#F5A623" }} />
          </div>

          {/* Código de erro */}
          <span
            className="text-7xl font-black tracking-tighter leading-none"
            style={{
              background: "linear-gradient(135deg, #8B1538 0%, #E85D04 60%, #F5A623 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            403
          </span>
        </div>

        {/* Mensagem */}
        <div className="animate-arqueo-slide-up-delay-2 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Acesso Negado
          </h1>
          <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
            Você não tem permissão para acessar esta área. Esta seção é restrita a administradores do sistema.
          </p>
        </div>

        {/* Ações */}
        <div className="animate-arqueo-slide-up-delay-3 flex flex-col sm:flex-row gap-3 w-full">
          <Button
            onClick={() => setLocation("/")}
            size="lg"
            className="flex-1 font-semibold text-white shadow-lg hover:opacity-90 transition-all border-0 gap-2"
            style={{ background: "linear-gradient(135deg, #8B1538 0%, #E85D04 100%)" }}
          >
            <LayoutDashboard className="w-4 h-4" />
            Ir ao Dashboard
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
            className="flex-1 font-semibold gap-2"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.15)",
              color: "white",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        {/* Barra decorativa */}
        <div className="flex gap-2 animate-arqueo-bar">
          <div className="h-1 w-8 rounded-full" style={{ background: "#8B1538" }} />
          <div className="h-1 w-8 rounded-full" style={{ background: "#E85D04" }} />
          <div className="h-1 w-8 rounded-full" style={{ background: "#F5A623" }} />
          <div className="h-1 w-8 rounded-full" style={{ background: "#1A56DB" }} />
        </div>
      </div>
    </div>
  );
}
