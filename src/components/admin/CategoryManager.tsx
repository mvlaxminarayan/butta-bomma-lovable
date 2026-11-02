import { useState } from "react";
import { Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { categoryProductCount } from "@/lib/categoryManagement";

interface CategoryManagerProps {
  categories: string[];
  productCategories: (string | null)[];
  onRemove: (name: string) => Promise<void>;
}

export default function CategoryManager({ categories, productCategories, onRemove }: CategoryManagerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const filtered = categories.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  const remove = async () => {
    if (!selected || removing) return;
    setRemoving(true);
    setError("");
    try {
      await onRemove(selected);
      setSelected(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not remove category. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  return <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" type="button"><Settings2 className="mr-2 h-4 w-4" />Manage categories</Button>
    </DialogTrigger>
    <DialogContent className="max-h-[90dvh] max-w-lg overflow-hidden" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Custom categories</DialogTitle></DialogHeader>
      <Input aria-label="Search custom categories" placeholder="Search categories..." value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="category-scroll max-h-[50dvh] overflow-y-auto divide-y">
        {filtered.map((name) => {
          const count = categoryProductCount(name, productCategories);
          return <div key={name} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="break-words text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{count ? `${count} product${count === 1 ? "" : "s"} · Move products before removing` : "No products"}</p>
            </div>
            <Button variant="ghost" size="icon" type="button" disabled={count > 0} aria-label={`Remove ${name}`} title={count ? "Move products to another category first" : `Remove ${name}`} className="shrink-0 text-destructive" onClick={() => { setSelected(name); setError(""); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>;
        })}
        {!filtered.length && <p className="py-6 text-sm text-muted-foreground">{categories.length ? "No matching categories" : "No custom categories"}</p>}
      </div>
      <AlertDialog open={selected !== null} onOpenChange={(open) => { if (!open && !removing) setSelected(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove category?</AlertDialogTitle>
            <AlertDialogDescription className="break-words">“{selected}” will be removed from your category list. No products will be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={removing} onClick={() => { void remove(); }}>{removing ? "Removing..." : "Remove category"}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  </Dialog>;
}