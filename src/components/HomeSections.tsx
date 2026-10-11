import { Hand, Leaf, Users, Truck } from "lucide-react";

const trust = [
  { icon: Hand, title: "100% Handcrafted", text: "Made by hand in Nandyal" },
  { icon: Leaf, title: "Natural Wood & Dyes", text: "Eco-friendly materials" },
  { icon: Users, title: "Direct from Artisans", text: "Fair pay, no middlemen" },
  { icon: Truck, title: "Pan-India Shipping", text: "Free over ₹999" },
];

export const TrustBar = () => (
  <section aria-label="Why shop with us" className="border-y border-border bg-muted/40">
    <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
      {trust.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
          <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>
        </div>
      ))}
    </div>
  </section>
);

export const StoryTeaser = () => (
  <section className="container mx-auto px-4 py-12 text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our heritage</p>
    <blockquote className="mx-auto mt-3 max-w-2xl font-serif text-2xl leading-snug md:text-3xl">
      “Every Buttabomma is shaped, painted and finished by hand — a craft passed down through generations.”
    </blockquote>
    <button
      onClick={() => document.getElementById("our-story")?.scrollIntoView({ behavior: "smooth" })}
      className="mt-5 text-sm font-medium text-primary underline underline-offset-4"
    >Read our story</button>
  </section>
);

const cats = ["Kondapalli Toys", "Wooden Crafts", "Home Decor", "Ceramics", "Textiles", "Gifts"];

export const CategoryTiles = ({ onPick }: { onPick: (c: string) => void }) => (
  <section aria-label="Shop by category" className="container mx-auto px-4 py-10">
    <h2 className="mb-6 text-center font-serif text-2xl">Shop by Category</h2>
    <div className="flex gap-6 overflow-x-auto pb-2 md:justify-center">
      {cats.map((c, i) => (
        <button key={c} onClick={() => onPick(c)} className="group flex shrink-0 flex-col items-center gap-2">
          <span className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 text-2xl font-serif text-primary transition group-hover:border-primary md:h-24 md:w-24 ${i % 2 ? "bg-accent/20" : "bg-primary/10"}`}>
            {c[0]}
          </span>
          <span className="text-xs font-medium md:text-sm">{c}</span>
        </button>
      ))}
    </div>
  </section>
);
