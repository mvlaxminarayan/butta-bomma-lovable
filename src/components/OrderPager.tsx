import { Button } from "@/components/ui/button";

export const ORDERS_PER_PAGE = 5;

export const OrderPager = ({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) => {
  const pages = Math.max(1, Math.ceil(total / ORDERS_PER_PAGE));
  if (total <= ORDERS_PER_PAGE) return null;
  const from = page * ORDERS_PER_PAGE + 1;
  const to = Math.min(total, (page + 1) * ORDERS_PER_PAGE);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
        <span>Page {page + 1} of {pages}</span>
        <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
};
