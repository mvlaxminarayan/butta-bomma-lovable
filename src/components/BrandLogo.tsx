import logo from "@/assets/logo.png";

type Props = { size?: "md" | "lg" };

/** Hand-drawn swash that sits under each Telugu word, like the signboard. */
const Swash = ({ flip = false }: { flip?: boolean }) => (
  <svg
    viewBox="0 0 120 14"
    aria-hidden="true"
    className={`block w-full h-2.5 md:h-3 text-brand-script ${flip ? "-scale-x-100" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    preserveAspectRatio="none"
  >
    <path d="M4 7 C 22 2, 38 12, 58 7 S 94 2, 108 7" />
    <path d="M108 7 C 116 9, 117 3, 112 3 C 108 3, 109 8, 113 8" />
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
              <span className={`font-telugu ${word} text-brand-script`} lang="te">బుట్ట</span>
              <Swash />
            </span>
            <img
              src={logo}
              alt="Buttabomma Handcrafts logo"
              className={`${emblem} object-contain rounded-full`}
            />
            <span className="flex flex-col items-center">
              <span className={`font-telugu ${word} text-brand-script`} lang="te">బొమ్మ</span>
              <Swash flip />
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
