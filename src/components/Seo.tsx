import { Helmet } from "react-helmet-async";

export const SITE_NAME = "Buttabomma Shop";
export const SITE_URL = "https://buttabommahandcrafts.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}

const Seo = ({ title, description, path, image, jsonLd }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image ?? DEFAULT_OG_IMAGE} />
      <meta name="twitter:image" content={image ?? DEFAULT_OG_IMAGE} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};

export default Seo;
