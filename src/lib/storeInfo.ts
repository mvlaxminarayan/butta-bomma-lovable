// Business details shown in the footer and policy pages.
// PLACEHOLDERS — replace with the real registered business details.
export const STORE_INFO = {
  name: "Buttabomma Shop",
  legalName: "Buttabomma Handicrafts",
  email: "support@buttabomma.in",
  phone: "+91 90000 00000",
  whatsapp: "919000000000", // digits only, with country code
  addressLines: [
    "Buttabomma Handicrafts",
    "Plot 12, Artisan Lane",
    "Hyderabad, Telangana 500001",
    "India",
  ],
  hours: "Monday to Saturday, 10:00 AM – 6:00 PM IST",
  lastUpdated: "30 September 2026",
};

export const whatsappLink = (message = "Hello! I have a question about a product.") =>
  `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
