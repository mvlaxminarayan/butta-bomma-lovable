// Business details shown in the footer and policy pages.
export const STORE_INFO = {
  name: "Buttabomma Shop",
  legalName: "Buttabomma Handcrafts",
  email: "support@buttabommahandcrafts.com",
  phone: "+91 85198 93747",
  whatsapp: "918519893747", // digits only, with country code
  instagram: "buttabomma_crafts",
  addressLines: [
    "Buttabomma Handcrafts",
    "GVR Complex, Shop #2, TTD Road",
    "Nandyal - 518501, Andhra Pradesh",
    "India",
  ],
  hours: "Monday to Saturday, 10:00 AM – 6:00 PM IST",
  lastUpdated: "8 October 2026",
};

export const instagramLink = () => `https://instagram.com/${STORE_INFO.instagram}`;

export const whatsappLink = (message = "Hello! I have a question about a product.") =>
  `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
