import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PolicyPage, { PolicySection } from "@/components/PolicyPage";
import { STORE_INFO, whatsappLink } from "@/lib/storeInfo";

const Contact = () => (
  <PolicyPage
    title="Contact Us"
    intro="We are a small artisan studio and we answer every message ourselves. Reach out any time about a product, an order or a custom request."
  >
    <PolicySection heading="Business Details">
      <p><strong className="text-foreground">{STORE_INFO.legalName}</strong></p>
      <p className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />{STORE_INFO.addressLines.join(", ")}</p>
      <p className="flex gap-2"><Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />{STORE_INFO.hours}</p>
    </PolicySection>

    <PolicySection heading="Reach Us">
      <p className="flex gap-2">
        <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <a className="hover:text-primary" href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a>
      </p>
      <p className="flex gap-2">
        <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <a className="hover:text-primary" href={`tel:${STORE_INFO.phone.replace(/\s/g, "")}`}>{STORE_INFO.phone}</a>
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat on WhatsApp
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={`mailto:${STORE_INFO.email}`}>Email Us</a>
        </Button>
      </div>
    </PolicySection>

    <PolicySection heading="Response Time">
      <p>
        We reply to emails and WhatsApp messages within one business day. Messages received on Sundays
        and public holidays are answered on the next working day.
      </p>
    </PolicySection>

    <PolicySection heading="Order Enquiries">
      <p>
        For questions about an existing order, please keep your order number (it looks like BB-XXXXXXX)
        handy. You can also check the latest status any time on the Track Order page.
      </p>
    </PolicySection>
  </PolicyPage>
);

export default Contact;
