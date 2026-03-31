"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@driveplanner.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Échec de l'authentification");
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-primary/30">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]"></div>
      <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      <Card className="z-10 w-full max-w-md border-white/10 bg-black/60 backdrop-blur-xl">
        <CardHeader className="space-y-4 items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-lg">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">
              <span className="text-white">Drive</span>
              <span className="text-primary">Planner</span>
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Veuillez vous authentifier pour accéder au site.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/5 border-white/10 focus-visible:ring-primary/50 text-center text-lg tracking-wide placeholder:text-muted-foreground/50"
                required
                autoFocus
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/5 border-white/10 focus-visible:ring-primary/50 text-center text-lg tracking-widest placeholder:text-muted-foreground/50 placeholder:tracking-normal"
                required
              />
              {error && (
                <p className="text-sm font-medium text-destructive text-center animate-in fade-in slide-in-from-top-1 pt-2">
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold tracking-wide transition-all shadow-lg shadow-primary/20 mt-2"
              disabled={isLoading || !password || !email}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
