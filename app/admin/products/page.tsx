import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, ArrowLeft, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { AddProductButton } from "@/components/admin/AddProductButton";
import { AutoRefresher } from "@/components/admin/AutoRefresher";
import { FavoriteStar } from "@/components/admin/FavoriteStar";
import { ProductSearchInput } from "@/components/admin/ProductSearchInput";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";
  const currentTab = searchParams?.tab || "active";
  const isBannedView = currentTab === "banned";

  const products = await prisma.product.findMany({
    where: {
      is_banned: isBannedView,
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } }
        ]
      } : {})
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  const groupedProducts = products.reduce((acc: any, product: any) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {});

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        
        {/* SIDEBAR GAUCHE (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 pb-8 custom-scrollbar">
          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Retour Dashboard
            </Link>
          </div>
          
          <div className="flex flex-col gap-1 border-l border-white/10 pl-4 py-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Sommaire des catégories
            </div>
            {Object.keys(groupedProducts).map((category) => {
              const catId = `category-${category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
              return (
                <a 
                  key={category} 
                  href={`#${catId}`}
                  className="block py-1.5 text-sm font-medium text-white/50 hover:text-primary transition-colors"
                >
                  {category}
                </a>
              );
            })}
          </div>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 min-w-0 w-full mb-32">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 lg:hidden mb-4">
                <Link href="/admin">
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="text-sm font-medium text-muted-foreground">Retour Dashboard</div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Base Produits</h1>
              <div className="text-muted-foreground flex items-center gap-2 mt-2">
                {products.length} produits enregistrés
                <AutoRefresher />
              </div>
              <div className="text-xs text-muted-foreground mt-2 max-w-xl leading-relaxed">
                Vue d'ensemble par catégorie. <span className="text-destructive/80 font-medium">Un produit est marqué "À vérifier" s'il n'a pas été contrôlé depuis plus de 7 jours.</span>
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <ProductSearchInput />
              <AddProductButton />
            </div>
          </div>

          <Tabs key={currentTab} defaultValue={currentTab} className="mb-8">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <Link href="?tab=active" scroll={false}>
                <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Produits Actifs
                </TabsTrigger>
              </Link>
              <Link href="?tab=banned" scroll={false}>
                <TabsTrigger value="banned" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-2">
                  <Ban className="h-4 w-4" />
                  Produits Bannis
                </TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>

          {/* Raccourcis Mobiles (Horizontaux) */}
          <div className="lg:hidden flex flex-wrap gap-2 sticky top-4 z-20 bg-background/95 backdrop-blur-md p-3 -mx-4 mb-8 border-b border-t border-white/5 shadow-2xl">
            {Object.keys(groupedProducts).map((category) => {
              const catId = `category-${category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
              return (
                <a 
                  key={category} 
                  href={`#${catId}`}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-all hover:bg-primary/20 hover:text-primary hover:border-primary/30"
                >
                  {category}
                </a>
              );
            })}
          </div>

          <div className="space-y-12">
            {Object.entries(groupedProducts).map(([category, catProducts]: [string, any]) => {
          const catId = `category-${category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
          return (
            <Card key={category} id={catId} className="border-white/5 bg-white/[0.02] scroll-mt-24">
              <CardHeader className="pb-3 border-b border-white/[0.02] bg-white/[0.01]">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  {category}
                  <Badge variant="secondary" className="bg-white/10 text-xs ml-2">
                    {catProducts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-4 sm:pt-6">
              <div className="rounded-md border border-white/10 sm:overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-medium">Produit</th>
                        <th className="px-4 py-3 font-medium">Quantité</th>
                        <th className="px-4 py-3 font-medium text-right">Prix TTC</th>
                        <th className="px-4 py-3 font-medium text-center">Dernière maj</th>
                        <th className="px-4 py-3 font-medium text-center">Statut</th>
                        <th className="px-4 py-3 font-medium text-center">Lien</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {catProducts.map((p: any) => {
                        const isStale = new Date(p.last_updated) < sevenDaysAgo;
                        const searchUrl = `https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire/recherche.aspx?TexteRecherche=${encodeURIComponent(p.name)}`;
                        
                        const daysSince = Math.floor((new Date().getTime() - new Date(p.last_updated).getTime()) / (1000 * 3600 * 24));
                        const timeText = daysSince === 0 ? "Aujourd'hui" : `Il y a ${daysSince} jour${daysSince > 1 ? 's' : ''}`;

                        return (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 font-medium flex items-center">
                              <FavoriteStar product={p} />
                              {p.name} {p.brand ? <span className="text-muted-foreground font-normal text-xs ml-1">({p.brand})</span> : ""}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{p.quantity || <span className="text-white/20">-</span>}</td>
                            <td className="px-4 py-3 text-right font-mono">{p.price_ttc.toFixed(2)} €</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs text-center border-l border-white/[0.02]">{timeText}</td>
                            <td className="px-4 py-3 text-center">
                              {isStale ? (
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 uppercase text-[10px]">À vérifier</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 uppercase text-[10px]">À jour</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </td>
                            <td className="px-2 py-3 text-right">
                              <ProductRowActions product={p} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );
}
