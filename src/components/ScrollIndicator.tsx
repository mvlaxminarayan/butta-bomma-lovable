import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

interface Props {
  /** The scrolling element the indicator should track. */
  scrollRef: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * A persistent, always-visible scroll indicator drawn inside the panel.
 * Native scrollbars are unreliable here: many browsers render them as
 * overlay bars that fade out, so the customer cannot see that the form
 * continues below the fold.
 */
export function ScrollIndicator({ scrollRef, className = "" }: Props) {
  const [bar, setBar] = useState({ visible: false, height: 0, top: 0 });
  const last = useRef(bar);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const track = el.clientHeight - 8;
    const next =
      max <= 2 || track <= 8
        ? { visible: false, height: 0, top: 0 }
        : {
            visible: true,
            height: Math.max(40, Math.min(track, (el.clientHeight / el.scrollHeight) * track)),
            top: 4 + (el.scrollTop / max) * Math.max(0, track - Math.max(40, (el.clientHeight / el.scrollHeight) * track)),
          };
    const prev = last.current;
    if (
      prev.visible !== next.visible ||
      Math.abs(prev.height - next.height) > 0.5 ||
      Math.abs(prev.top - next.top) > 0.5
    ) {
      last.current = next;
      setBar(next);
    }
  }, [scrollRef]);

  // Content can grow without the container itself resizing (new cart lines,
  // validation messages), so re-measure after every render.
  useLayoutEffect(() => {
    update();
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scrollRef, update]);

  if (!bar.visible) return null;

  return (
    <div
      aria-hidden
      className={`scroll-indicator pointer-events-none absolute bottom-2 right-1 top-2 w-2 overflow-hidden rounded-full bg-border ${className}`}
    >
      <div
        className="absolute left-0 w-full rounded-full bg-muted-foreground"
        style={{ height: `${bar.height}px`, top: `${bar.top}px` }}
      />
    </div>
  );
}

export default ScrollIndicator;
