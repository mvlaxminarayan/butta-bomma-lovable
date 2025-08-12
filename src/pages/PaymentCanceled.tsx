import { useEffect } from "react";

const PaymentCanceled = () => {
  useEffect(() => {
    document.title = "Payment Canceled - Handcrafted Ceramic Mug";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Your payment was canceled. You can retry checkout anytime.");
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/payment-canceled";
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <section className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">Payment Canceled</h1>
        <p className="text-muted-foreground">No worries—your card wasn’t charged. You can continue shopping and try again.</p>
      </section>
    </main>
  );
};

export default PaymentCanceled;
