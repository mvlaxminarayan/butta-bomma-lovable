import logo from "@/assets/logo.png";
import { brandLettering } from "./brandLettering";

type Props = { size?: "md" | "lg" };

/** Preserve the sign painter's lettering and its integrated flourishes. */
const Lettering = ({ variant, className }: { variant: "left" | "right"; className: string }) => (
  <svg
    viewBox={brandLettering[variant].viewBox}
    aria-hidden="true"
    className={`block shrink-0 text-brand-script ${className}`}
    fill="currentColor"
  >
    <path
      d={brandLettering[variant].path}
      fillRule="evenodd"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {variant === "right" && (
      <path
        d="M60 152 C64 152 67 150 71 148"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    )}
    {variant === "left" && (
      <path
        d="M177 161 C181 168 190 171 198 162"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    )}
  </svg>
);

/** Simple lockup: బుట్ట [doll emblem] బొమ్మ — lettering, emblem and underlines only. */
export const BrandLogo = ({ size = "lg" }: Props) => {
  const left = size === "lg" ? "w-[64px] sm:w-[70px] md:w-[78px]" : "w-[64px] sm:w-[68px] md:w-[74px]";
  const right = size === "lg" ? "w-[82px] sm:w-[90px] md:w-[100px]" : "w-[82px] sm:w-[88px] md:w-[96px]";
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 leading-none"
      role="img"
      aria-label="బుట్ట బొమ్మ — Buttabomma Crafts"
    >
      <Lettering variant="left" className={left} />
      <img
        src={logo}
        alt="Buttabomma Crafts logo"
        className="h-14 w-14 md:h-16 md:w-16 object-contain rounded-full"
      />
      <Lettering variant="right" className={right} />
      <span className="ml-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/70 sm:text-xs">
        Crafts
      </span>
    </span>
  );
};
