import PolicyPage, { PolicySection } from "@/components/PolicyPage";
import { STORE_INFO } from "@/lib/storeInfo";

const Privacy = () => (
  <PolicyPage
    title="Privacy Policy"
    intro="We collect only what we need to take your order, deliver it and answer your questions. We never sell your information."
  >
    <PolicySection heading="What We Collect">
      <ul className="list-disc pl-5 space-y-1">
        <li>Name, email address, phone number and delivery address, to process and ship your order</li>
        <li>Your order history and any messages, reviews or questions you send us</li>
        <li>Account details (email and password) if you create an account</li>
        <li>Basic technical information such as browser type, used to keep the store working and secure</li>
      </ul>
    </PolicySection>

    <PolicySection heading="Payment Information">
      <p>
        Card, UPI, net banking and wallet details are entered directly into Razorpay's secure,
        PCI-DSS compliant payment window. We never see or store those details on our servers — we only
        receive confirmation that a payment succeeded and the amount paid.
      </p>
    </PolicySection>

    <PolicySection heading="How We Use Your Information">
      <ul className="list-disc pl-5 space-y-1">
        <li>To confirm, pack, ship and track your order</li>
        <li>To contact you about your order or a question you raised</li>
        <li>To handle cancellations, returns and refunds</li>
        <li>To meet our legal, tax and accounting obligations</li>
      </ul>
    </PolicySection>

    <PolicySection heading="Who We Share It With">
      <p>
        Only with those who help us complete your order: our courier partners (name, address, phone),
        Razorpay for payment processing, and our hosting and database provider where order data is
        stored. We do not sell or rent your information to anyone.
      </p>
    </PolicySection>

    <PolicySection heading="Cookies and Local Storage">
      <p>
        Your browser stores your cart, wishlist and sign-in session so the store works as you move
        between pages. Clearing your browser data removes them.
      </p>
    </PolicySection>

    <PolicySection heading="Data Retention">
      <p>
        Order records are kept as long as required for accounting and tax purposes. Account information
        is kept until you ask us to delete it.
      </p>
    </PolicySection>

    <PolicySection heading="Your Rights">
      <p>
        You can ask us for a copy of the information we hold about you, ask us to correct it, or ask us
        to delete your account and personal details, subject to records we must keep by law. Write to{" "}
        <a className="text-primary hover:underline" href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a>.
      </p>
    </PolicySection>

    <PolicySection heading="Children">
      <p>Our store is not intended for children under 18. We do not knowingly collect their information.</p>
    </PolicySection>

    <PolicySection heading="Contact">
      <p>
        {STORE_INFO.legalName}, {STORE_INFO.addressLines.join(", ")} — {STORE_INFO.email},{" "}
        {STORE_INFO.phone}.
      </p>
    </PolicySection>
  </PolicyPage>
);

export default Privacy;
