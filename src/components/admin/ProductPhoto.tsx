import { ImageIcon } from "lucide-react";

export default function ProductPhoto({ src, alt, className }: { src?: string; alt: string; className: string }) {
  return src ? (
    <img src={src} alt={alt} className={`${className} bg-muted`} />
  ) : (
    <div role="img" aria-label={`Photo pending: ${alt}`} className={`${className} bg-muted flex items-center justify-center text-muted-foreground`}>
      <ImageIcon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}