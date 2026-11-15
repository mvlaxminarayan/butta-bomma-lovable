// Real payment brand marks used in the footer. Visa and Mastercard artwork
// from simple-icons; RuPay and UPI drawn in their brand colors.

interface IconProps {
  className?: string;
}

export const VisaIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" role="img" aria-label="Visa" className={className}>
    <title>Visa</title>
    <path
      fill="#1A1F71"
      d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
    />
  </svg>
);

export const MastercardIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" role="img" aria-label="Mastercard" className={className}>
    <title>Mastercard</title>
    <circle cx="7.4" cy="12" r="7.4" fill="#EB001B" />
    <circle cx="16.6" cy="12" r="7.4" fill="#F79E1B" />
    <path
      fill="#FF5F00"
      d="M12 6.2a7.4 7.4 0 010 11.6 7.4 7.4 0 010-11.6z"
    />
  </svg>
);

export const RuPayIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" role="img" aria-label="RuPay" className={className}>
    <title>RuPay</title>
    <path fill="#F37021" d="M2 5h9.5L6 19H2z" />
    <path fill="#0B9444" d="M9.5 5H22l-9.5 14h-4.5z" opacity="0.9" />
    <path fill="#2B2E7A" d="M8 19h4.5l2-3h-4.5z" />
  </svg>
);

export const UpiIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" role="img" aria-label="UPI" className={className}>
    <title>UPI</title>
    <path fill="#097939" d="M3 4l7 8-7 8h4l7-8-7-8z" />
    <path fill="#ED752E" d="M11 4l7 8-7 8h4l7-8-7-8z" />
  </svg>
);
