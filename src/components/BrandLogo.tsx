import logo from "@/assets/logo.png";

type Props = { size?: "md" | "lg" };

/** Signboard-style lockup: బుట్ట [doll emblem] బొమ్మ, with HANDCRAFTS beneath. */
export const BrandLogo = ({ size = "lg" }: Props) => {
  const emblem = size === "lg" ? "h-16 w-16" : "h-14 w-14";
  const word = size === "lg" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl";
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="flex items-center gap-1.5">
        <span className={`font-telugu ${word} text-primary`} lang="te">బుట్ట</span>
        <img
          src={logo}
          alt="Buttabomma Handcrafts logo"
          className={`${emblem} object-contain rounded-full shadow-sm group-hover:shadow-md transition-all duration-300`}
        />
        <span className={`font-telugu ${word} text-primary`} lang="te">బొమ్మ</span>
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-[0.35em] text-muted-foreground font-semibold">
        Handcrafts
      </span>
    </span>
  );
};
