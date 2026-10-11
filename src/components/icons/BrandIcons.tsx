type P = { className?: string };

/** Official WhatsApp glyph in its brand green. */
export const WhatsAppIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#25D366" d="M12 .5C5.65.5.5 5.65.5 12c0 2.03.53 4.01 1.54 5.76L.5 23.5l5.9-1.55A11.45 11.45 0 0 0 12 23.5c6.35 0 11.5-5.15 11.5-11.5S18.35.5 12 .5Z"/>
    <path fill="#fff" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/>
  </svg>
);

/** Official Instagram glyph with its brand gradient. */
export const InstagramIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0" stopColor="#fdf497"/>
        <stop offset=".05" stopColor="#fdf497"/>
        <stop offset=".45" stopColor="#fd5949"/>
        <stop offset=".6" stopColor="#d6249f"/>
        <stop offset=".9" stopColor="#285AEB"/>
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
    <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.8"/>
    <circle cx="16.3" cy="7.7" r="1.05" fill="#fff"/>
  </svg>
);
