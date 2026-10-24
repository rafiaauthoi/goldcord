import { formatHours } from "../lib/sessions";

type BonusHoursProps = {
  completed: number;
  required: number;
};

export function bonusHours(completed: number, required: number) {
  return Math.max(0, completed - required);
}

export default function BonusHours({ completed, required }: BonusHoursProps) {
  const bonus = bonusHours(completed, required);
  if (bonus <= 0) return null;

  return (
    <p className="bonus-note">
      <svg className="bonus-star" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
      </svg>
      <span>
        <strong className="num">{formatHours(bonus)}</strong> of bonus service past your{" "}
        {required}-hour goal.
      </span>
    </p>
  );
}