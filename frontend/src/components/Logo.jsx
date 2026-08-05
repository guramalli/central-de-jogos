export default function Logo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="130,10 214,55 214,155 130,200 46,155 46,55"
        fill="#141b2e"
        stroke="#ffd166"
        strokeWidth="6"
      />
      <circle cx="130" cy="105" r="52" fill="#ff5d5d" />
      <text
        x="130"
        y="124"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="46"
        fontWeight="700"
        fill="#ffffff"
      >
        EG
      </text>
      <circle cx="200" cy="45" r="16" fill="#06d6a0" stroke="#141b2e" strokeWidth="3" />
      <path
        d="M193 45 L198 51 L208 38"
        fill="none"
        stroke="#06251c"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
