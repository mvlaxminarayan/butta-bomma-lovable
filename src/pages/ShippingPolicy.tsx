import { useEffect, useState } from "react";
import PolicyPage, { PolicySection } from "@/components/PolicyPage";
import { DEFAULT_SETTINGS, StoreSettings, fetchStoreSettings, formatINR } from "@/lib/pricing";
import { STORE_INFO } from "@/lib/storeInfo";

const ShippingPolicy = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    fetchStoreSettings()
      .then((s) => { if (!cancelled) setSettings(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <PolicyPage
      title="Shipping &amp; Delivery Policy"
      intro="Every piece is handmade, checked and packed by us before it leaves the studio. Here is exactly how and when your order reaches you."
    >
      <PolicySection heading="Dispatch Time">
        <p>
          Orders are packed and handed to the courier within 1–2 business days of payment confirmation.
          Made-to-order or custom pieces may take longer; we will inform you by email or WhatsApp if so.
        </p>
      </PolicySection>

      <PolicySection heading="Delivery Time">
        <p>Estimated delivery across India after dispatch:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Metro cities: 3–5 business days</li>
          <li>Other cities and towns: 5–7 business days</li>
          <li>Remote or hilly areas: up to 10 business days</li>
        </ul>
        <p>
          Delays caused by weather, strikes, festivals or other events outside our control may extend
          these timelines.
        </p>
      </PolicySection>

      <PolicySection heading="Shipping Charges">
        <p>
          A standard delivery charge of {formatINR(settings.shipping_fee)} applies to every order.
          {settings.free_shipping_threshold != null && (
            <> Delivery is free on orders above {formatINR(settings.free_shipping_threshold)}.</>
          )}
        </p>
        <p>The exact charge is always shown in your cart before you pay.</p>
      </PolicySection>

      <PolicySection heading="Courier Partners">
        <p>
          We ship with trusted Indian carriers such as India Post, Delhivery, DTDC and Blue Dart. The
          carrier is chosen based on the delivery pincode.
        </p>
      </PolicySection>

      <PolicySection heading="Order Tracking">
        <p>
          Once your parcel is handed over, we add the courier name and tracking number to your order.
          You can see it any time on the Track Order page using your order number and email address, or
          under My Orders if you have an account.
        </p>
      </PolicySection>

      <PolicySection heading="Packaging of Fragile Items">
        <p>
          Terracotta, ceramic and wooden pieces are wrapped in protective layers and packed in rigid
          boxes with cushioning. If a parcel still arrives damaged, please see our Cancellation &amp;
          Refund Policy — we replace or refund damaged items.
        </p>
      </PolicySection>

      <PolicySection heading="Incorrect Addresses &amp; Failed Deliveries">
        <p>
          Please double-check your address and phone number at checkout. If a parcel is returned to us
          because the address was incomplete or nobody was available after repeated attempts, we will
          contact you to re-ship it; re-shipping charges may apply.
        </p>
      </PolicySection>

      <PolicySection heading="International Shipping">
        <p>We currently deliver within India only.</p>
      </PolicySection>

      <PolicySection heading="Questions">
        <p>
          Write to us at <a className="text-primary hover:underline" href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a> or
          call {STORE_INFO.phone} during {STORE_INFO.hours}.
        </p>
      </PolicySection>
    </PolicyPage>
  );
};

export default ShippingPolicy;
