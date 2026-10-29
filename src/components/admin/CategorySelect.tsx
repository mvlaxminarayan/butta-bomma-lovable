import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The store's official category list. Shown first in every category picker.
export const STORE_CATEGORIES = [
  "Etikoppaka toys",
  "Kondapalli toys",
  "Chiriyal paintings",
  "Wooden stools",
  "Brass collection",
  "Table lamps",
  "Traditional dolls",
  "Wedding crafts",
];

export type CategoryOption = {
  value: string;
  label: string;
  count?: number;
};

// Categories already used by products but missing from the official list,
// so editing an older product never silently drops its category.
export function extraCategories(used: (string | null)[]): string[] {
  const known = new Set(STORE_CATEGORIES.map((c) => c.toLowerCase()));
  const extras = new Set<string>();
  used.forEach((c) => {
    const trimmed = (c || "").trim();
    if (!trimmed) return;
    if (known.has(trimmed.toLowerCase())) return;
    known.add(trimmed.toLowerCase());
    extras.add(trimmed);
  });
  return [...extras].sort((a, b) => a.localeCompare(b));
}

export function newCategoryName(query: string, options: CategoryOption[]): string | null {
  const name = query.trim();
  if (!name || options.some((option) => option.value.trim().toLowerCase() === name.toLowerCase())) {
    return null;
  }
  return name;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  groupHeading?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
  allowCreate?: boolean;
  onCreate?: (name: string) => Promise<string>;
}

export function CategorySelect({
  value,
  onChange,
  options,
  placeholder = "Select a category",
  searchPlaceholder = "Search categories...",
  emptyText = "No category found",
  groupHeading,
  className,
  id,
  ariaLabel = "Category",
  allowCreate = false,
  onCreate,
}: CategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");
  const newName = allowCreate ? newCategoryName(query, options) : null;
  const selected = options.find((o) => o.value === value);
  // A product may already carry a category that is not in the list — show it as-is.
  const label = value ? selected?.label ?? value : "";
  const addCategory = async () => {
    if (!newName || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const name = onCreate ? await onCreate(newName) : newName;
      onChange(name);
      setQuery("");
      setCreating(false);
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("min-w-0", className)}>
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        setQuery("");
        setCreating(false);
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate text-left", !label && "text-muted-foreground")}>
            {label || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
      >
        {creating ? (
          <div className="space-y-3 p-3">
            <Input
              autoFocus
              aria-label="New category name"
              placeholder="New category name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCategory();
                }
              }}
            />
            {query.trim() && !newName && <p className="text-sm text-muted-foreground">This category already exists.</p>}
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <Button type="button" className="w-full" disabled={!newName || saving} onClick={addCategory}>
              <Plus className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Add category"}
            </Button>
          </div>
        ) : <>
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} className="h-10" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {newName && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${newName}`}
                  forceMount
                  disabled={saving}
                  onSelect={() => { void addCategory(); }}
                  className="gap-2 text-primary"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">Add “{newName}”</span>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading={groupHeading}>
              {options.map((o) => (
                <CommandItem
                  key={o.value || "__none__"}
                  value={o.value || "__none__"}
                  keywords={[o.label]}
                  onSelect={() => {
                    onChange(o.value);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === o.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{o.label}</span>
                  </span>
                  {typeof o.count === "number" && (
                    <span className="shrink-0 text-xs text-muted-foreground">{o.count}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {saveError && <p role="alert" className="px-3 py-2 text-sm text-destructive">{saveError}</p>}
        {allowCreate && <div className="border-t p-1">
          <Button type="button" variant="ghost" className="w-full justify-start" onClick={() => {
            setCreating(true);
            setQuery("");
          }}>
            <Plus className="mr-2 h-4 w-4" />Add new category
          </Button>
        </div>}
        </>}
      </PopoverContent>
    </Popover>
    {allowCreate && <Button type="button" variant="link" className="h-8 px-0" onClick={() => {
      setCreating(true);
      setQuery("");
      setOpen(true);
    }}>
      <Plus className="mr-1 h-4 w-4" />Add new category
    </Button>}
    </div>
  );
}

export default CategorySelect;
