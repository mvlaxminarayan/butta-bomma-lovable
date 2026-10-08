import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { STORE_INFO } from "@/lib/storeInfo";

interface PolicyPageProps {
  title: string;
  intro?: string;
  children: ReactNode;
}

export const PolicySection = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const PolicyPage = ({ title, intro, children }: PolicyPageProps) => {
  const { pathname } = useLocation();
  return (
  <div className="min-h-screen bg-background flex flex-col">
    <Seo
      title={title}
      description={intro ?? `${title} for Buttabomma Shop — handcrafted artisan goods from Nandyal, Andhra Pradesh.`}
      path={pathname}
    />
    <div className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: {STORE_INFO.lastUpdated}</p>
      {intro && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{intro}</p>}

      <div className="mt-8 space-y-7">{children}</div>
    </div>
    <Footer />
  </div>
);

export default PolicyPage;
