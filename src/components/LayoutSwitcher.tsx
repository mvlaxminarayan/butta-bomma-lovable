import { isPreviewHost, setLayoutChoice, useLayoutChoice, HeaderLayout, HomeLayout } from "@/lib/layoutPreview";

const headers: [HeaderLayout, string][] = [["current", "Current"], ["centered", "A · Centered"], ["twoTier", "B · Two-tier"]];
const homes: [HomeLayout, string][] = [["current", "Current"], ["story", "1 · Story first"], ["categories", "2 · Categories"]];

const LayoutSwitcher = () => {
  const c = useLayoutChoice();
  if (!isPreviewHost()) return null;
  const btn = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`;
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[min(95vw,560px)] -translate-x-1/2 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Design preview (only you see this)</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-16 text-xs font-semibold">Header</span>
        {headers.map(([v, l]) => <button key={v} className={btn(c.header === v)} onClick={() => setLayoutChoice({ header: v })}>{l}</button>)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="w-16 text-xs font-semibold">Home</span>
        {homes.map(([v, l]) => <button key={v} className={btn(c.home === v)} onClick={() => setLayoutChoice({ home: v })}>{l}</button>)}
      </div>
    </div>
  );
};

export default LayoutSwitcher;
