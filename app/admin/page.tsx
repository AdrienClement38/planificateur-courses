"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const startUpdate = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      const response = await fetch("/api/update-prices", {
        method: "POST"
      });

      if (!response.ok) {
        setLogs(prev => [{ status: "fatal", message: `Erreur ${response.status}: ${response.statusText}` }, ...prev]);
        setIsRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setLogs(prev => [{ status: "fatal", message: "Impossible de lire le flux." }, ...prev]);
        setIsRunning(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataStr = line.trim().slice(6);
            if (dataStr === "[DONE]") {
              setIsRunning(false);
              break;
            }

            try {
              const data = JSON.parse(dataStr);
              // Add to top of list
              setLogs(prev => [data, ...prev]);
              console.log("[Admin] Update event:", data);
            } catch (e) {
              console.error("Failed to parse SSE data", dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      setLogs(prev => [{ status: "fatal", message: err.message }, ...prev]);
      setIsRunning(false);
    }
  };

  const getLogIcon = (status: string) => {
    if (status === "updated") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "unchanged") return <CheckCircle2 className="h-4 w-4 text-blue-500 opacity-50" />;
    if (status === "error" || status === "fatal") return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard Admin</h1>
            <p className="text-muted-foreground">Gestion des prix et de la base de données</p>
          </div>
          <Link href="/admin/products">
            <Button variant="outline">
              Voir la base produits
            </Button>
          </Link>
        </div>

        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Mise à jour des prix Drive</CardTitle>
            <CardDescription>
              Scrape les prix actuels des produits en base sur le Leclerc Drive Echirolles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button 
                onClick={startUpdate} 
                disabled={isRunning}
                className="w-full sm:w-40"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    En cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Lancer l'Update
                  </>
                )}
              </Button>
            </div>

            {logs.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Logs d'exécution</span>
                  {logs.find(l => l.summary) && (
                    <span className="text-primary font-bold">Terminé !</span>
                  )}
                </div>
                
                <div className="h-[400px] rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[11px] leading-relaxed custom-scrollbar overflow-hidden flex flex-col">
                  {/* Logs mapped in reverse order so latest is on top */}
                  <div className="space-y-1 overflow-y-auto pr-2">
                    {logs.map((log, i) => {
                      if (log.summary) {
                         return (
                           <div key={i} className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded -mx-2">
                             <div className="mt-0.5 shrink-0"><CheckCircle2 className="h-4 w-4 text-green-400" /></div>
                             <div className="flex-1 text-green-400 font-bold">
                                Bilan : {log.summary.updated} mis à jour, {log.summary.unchanged} inchangés, {log.summary.errors} erreurs. Total : {log.summary.total}
                             </div>
                           </div>
                         );
                      }
                      
                      const status = log.status || "info";

                      return (
                        <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded -mx-2">
                          <div className="mt-0.5 shrink-0">
                            {getLogIcon(status)}
                          </div>
                          <div className="flex-1">
                            {status === "fatal" ? (
                              <div className="text-destructive font-bold">{log.message || log.error}</div>
                            ) : status === "error" ? (
                              <div className="text-destructive">
                                <span className="font-semibold">{log.product}</span> - Échec ({log.reason})
                              </div>
                            ) : (
                              <div className={status === "updated" ? "text-green-300" : "text-white/60"}>
                                <span className="font-semibold">{log.product}</span> : 
                                {status === "updated" 
                                  ? ` ${log.old_price}€ ➔ ${log.new_price}€` 
                                  : ` ${log.new_price}€ (inchangé)`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
