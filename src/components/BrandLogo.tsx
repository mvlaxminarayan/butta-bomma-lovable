import logo from "@/assets/logo.png";
import { useId } from "react";
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

/** Signboard-style lockup: బుట్ట [doll emblem] బొమ్మ, framed like the shop board. */
export const BrandLogo = ({ size = "lg" }: Props) => {
  const patternId = `brand-weave-${useId().replace(/:/g, "")}`;
  const emblem = size === "lg" ? "h-16 w-16" : "h-14 w-14";
  const left = size === "lg" ? "w-[68px] md:w-[78px]" : "w-[60px] md:w-[68px]";
  const right = size === "lg" ? "w-[88px] md:w-[100px]" : "w-[78px] md:w-[88px]";
  return (
    <span className="inline-flex shrink-0 flex-col leading-none rounded-md bg-brand-script p-[3px] shadow-sm group-hover:shadow-md transition-shadow duration-300">
      <span className="rounded-[5px] bg-background p-[2px]">
        <span className="relative flex flex-col items-center rounded-[4px] bg-card px-3 pt-2.5 pb-3.5">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-brand-script/50">
            <defs>
              <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M5 0 C12 4 -2 6 5 10 C12 6 -2 4 5 0Z" fill="none" stroke="currentColor" strokeWidth="0.65" />
              </pattern>
            </defs>
            <rect x="5" y="3" width="calc(100% - 10px)" height="6" fill={`url(#${patternId})`} />
            <rect x="5" y="calc(100% - 9px)" width="calc(100% - 10px)" height="6" fill={`url(#${patternId})`} />
            <rect x="3" y="9" width="6" height="calc(100% - 18px)" fill={`url(#${patternId})`} />
            <rect x="calc(100% - 9px)" y="9" width="6" height="calc(100% - 18px)" fill={`url(#${patternId})`} />
          </svg>
          <span className="flex items-center gap-1" role="img" aria-label="బుట్ట బొమ్మ">
            <Lettering variant="left" className={left} />
            <img
              src={logo}
              alt="Buttabomma Handcrafts logo"
              className={`${emblem} object-contain rounded-full`}
            />
            <Lettering variant="right" className={right} />
          </span>
          <span className="mt-1 text-[9px] leading-3 uppercase text-brand-script font-bold">
            Handcrafts
          </span>
        </span>
      </span>
    </span>
  );
};
