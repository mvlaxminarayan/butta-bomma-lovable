import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    extras.add(trimmed);
  });
  return [...extras].sort((a, b) => a.localeCompare(b));
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
}: CategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  // A product may already carry a category that is not in the list — show it as-is.
  const label = value ? selected?.label ?? value : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn("justify-between font-normal", className)}
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
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-10" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup heading={groupHeading}>
              {options.map((o) => (
                <CommandItem
                  key={o.value || "__none__"}
                  value={o.value || "__none__"}
                  keywords={[o.label]}
                  onSelect={() => {
                    onChange(o.value);
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
      </PopoverContent>
    </Popover>
  );
}

export default CategorySelect;
