import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { categoryProductCount, uniqueCategoryName } from "@/lib/categoryManagement";

interface CategoryManagerProps {
  categories: string[];
  productCategories: (string | null)[];
  // Every name already in use (official, saved, or on a product) — used to
  // stop a new category from duplicating one that exists.
  existingNames: string[];
  onAdd: (name: string) => Promise<string>;
  onRename: (oldName: string, newName: string) => Promise<void>;
  onReorder: (ordered: string[]) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
}

export default function CategoryManager({ categories, productCategories, existingNames, onAdd, onRename, onReorder, onRemove }: CategoryManagerProps) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const searching = query.trim() !== "";
  const editCandidate = editing ? uniqueCategoryName(editName, existingNames.filter((n) => n.trim().toLowerCase() !== editing.toLowerCase())) : null;

  const saveRename = async () => {
    if (!editing || !editCandidate || renaming) return;
    if (editCandidate === editing) { setEditing(null); return; }
    setRenaming(true);
    setRenameError("");
    try {
      await onRename(editing, editCandidate);
      setEditing(null);
    } catch (failure) {
      setRenameError(failure instanceof Error ? failure.message : "Could not rename category.");
    } finally {
      setRenaming(false);
    }
  };

  const move = (name: string, delta: number) => {
    const from = categories.indexOf(name);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= categories.length) return;
    const next = [...categories];
    [next[from], next[to]] = [next[to], next[from]];
    void onReorder(next);
  };

  const filtered = categories.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  const candidate = uniqueCategoryName(newName, existingNames);

  const add = async () => {
    if (!candidate || saving) return;
    setSaving(true);
    setAddError("");
    try {
      await onAdd(candidate);
      setNewName("");
    } catch (failure) {
      setAddError(failure instanceof Error ? failure.message : "Could not save category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
      <DialogHeader><DialogTitle>Manage categories</DialogTitle></DialogHeader>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            aria-label="New category name"
            placeholder="New category name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void add();
              }
            }}
          />
          <Button type="button" className="shrink-0" disabled={!candidate || saving} onClick={() => { void add(); }}>
            <Plus className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Add"}
          </Button>
        </div>
        {newName.trim() && !candidate && <p className="text-sm text-muted-foreground">This category already exists.</p>}
        {addError && <p role="alert" className="text-sm text-destructive">{addError}</p>}
      </div>
      <Input aria-label="Search categories" placeholder="Search categories..." value={query} onChange={(event) => setQuery(event.target.value)} />
      {searching && <p className="text-xs text-muted-foreground">Clear the search to reorder.</p>}
      <div className="category-scroll max-h-[50dvh] overflow-y-auto divide-y">
        {filtered.map((name) => {
          const count = categoryProductCount(name, productCategories);
          const index = categories.indexOf(name);
          if (editing === name) return <div key={name} className="space-y-1 py-3">
            <div className="flex items-center gap-2">
              <Input autoFocus aria-label={`New name for ${name}`} value={editName} onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveRename(); } if (e.key === "Escape") setEditing(null); }} />
              <Button size="icon" type="button" aria-label="Save name" disabled={!editCandidate || renaming} onClick={() => { void saveRename(); }}><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" type="button" aria-label="Cancel rename" disabled={renaming} onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
            </div>
            {editName.trim() && !editCandidate && <p className="text-xs text-muted-foreground">This category already exists.</p>}
            {count > 0 && <p className="text-xs text-muted-foreground">Its {count} product{count === 1 ? "" : "s"} will move to the new name.</p>}
            {renameError && <p role="alert" className="text-xs text-destructive">{renameError}</p>}
          </div>;
          return <div key={name} className="flex items-center justify-between gap-2 py-2">
            <div className="flex shrink-0 flex-col">
              <Button variant="ghost" size="icon" type="button" className="h-6 w-6" disabled={searching || index <= 0} aria-label={`Move ${name} up`} onClick={() => move(name, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" type="button" className="h-6 w-6" disabled={searching || index >= categories.length - 1} aria-label={`Move ${name} down`} onClick={() => move(name, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{count ? `${count} product${count === 1 ? "" : "s"}` : "No products"}</p>
            </div>
            <Button variant="ghost" size="icon" type="button" aria-label={`Rename ${name}`} title={`Rename ${name}`} className="shrink-0" onClick={() => { setEditing(name); setEditName(name); setRenameError(""); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" type="button" disabled={count > 0} aria-label={`Remove ${name}`} title={count ? "Move products to another category first" : `Remove ${name}`} className="shrink-0 text-destructive" onClick={() => { setSelected(name); setError(""); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>;
        })}
        {!filtered.length && <p className="py-6 text-sm text-muted-foreground">{categories.length ? "No matching categories" : "No categories yet"}</p>}
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
