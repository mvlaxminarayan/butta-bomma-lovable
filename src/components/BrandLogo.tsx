import logo from "@/assets/logo.png";

type Props = { size?: "md" | "lg" };

/** Hand-drawn flourishes under each Telugu word, modelled on the signboard. */
const Swash = ({ variant }: { variant: "left" | "right" }) => (
  <svg
    viewBox="0 0 120 18"
    aria-hidden="true"
    className="block w-full h-3 md:h-3.5 mt-1.5 overflow-visible text-brand-script"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    preserveAspectRatio="none"
  >
    {variant === "left" ? (
      <path d="M8 9 C 18 4, 30 4, 40 9 C 46 13, 55 12, 53 8 C 51 5, 45 9, 51 14 C 60 17, 76 10, 92 9" />
    ) : (
      <path d="M4 11 C 20 5, 36 5, 50 10 C 56 13, 63 12, 61 9 C 59 6, 54 10, 59 14 C 72 17, 96 13, 110 6 C 115 2, 120 3, 118 7" />
    )}
  </svg>
);

/** Signboard-style lockup: బుట్ట [doll emblem] బొమ్మ, framed like the shop board. */
export const BrandLogo = ({ size = "lg" }: Props) => {
  const emblem = size === "lg" ? "h-16 w-16" : "h-14 w-14";
  const word = size === "lg" ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl";
  return (
    <span className="inline-flex flex-col leading-none rounded-md bg-brand-script p-[3px] shadow-sm group-hover:shadow-md transition-shadow duration-300">
      {/* thin light line between the red frame and the lace band */}
      <span className="rounded-[5px] bg-background p-[2px]">
        {/* lace band */}
        <span className="flex flex-col items-center rounded-lg border-2 border-dotted border-brand-script/30 bg-card px-3 pt-1 pb-1">
          <span className="flex items-center gap-1.5">
            <span className="flex flex-col items-center">
              <span className={`font-telugu ${word} text-brand-script pb-1`} lang="te">బుట్ట</span>
              <Swash variant="left" />
            </span>
            <img
              src={logo}
              alt="Buttabomma Handcrafts logo"
              className={`${emblem} object-contain rounded-full`}
            />
            <span className="flex flex-col items-center">
              <span className={`font-telugu ${word} text-brand-script pb-1`} lang="te">బొమ్మ</span>
              <Swash variant="right" />
            </span>
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-[0.35em] text-brand-script/80 font-semibold">
            Handcrafts
          </span>
        </span>
      </span>
    </span>
  );
};
