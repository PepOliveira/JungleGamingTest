export function ThankYouIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 34 32 14l24 20v34a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V34Z" />
      <path d="M8 34 32 54l24-20" />
      <rect x="18" y="4" width="28" height="30" rx="4" fill="#241612" />
      <text
        x="32"
        y="17"
        textAnchor="middle"
        fontSize="8"
        fontWeight="800"
        fill="currentColor"
        stroke="none"
        fontFamily="inherit"
      >
        THANK
      </text>
      <text
        x="32"
        y="28"
        textAnchor="middle"
        fontSize="8"
        fontWeight="800"
        fill="currentColor"
        stroke="none"
        fontFamily="inherit"
      >
        YOU
      </text>
    </svg>
  )
}
