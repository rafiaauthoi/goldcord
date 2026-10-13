import { useId } from "react";

type CordProps = {
  value: number;
  max: number;
  label: string;
};

const START = 14;
const END = 556;
const TOP = 14;
const HEIGHT = 18;

export default function Cord({ value, max, label }: CordProps) {
  const id = useId().replace(/:/g, "");
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const complete = ratio >= 1;
  const fillWidth = (END - START) * ratio;
  const tasselColor = complete ? "var(--gold)" : "var(--line)";
  const tasselShade = complete ? "var(--gold-shade)" : "#cbbfa5";
  const strands = [-8, -4, 0, 4, 8];

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value * 100) / 100}
    >
      <svg className="cord" viewBox="0 0 600 84" aria-hidden="true" focusable="false">
        <defs>
          <pattern id={`gold-${id}`} width="12" height={HEIGHT} patternUnits="userSpaceOnUse" y={TOP}>
            <rect width="12" height={HEIGHT} fill="var(--gold)" />
            <polygon points="0,9 5,0 9,0 4,9" fill="var(--gold-shade)" />
            <polygon points="4,9 9,18 5,18 0,9" fill="var(--gold-shade)" opacity="0.55" />
          </pattern>
          <pattern id={`bare-${id}`} width="12" height={HEIGHT} patternUnits="userSpaceOnUse" y={TOP}>
            <rect width="12" height={HEIGHT} fill="var(--paper-deep)" />
            <polygon points="0,9 5,0 9,0 4,9" fill="var(--line)" />
            <polygon points="4,9 9,18 5,18 0,9" fill="var(--line)" opacity="0.55" />
          </pattern>
          <clipPath id={`rope-${id}`}>
            <rect x={START} y={TOP} width={END - START} height={HEIGHT} rx={HEIGHT / 2} />
          </clipPath>
        </defs>

        <g clipPath={`url(#rope-${id})`}>
          <rect x={START} y={TOP} width={END - START} height={HEIGHT} fill={`url(#bare-${id})`} />
          {fillWidth > 0 && (
            <rect
              className="cord-fill"
              x={START}
              y={TOP}
              width={fillWidth}
              height={HEIGHT}
              fill={`url(#gold-${id})`}
            />
          )}
        </g>

        <circle cx={START} cy={TOP + HEIGHT / 2} r="11" fill={ratio > 0 ? "var(--gold-shade)" : "var(--line)"} />

        <g className={`cord-tassel${complete ? " complete" : ""}`}>
          <path
            d={`M${END - 4} ${TOP + HEIGHT / 2} C ${END + 18} ${TOP + 2}, ${END + 26} ${TOP + 14}, ${END + 22} ${TOP + 26}`}
            fill="none"
            stroke={tasselColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <rect x={END + 14} y={TOP + 24} width="16" height="10" rx="3" fill={tasselShade} />
          {strands.map((offset) => (
            <line
              key={offset}
              x1={END + 22 + offset * 0.6}
              y1={TOP + 34}
              x2={END + 22 + offset}
              y2={TOP + 64}
              stroke={tasselColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}