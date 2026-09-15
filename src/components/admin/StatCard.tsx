export default function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "purple" | "gold";
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_12px_rgba(26,23,48,0.04)]">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">{label}</div>
      <div
        className={
          "mt-2 text-[28px] font-extrabold tracking-tight " +
          (accent === "gold" ? "text-gold-dark" : accent === "purple" ? "text-purple" : "text-ink")
        }
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[13px] font-medium text-ink-soft">{hint}</div>}
    </div>
  );
}
