"use client"

import { useState } from "react";
import { Pencil, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteProduct, updateProduct } from "@/app/admin/products/actions";
import { toast } from "sonner";

export function ProductRowActions({ product }: { product: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleDelete() {
    if (!confirm(`Es-tu sûr de vouloir supprimer "${product.name}" définitivement ?`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteProduct(product.id);
      if (res?.error) throw new Error(res.error);
      toast.success("Produit supprimé");
    } catch(err: any) {
      toast.error(`Erreur : ${err.message}`);
      setIsDeleting(false);
    }
  }

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
      const res = await updateProduct(product.id, data);
      if (res?.error) throw new Error(res.error);
      toast.success("Produit mis à jour");
      setIsEditing(false);
    } catch(err: any) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsEditing(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 p-6 rounded-xl w-full max-w-md flex flex-col items-center">
            <div className="flex justify-between items-center mb-6 w-full">
              <h3 className="text-lg font-medium">Modifier Produit</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 w-full">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" name="name" defaultValue={product.name} required className="bg-white/5 border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marque / Détail</Label>
                  <Input id="brand" name="brand" defaultValue={product.brand || ""} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité formatée</Label>
                  <Input id="quantity" name="quantity" defaultValue={product.quantity || ""} placeholder="ex: 720g" className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Input id="category" name="category" defaultValue={product.category} required className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_ttc">Prix TTC (€)</Label>
                  <Input id="price_ttc" name="price_ttc" type="number" step="0.01" defaultValue={product.price_ttc.toFixed(2)} required className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="border-white/10 hover:bg-white/10">Annuler</Button>
                <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
