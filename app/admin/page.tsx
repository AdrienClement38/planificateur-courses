"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Heart, Store, UtensilsCrossed, Package, Trash2, Key, Plus, Globe, Search } from "lucide-react";

import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // Favorites State
  const [favStores, setFavStores] = useState<any[]>([]);
  const [favProducts, setFavProducts] = useState<any[]>([]);
  const [favMeals, setFavMeals] = useState<any[]>([]);
  const [isLoadingFavs, setIsLoadingFavs] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isAddingKey, setIsAddingKey] = useState(false);

  const fetchFavorites = async () => {
    setIsLoadingFavs(true);
    try {
      const [storesRes, productsRes, mealsRes] = await Promise.all([
        fetch("/api/favorites"),
        fetch("/api/favorites/products"),
        fetch("/api/favorites/meals")
      ]);

      if (storesRes.ok) setFavStores(await storesRes.json());
      if (productsRes.ok) setFavProducts(await productsRes.json());
      if (mealsRes.ok) setFavMeals(await mealsRes.json());
    } catch (err) {
      console.error("Failed to fetch favorites", err);
    } finally {
      setIsLoadingFavs(false);
    }
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/admin/keys");
      if (res.ok) setApiKeys(await res.json());
    } catch (err) {
      console.error("Failed to fetch keys", err);
    }
  };

  useEffect(() => {
    fetchFavorites();
    fetchKeys();
  }, []);

  const addKey = async () => {
    if (!newKeyName || !newKeyValue) return toast.error("Nom et Clé requis");
    setIsAddingKey(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, key: newKeyValue })
      });
      if (res.ok) {
        toast.success("Clé ajoutée");
        setNewKeyName("");
        setNewKeyValue("");
        fetchKeys();
      } else {
        const error = await res.json();
        toast.error(`Erreur: ${error.error}`);
      }
    } catch (err) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsAddingKey(false);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.id !== id));
        toast.success("Clé supprimée");
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const removeFavoriteStore = async (url: string) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name: "dummy", drive: "dummy" }) // The API toggles if url matches
      });
      if (res.ok) {
        setFavStores(prev => prev.filter(s => s.url !== url));
        toast.success("Magasin retiré");
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const removeFavoriteProduct = async (product: any) => {
    try {
      const res = await fetch("/api/favorites/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: product.name, drive: product.drive, is_favorite: false })
      });
      if (res.ok) {
        setFavProducts(prev => prev.filter(p => p.id !== product.id));
        toast.success("Produit retiré");
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const removeFavoriteMeal = async (meal: any) => {
    try {
      const res = await fetch("/api/favorites/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal)
      });
      if (res.ok) {
        setFavMeals(prev => prev.filter(m => m.id !== meal.id));
        toast.success("Repas retiré");
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const startUpdate = async () => {
    setIsRunning(true);
    setLogs([]);
    try {
      const response = await fetch("/api/update-prices", { method: "POST" });
      if (!response.ok) {
        setLogs(prev => [{ status: "fatal", message: `Erreur ${response.status}` }, ...prev]);
        setIsRunning(false);
        return;
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataStr = line.trim().slice(6);
            if (dataStr === "[DONE]") { setIsRunning(false); break; }
            try {
              const data = JSON.parse(dataStr);
              setLogs(prev => [data, ...prev]);
            } catch (e) { }
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
    if (status === "updated_estimate") return <Globe className="h-4 w-4 text-green-500" />;
    if (status === "unchanged_estimate") return <Globe className="h-4 w-4 text-blue-500 opacity-40" />;
    if (status === "web_fallback") return <Search className="h-4 w-4 text-orange-300 animate-pulse" />;
    if (status === "unchanged") return <CheckCircle2 className="h-4 w-4 text-blue-500 opacity-50" />;


    if (status === "error" || status === "fatal") return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };


  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard Admin</h1>
            <p className="text-muted-foreground">Gestion des prix et des favoris</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/products">
              <Button variant="outline" size="sm">Base produits</Button>
            </Link>
            <Link href="/">
              <Button variant="default" size="sm">Retour au site</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Favoris
            </TabsTrigger>
            <TabsTrigger value="update" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Update Prix
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4 text-amber-500" />
              Clés API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stores */}
              <Card className="border-white/5 bg-white/[0.02]">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    Magasins Favoris
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {favStores.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-4">Aucun magasin favori.</p>
                    ) : (
                      favStores.map(store => (
                        <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{store.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{store.drive}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFavoriteStore(store.url)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card className="border-white/5 bg-white/[0.02]">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-400" />
                    Produits Favoris
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {favProducts.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-4">Aucun produit favori.</p>
                    ) : (
                      favProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground">{product.brand || "Sans marque"}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFavoriteProduct(product)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Favorite Meals */}
            <Card className="border-white/5 bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-red-500" />
                  Repas Favoris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favMeals.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 col-span-full">Aucun repas favori.</p>
                  ) : (
                    favMeals.map(meal => (
                      <div key={meal.id} className="p-4 rounded-xl bg-white/5 border border-white/5 relative group">
                        <div className="space-y-3">
                          {meal.breakfast && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/70 block mb-0.5">Petit-Déj</span>
                              <p className="text-xs font-medium text-foreground/80">{meal.breakfast}</p>
                              {meal.breakfast_ingredients && (
                                <p className="text-[10px] text-muted-foreground mt-1 pl-2 border-l border-white/10 italic">
                                  {meal.breakfast_ingredients}
                                </p>
                              )}
                            </div>
                          )}
                          {meal.lunch && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/70 block mb-0.5">Déjeuner</span>
                              <p className="text-xs font-medium text-foreground/80">{meal.lunch}</p>
                              {meal.lunch_ingredients && (
                                <p className="text-[10px] text-muted-foreground mt-1 pl-2 border-l border-white/10 italic">
                                  {meal.lunch_ingredients}
                                </p>
                              )}
                            </div>
                          )}
                          {meal.dinner && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-pink-500/70 block mb-0.5">Dîner</span>
                              <p className="text-xs font-medium text-foreground/80">{meal.dinner}</p>
                              {meal.dinner_ingredients && (
                                <p className="text-[10px] text-muted-foreground mt-1 pl-2 border-l border-white/10 italic">
                                  {meal.dinner_ingredients}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFavoriteMeal(meal)}
                          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="update">
            <Card className="border-white/5 bg-white/[0.02]">
              <CardHeader>
                <CardTitle>Mise à jour des prix Drive</CardTitle>
                <CardDescription>Scrape les prix actuels des produits en base sur le Leclerc Drive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button onClick={startUpdate} disabled={isRunning} className="w-full sm:w-48">
                  {isRunning ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Mise à jour...</> : <><RefreshCw className="mr-2 h-4 w-4" /> Lancer l'Update</>}
                </Button>
                {logs.length > 0 && (
                  <div className="h-[500px] rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-[11px] overflow-y-auto space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                        <div className="mt-0.5">{getLogIcon(log.status)}</div>
                        <div className="flex-1">
                          {log.status === "updated" && <span className="text-green-400 font-bold">{log.product} : {log.old_price}€ ➔ {log.new_price}€</span>}
                          {log.status === "updated_estimate" && <span className="text-green-500 font-bold">{log.product} : {log.old_price}€ ➔ {log.new_price}€ <small className="text-[9px] opacity-70 ml-1">(Estimation Web)</small></span>}
                          {log.status === "unchanged_estimate" && <span className="text-blue-400/60">{log.product} : {log.new_price}€ <small className="text-[8px] opacity-40 ml-1">(Estimation stable)</small></span>}
                          {log.status === "web_fallback" && <span className="text-orange-300 italic">Recherche Web en cours pour {log.product}...</span>}
                          {log.status === "unchanged" && <span className="text-blue-500 opacity-60">{log.product} : {log.new_price}€ (Inchangé)</span>}


                          {(log.status === "error" || log.status === "fatal") && <span className="text-destructive font-bold">{log.message || `Erreur: ${log.reason || "Inconnue"}`} {log.product && `- ${log.product}`}</span>}
                          {(!["updated", "updated_estimate", "web_fallback", "unchanged", "error", "fatal"].includes(log.status)) && <span>{log.message || log.product || JSON.stringify(log)}</span>}
                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add Key Form */}
              <Card className="border-white/5 bg-white/[0.02] md:col-span-1">
                <CardHeader>
                  <CardTitle>Ajouter une clé Gemini</CardTitle>
                  <CardDescription>La clé sera chiffrée avant stockage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Nom (ex: Compte Perso)</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Nom de la clé"
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Clé API (AIzaSy...)</label>
                    <input
                      type="password"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="Coller la clé ici"
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <Button onClick={addKey} disabled={isAddingKey} className="w-full">
                    {isAddingKey ? "Chiffrement..." : <><Plus className="h-4 w-4 mr-2" /> Ajouter la clé</>}
                  </Button>
                </CardContent>
              </Card>

              {/* Keys List */}
              <Card className="border-white/5 bg-white/[0.02] md:col-span-2">
                <CardHeader>
                  <CardTitle>Clés enregistrées</CardTitle>
                  <CardDescription>Rotation automatique active entre toutes les clés valides.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeys.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
                        <Key className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground italic">Aucune clé en base. Utilisation de .env par défaut.</p>
                      </div>
                    ) : (
                      apiKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              key.lastStatus === "200" ? "bg-green-500/10 text-green-500" :
                                key.lastStatus === "429" ? "bg-amber-500/10 text-amber-500" :
                                  key.lastStatus === "503" ? "bg-blue-500/10 text-blue-500" : "bg-white/5 text-white/20"
                            )}>
                              <Key className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{key.name}</p>
                              <p className="text-xs font-mono text-muted-foreground">{key.key}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={cn(
                                  "text-[8px] h-4 px-1.5 border-none",
                                  key.lastStatus === "200" ? "bg-green-500/20 text-green-400" :
                                    key.lastStatus === "429" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/40"
                                )}>
                                  {key.lastStatus === "200" ? "OPÉRATIONNELLE" : key.lastStatus === "429" ? "LIMITÉE (PAUSE)" : "INACTIVE"}
                                </Badge>
                                {key.lastUsedAt && (
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest opacity-40">
                                    Dernier appel : {new Date(key.lastUsedAt).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteKey(key.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
