import PolicyPage, { PolicySection } from "@/components/PolicyPage";
import { STORE_INFO } from "@/lib/storeInfo";

const Terms = () => (
  <PolicyPage
    title="Terms &amp; Conditions"
    intro={`These terms govern your use of ${STORE_INFO.name} and any purchase you make here. By placing an order you agree to them.`}
  >
    <PolicySection heading="About Us">
      <p>
        {STORE_INFO.name} is operated by {STORE_INFO.legalName}, {STORE_INFO.addressLines.join(", ")}.
      </p>
    </PolicySection>

    <PolicySection heading="Products and Descriptions">
      <p>
        We describe and photograph every piece as accurately as we can. Because items are handmade,
        colours, finishes and dimensions may vary slightly from the photographs, and screen colours can
        differ from the real product.
      </p>
    </PolicySection>

    <PolicySection heading="Pricing and Availability">
      <p>
        All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise.
        Prices and availability can change without notice. Many pieces are one of a kind; if an item
        sells out or a price is listed in error, we may cancel the order and refund you in full.
      </p>
    </PolicySection>

    <PolicySection heading="Orders and Acceptance">
      <p>
        Your order is an offer to buy. It is accepted only when we confirm it and dispatch the items. We
        may decline an order for reasons such as stock availability, an incomplete delivery address or a
        failed payment verification.
      </p>
    </PolicySection>

    <PolicySection heading="Payments">
      <p>
        Payments are processed securely by Razorpay. We never see or store your card, UPI or net banking
        credentials. Orders are dispatched only after payment is confirmed.
      </p>
    </PolicySection>

    <PolicySection heading="Shipping, Cancellations and Refunds">
      <p>
        Delivery timelines are set out in our Shipping &amp; Delivery Policy, and cancellations, returns
        and refunds in our Cancellation &amp; Refund Policy. Both form part of these terms.
      </p>
    </PolicySection>

    <PolicySection heading="Accounts">
      <p>
        You are responsible for keeping your account details and password secure and for activity that
        takes place under your account. Please tell us if you suspect unauthorised use.
      </p>
    </PolicySection>

    <PolicySection heading="Reviews, Questions and User Content">
      <p>
        Reviews and questions you post must be your own, lawful and respectful. We may remove content
        that is abusive, misleading, spam or infringes someone else's rights.
      </p>
    </PolicySection>

    <PolicySection heading="Intellectual Property">
      <p>
        All product photographs, designs, text and the store logo belong to {STORE_INFO.legalName} and
        may not be copied or used commercially without written permission.
      </p>
    </PolicySection>

    <PolicySection heading="Limitation of Liability">
      <p>
        To the extent permitted by law, our liability for any claim relating to an order is limited to
        the amount you paid for that order.
      </p>
    </PolicySection>

    <PolicySection heading="Governing Law">
      <p>
        These terms are governed by the laws of India, and the courts at our registered place of
        business have exclusive jurisdiction over any dispute.
      </p>
    </PolicySection>

    <PolicySection heading="Changes and Contact">
      <p>
        We may update these terms from time to time; the current version always appears on this page.
        Questions? Write to{" "}
        <a className="text-primary hover:underline" href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a>.
      </p>
    </PolicySection>
  </PolicyPage>
);

export default Terms;
