import { useEffect, useState } from "react";
import { Sparkles, Check, Copy } from "lucide-react";
import { fetchStoreSettings } from "@/lib/pricing";
import { fetchActiveCoupons, couponMessage } from "@/lib/offers";
import { useToast } from "@/hooks/use-toast";

interface OfferMessage {
  code?: string;
  text: string;
}

const AnnouncementBar = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<OfferMessage[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchStoreSettings().catch(() => null),
      fetchActiveCoupons().catch(() => []),
    ]).then(([settings, coupons]) => {
      if (cancelled) return;
      const msgs: OfferMessage[] = [];
      const threshold = settings?.free_shipping_threshold;
      if (threshold != null) {
        msgs.push({ text: `Free standard delivery on all orders over $${Number(threshold).toFixed(2)}` });
      }
      coupons.slice(0, 3).forEach((c) => {
        msgs.push({ code: c.code, text: `${c.code} — ${couponMessage(c)}` });
      });
      setMessages(msgs);
    });
    return () => { cancelled = true; };
  }, []);

  // Rotate messages with a soft fade
  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 250);
    }, 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (messages.length === 0) return null;

  const msg = messages[index];

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable — the code is still visible */
    }
    setCopied(true);
    toast({ title: "Coupon copied", description: `${code} — enter it in your cart at checkout.` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-primary text-primary-foreground">
      <div
        className={`container mx-auto px-4 h-9 flex items-center justify-center gap-2 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0 opacity-90" aria-hidden />
        <p className="text-xs font-medium tracking-wide text-center truncate">
          {msg.text}
        </p>
        {msg.code && (
          <button
            type="button"
            aria-label={`Copy coupon code ${msg.code}`}
            onClick={() => copyCode(msg.code!)}
            className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <><Check className="w-3 h-3" /> Copied</>
            ) : (
              <><Copy className="w-3 h-3" /> Copy</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
