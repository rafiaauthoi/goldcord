const TAPE_PATH =
  "M0 3 L4 0 L8 3 L12 0 L16 3 L104 2 L108 0 L112 3 L116 0 L120 3 L120 25 L116 28 L112 25 L108 28 L104 25 L16 26 L12 28 L8 25 L4 28 L0 25Z";

const PERFORATION = [
  ...[8, 20, 32, 44, 56, 68, 80].flatMap((y) => [
    [0, y],
    [78, y],
  ]),
  ...[8, 20, 32, 44, 56, 68].flatMap((x) => [
    [x, 0],
    [x, 94],
  ]),
];

function Perforation() {
  return (
    <g fill="var(--paper)">
      {PERFORATION.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
      ))}
    </g>
  );
}

function Tape({ className, fill }: { className: string; fill: string }) {
  return (
    <svg className={`bit ${className}`} viewBox="0 0 120 28" aria-hidden="true" focusable="false">
      <path d={TAPE_PATH} fill={fill} />
    </svg>
  );
}

export default function ScrapbookBits() {
  return (
    <div className="bits" aria-hidden="true">
      <svg width="0" height="0" className="bits-defs" focusable="false">
        <defs>
          <pattern id="gc-stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#f4eedc" />
            <rect width="5" height="10" fill="#e6d7ae" />
          </pattern>
          <pattern id="gc-dot" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#e8eee6" />
            <circle cx="5" cy="5" r="1.8" fill="#9db3a3" />
          </pattern>
          <pattern id="gc-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#f3e7e2" />
            <rect width="8" height="1.5" fill="#c99a93" opacity="0.6" />
            <rect width="1.5" height="8" fill="#c99a93" opacity="0.6" />
          </pattern>
          <pattern id="gc-stars" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#8c93a8" />
            <path d="M6 2 l1.2 2.6 2.8.3-2.1 1.9.6 2.8L6 8.2 3.5 9.6l.6-2.8L2 4.9l2.8-.3z" fill="#efe5c6" />
          </pattern>
        </defs>
      </svg>

      <Tape className="bit-tape-a" fill="url(#gc-stripe)" />
      <Tape className="bit-tape-b" fill="url(#gc-dot)" />
      <Tape className="bit-tape-c" fill="url(#gc-grid)" />
      <Tape className="bit-tape-d" fill="url(#gc-stars)" />

      <svg className="bit bit-stamp-a" viewBox="0 0 78 94" focusable="false">
        <rect width="78" height="94" fill="#fffdf8" />
        <rect x="8" y="8" width="62" height="78" fill="#9db3a3" />
        <circle cx="52" cy="30" r="10" fill="#efe5c6" />
        <path d="M8 66 Q26 48 42 62 T70 56 V86 H8Z" fill="#7e9886" />
        <path d="M8 74 Q30 62 50 72 T70 70 V86 H8Z" fill="#d9c48e" />
        <text x="13" y="22" className="bit-serif" fontSize="13" fill="#fffdf8">
          20¢
        </text>
        <text x="39" y="82" className="bit-sans" fontSize="7" fill="#4a5270" textAnchor="middle">
          VOLUNTEER POST
        </text>
        <Perforation />
      </svg>

      <svg className="bit bit-stamp-b" viewBox="0 0 78 94" focusable="false">
        <rect width="78" height="94" fill="#fffdf8" />
        <rect x="8" y="8" width="62" height="78" fill="#c99a93" />
        <path d="M39 66 C16 49 20 30 33 32 C37 33 39 37 39 39 C39 37 41 33 45 32 C58 30 62 49 39 66Z" fill="#f4eedc" />
        <text x="13" y="22" className="bit-serif" fontSize="13" fill="#fffdf8">
          15¢
        </text>
        <text x="39" y="82" className="bit-sans" fontSize="7" fill="#fffdf8" textAnchor="middle">
          GIVE A LITTLE
        </text>
        <Perforation />
      </svg>

      <svg className="bit bit-star" viewBox="0 0 100 100" focusable="false">
        <path
          d="M50 4 L61 36 L95 37 L68 57 L78 90 L50 70 L22 90 L32 57 L5 37 L39 36Z"
          fill="#fffdf8"
          stroke="#fffdf8"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path d="M50 10 L59.5 38 L89 39 L65.5 56.5 L74 85 L50 68 L26 85 L34.5 56.5 L11 39 L40.5 38Z" fill="#d9c48e" />
        <text x="50" y="58" className="bit-serif" fontSize="13" fontWeight="600" fill="#4a5270" textAnchor="middle">
          gold star
        </text>
      </svg>

      <svg className="bit bit-seal" viewBox="0 0 100 100" focusable="false">
        <path
          d="M50 2 l5 6 7-3 3 7 8-1 1 8 7 1-1 8 7 3-3 7 6 5-6 5 3 7-7 3 1 8-7 1-1 8-8-1-3 7-7-3-5 6-5-6-7 3-3-7-8 1-1-8-7-1 1-8-7-3 3-7-6-5 6-5-3-7 7-3-1-8 7-1 1-8 8 1 3-7 7 3z"
          fill="#8c93a8"
        />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#efe5c6" strokeWidth="1.5" />
        <path id="gc-seal-ring" d="M50 22 a28 28 0 1 1 -0.1 0" fill="none" />
        <text className="bit-sans" fontSize="8.5" letterSpacing="2" fill="#efe5c6">
          <textPath href="#gc-seal-ring">GOOD DEEDS · CLASS OF HONORS ·</textPath>
        </text>
        <text x="50" y="58" className="bit-serif" fontSize="22" fill="#fffdf8" textAnchor="middle">
          20
        </text>
      </svg>

      <svg className="bit bit-ribbon" viewBox="0 0 130 44" focusable="false">
        <path d="M0 8 L14 8 L8 22 L14 36 L0 36Z M130 8 L116 8 L122 22 L116 36 L130 36Z" fill="#b08680" />
        <rect x="10" y="4" width="110" height="34" rx="2" fill="#c99a93" />
        <text x="65" y="27" className="bit-serif" fontStyle="italic" fontSize="17" fill="#fffdf8" textAnchor="middle">
          well done!
        </text>
      </svg>

      <svg className="bit bit-daisy" viewBox="0 0 100 100" focusable="false">
        <g fill="#fffdf8" stroke="#fffdf8" strokeWidth="6">
          <ellipse cx="50" cy="22" rx="13" ry="21" />
          <ellipse cx="50" cy="78" rx="13" ry="21" />
          <ellipse cx="22" cy="50" rx="21" ry="13" />
          <ellipse cx="78" cy="50" rx="21" ry="13" />
          <ellipse cx="30" cy="30" rx="13" ry="21" transform="rotate(-45 30 30)" />
          <ellipse cx="70" cy="70" rx="13" ry="21" transform="rotate(-45 70 70)" />
          <ellipse cx="70" cy="30" rx="13" ry="21" transform="rotate(45 70 30)" />
          <ellipse cx="30" cy="70" rx="13" ry="21" transform="rotate(45 30 70)" />
        </g>
        <g fill="#f4eedc">
          <ellipse cx="50" cy="22" rx="10" ry="18" />
          <ellipse cx="50" cy="78" rx="10" ry="18" />
          <ellipse cx="22" cy="50" rx="18" ry="10" />
          <ellipse cx="78" cy="50" rx="18" ry="10" />
        </g>
        <circle cx="50" cy="50" r="14" fill="#d9c48e" />
      </svg>

      <svg className="bit bit-ink" viewBox="0 0 110 110" focusable="false">
        <circle cx="55" cy="55" r="48" fill="none" stroke="var(--danger)" strokeWidth="4" />
        <circle cx="55" cy="55" r="38" fill="none" stroke="var(--danger)" strokeWidth="1.5" />
        <path id="gc-ink-ring" d="M55 25 a30 30 0 1 1 -0.1 0" fill="none" />
        <text className="bit-sans" fontSize="10" letterSpacing="3" fill="var(--danger)">
          <textPath href="#gc-ink-ring">HOURS LOGGED · HOURS LOGGED ·</textPath>
        </text>
        <text x="55" y="61" className="bit-serif" fontSize="16" fill="var(--danger)" textAnchor="middle">
          LHC
        </text>
      </svg>

      <p className="bit bit-sticky bit-sticky-a">
        due by
        <br />
        June 30!
      </p>
      <p className="bit bit-sticky bit-sticky-b">
        psst... grab the frame and give it a wiggle. Double-click for a swing.
      </p>
    </div>
  );
}