export default function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="11" r="7.5" fill="none" stroke="#c9a227" strokeWidth="3.5" />
      <rect x="12.5" y="17" width="7" height="4" rx="1.5" fill="#a9861a" />
      <path
        d="M13.5 21 L12 30 M16 21 L16 30.5 M18.5 21 L20 30"
        stroke="#c9a227"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}