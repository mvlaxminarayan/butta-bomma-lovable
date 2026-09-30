import PolicyPage, { PolicySection } from "@/components/PolicyPage";
import { STORE_INFO } from "@/lib/storeInfo";

const RefundPolicy = () => (
  <PolicyPage
    title="Cancellation &amp; Refund Policy"
    intro="We want you to love what you receive. If something is not right, here is how cancellations, returns and refunds work."
  >
    <PolicySection heading="Order Cancellation">
      <p>
        You can cancel an order free of charge any time before it is dispatched. Email us or send a
        WhatsApp message with your order number and we will cancel it and refund the full amount.
      </p>
      <p>Once a parcel has been handed to the courier, it can no longer be cancelled.</p>
    </PolicySection>

    <PolicySection heading="Damaged or Wrong Items">
      <p>
        If your item arrives damaged, broken or is not what you ordered, tell us within 5 days of
        delivery. Please send photos of the item and the packaging — an unboxing video helps us settle
        courier claims faster.
      </p>
      <p>We will send a replacement where possible, or refund you in full, including delivery charges.</p>
    </PolicySection>

    <PolicySection heading="Returns">
      <p>
        Unused items in their original packaging may be returned within 7 days of delivery. Return
        shipping is paid by the customer unless the item was damaged, defective or incorrect.
      </p>
      <p>
        These items cannot be returned unless damaged or defective: custom or personalised pieces, and
        items marked final sale.
      </p>
    </PolicySection>

    <PolicySection heading="A Note on Handmade Pieces">
      <p>
        Every item is made by hand. Small variations in colour, hand-painting, carving, grain, glaze and
        size are natural marks of handcraft and are not considered defects.
      </p>
    </PolicySection>

    <PolicySection heading="How Refunds Are Processed">
      <p>
        Approved refunds are issued to the original payment method (UPI, card, net banking or wallet)
        through Razorpay within 5–7 business days of approval. Your bank may take a few extra days to
        show the credit.
      </p>
    </PolicySection>

    <PolicySection heading="How to Raise a Request">
      <p>
        Email <a className="text-primary hover:underline" href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a> or
        call {STORE_INFO.phone} with your order number, the item concerned and photos where relevant. We
        respond within one business day.
      </p>
    </PolicySection>
  </PolicyPage>
);

export default RefundPolicy;
