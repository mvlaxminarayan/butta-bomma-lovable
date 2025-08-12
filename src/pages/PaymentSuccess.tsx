import { useEffect } from "react";

const PaymentSuccess = () => {
  useEffect(() => {
    document.title = "Payment Success - Handcrafted Ceramic Mug | USD";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Payment successful for Handcrafted Ceramic Mug in USD.");
    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/payment-success";
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <section className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">Payment Success</h1>
        <p className="text-muted-foreground">Thank you for your purchase! A receipt was sent to your email.</p>
      </section>
    </main>
  );
};

export default PaymentSuccess;
