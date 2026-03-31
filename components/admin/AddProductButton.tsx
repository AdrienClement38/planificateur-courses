"use client"

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct } from "@/app/admin/products/actions";
import { toast } from "sonner";

export function AddProductButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      brand: formData.get("brand"),
      quantity: formData.get("quantity"),
      category: formData.get("category"),
      price_ttc: formData.get("price_ttc"),
    };
    try {
      const res = await createProduct(data);
      if (res?.error) throw new Error(res.error);
      toast.success("Produit ajouté");
      setIsOpen(false);
    } catch(err: any) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" />
        Ajouter un produit
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 p-6 rounded-xl w-full max-w-md flex flex-col items-center">
            <div className="flex justify-between items-center mb-6 w-full">
              <h3 className="text-lg font-medium">Nouveau Produit</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 w-full text-left">
              <div className="space-y-2">
                <Label htmlFor="new-name">Nom du produit</Label>
                <Input id="new-name" name="name" required className="bg-white/5 border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-brand">Marque / Détail</Label>
                  <Input id="new-brand" name="brand" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-quantity">Quantité formatée</Label>
                  <Input id="new-quantity" name="quantity" placeholder="ex: 720g, x4" className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-category">Catégorie</Label>
                  <Input id="new-category" name="category" placeholder="Surgelé, Charcuterie..." required className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-price_ttc">Prix TTC (€)</Label>
                  <Input id="new-price_ttc" name="price_ttc" type="number" step="0.01" required className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-white/10 hover:bg-white/10">Annuler</Button>
                <Button type="submit" disabled={isSaving} className="bg-white text-black hover:bg-white/90">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajouter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
