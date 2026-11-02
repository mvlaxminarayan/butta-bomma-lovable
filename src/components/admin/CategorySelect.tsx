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
    known.add(trimmed.toLowerCase());
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

// Selection only. Creating or removing categories lives in the
// Manage categories dialog, so every category change happens in one place.
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
  const [query, setQuery] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);
  const [scrollHint, setScrollHint] = React.useState({ top: false, bottom: false });
  const refreshScrollHint = React.useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setScrollHint({ top: false, bottom: false });
      return;
    }
    setScrollHint({
      top: el.scrollTop > 2,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 2,
    });
  }, []);
  // Re-measure whenever the list contents change (opening, searching, new options),
  // and start a fresh search from the top of the list.
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = 0;
    const frame = requestAnimationFrame(refreshScrollHint);
    return () => cancelAnimationFrame(frame);
  }, [open, query, options, refreshScrollHint]);
  const selected = options.find((o) => o.value === value);
  // A product may already carry a category that is not in the list — show it as-is.
  const label = value ? selected?.label ?? value : "";

  return (
    <div className={cn("min-w-0", className)}>
    <Popover modal open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) setQuery("");
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
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] min-w-64 flex-col overflow-hidden p-0"
      >
        <Command className="flex min-h-0 flex-1 flex-col">
          <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} className="h-10" />
          <div className="relative flex min-h-0 flex-1 flex-col">
          <CommandList ref={listRef} onScroll={refreshScrollHint} className="category-scroll min-h-0 flex-1">
            <CommandEmpty>{emptyText}</CommandEmpty>
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
          {scrollHint.top && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-popover to-transparent" />
          )}
          {scrollHint.bottom && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-popover to-transparent" />
          )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
    </div>
  );
}

export default CategorySelect;
