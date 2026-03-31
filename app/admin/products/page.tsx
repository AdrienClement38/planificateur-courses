import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft } from "lucide-react";
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

  const products = await prisma.product.findMany({
    where: q ? {
      OR: [
        { name: { contains: q } },
        { brand: { contains: q } },
        { category: { contains: q } }
      ]
    } : undefined,
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
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">Base Produits</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                {products.length} produits enregistrés
                <AutoRefresher />
              </p>
            </div>
            <div className="ml-auto flex flex-col-reverse sm:flex-row items-end sm:items-center gap-3">
              <ProductSearchInput />
              <AddProductButton />
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          Vue d'ensemble par catégorie. Un produit n'est plus à jour s'il n'a pas été vérifié depuis plus de 7 jours.
        </div>

        {Object.entries(groupedProducts).map(([category, catProducts]: [string, any]) => (
          <Card key={category} className="border-white/5 bg-white/[0.02]">
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
        ))}
      </div>
    </div>
  );
}
