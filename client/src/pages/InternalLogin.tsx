import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function InternalLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login.");
        return;
      }

      // Login bem-sucedido — redirecionar para a home
      window.location.href = "/";
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.35_0.10_250)] via-[oklch(0.30_0.12_15)] to-[oklch(0.25_0.08_250)] p-4 animate-arqueo-fade-in">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Brand */}
        <div className="text-center flex flex-col items-center">
          <div className="relative mb-4 animate-arqueo-slide-up">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ background: "radial-gradient(circle, #E85D04 0%, #F5A623 60%, transparent 100%)", transform: "scale(1.8)" }}
            />
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028979380/KbiCF9FN7rZHpjZqbGxEKZ/logo-grupo-arqueo-a_5ae27f44.png"
              alt="Grupo Arqueo"
              className="relative w-24 h-24 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight animate-arqueo-slide-up-delay-1">Grupo Arqueo</h1>
          <p className="text-sm mt-1 font-semibold animate-arqueo-slide-up-delay-1" style={{ color: "#F5A623" }}>Gestão de Fornecedores</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl animate-arqueo-slide-up-delay-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Acesso Interno</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais corporativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {/* OAuth Login — only shown when Manus OAuth is configured */}
            {import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { window.location.href = getLoginUrl(); }}
                >
                  Entrar com Manus (OAuth)
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs animate-arqueo-slide-up-delay-3">
          Acesso restrito a colaboradores autorizados do Grupo Arqueo.
        </p>
      </div>
    </div>
  );
}
