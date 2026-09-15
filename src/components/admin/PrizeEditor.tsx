"use client";

import { useState, useTransition } from "react";
import { updatePrizes, type PrizeInput } from "@/actions/restaurant";

type Prize = { position: number; label: string; emoji: string; isWin: boolean; weight: number };

export default function PrizeEditor({ restaurantId, initialPrizes }: { restaurantId: string; initialPrizes: Prize[] }) {
  const [prizes, setPrizes] = useState<Prize[]>(
    [...initialPrizes].sort((a, b) => a.position - b.position)
  );
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(position: number, patch: Partial<Prize>) {
    setPrizes((prev) => prev.map((p) => (p.position === position ? { ...p, ...patch } : p)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const payload: PrizeInput[] = prizes.map((p) => ({
      position: p.position,
      label: p.label,
      emoji: p.emoji,
      weight: p.weight,
    }));
    startTransition(async () => {
      const result = await updatePrizes(restaurantId, payload);
      setMessage(result.ok ? { type: "ok", text: "Roue mise à jour." } : { type: "error", text: result.error });
    });
  }

  const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-sm font-medium text-ink-soft">
        La roue garde toujours 8 cases, dont 4 gagnantes en alternance — c&apos;est ce que montre le design. Vous
        pouvez changer le lot de chaque case gagnante, et ajuster les chances de chaque case (plus le nombre est
        élevé, plus la case sort souvent).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {prizes.map((p) => (
          <div
            key={p.position}
            className={
              "rounded-2xl border p-4 " +
              (p.isWin ? "border-gold/40 bg-gold/[0.06]" : "border-black/[0.06] bg-black/[0.015]")
            }
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                Case {p.position + 1}
              </span>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[11px] font-bold " +
                  (p.isWin ? "bg-gold/20 text-gold-dark" : "bg-black/[0.06] text-ink-mute")
                }
              >
                {p.isWin ? "Gagnante" : "Perdante"}
              </span>
            </div>

            {p.isWin ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={p.emoji}
                  onChange={(e) => update(p.position, { emoji: e.target.value })}
                  maxLength={4}
                  className="w-14 min-h-10 rounded-lg border border-black/10 bg-white px-2 text-center text-lg outline-none focus:border-purple"
                  aria-label="Emoji"
                />
                <input
                  type="text"
                  value={p.label}
                  onChange={(e) => update(p.position, { label: e.target.value })}
                  maxLength={40}
                  className="min-h-10 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold outline-none focus:border-purple"
                  aria-label="Lot"
                />
              </div>
            ) : (
              <div className="min-h-10 flex items-center rounded-lg border border-dashed border-black/10 bg-white px-3 text-sm font-semibold text-ink-mute">
                🤞 Rien cette fois
              </div>
            )}

            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-soft">
              Chances relatives
              <input
                type="number"
                min={1}
                max={100}
                value={p.weight}
                onChange={(e) => update(p.position, { weight: Number(e.target.value) || 1 })}
                className="min-h-8 w-20 rounded-lg border border-black/10 bg-white px-2 text-sm outline-none focus:border-purple"
              />
              <span className="text-ink-mute">
                ≈ {totalWeight > 0 ? Math.round((p.weight / totalWeight) * 100) : 0}%
              </span>
            </label>
          </div>
        ))}
      </div>

      {message && (
        <p className={"text-sm font-semibold " + (message.type === "ok" ? "text-emerald-600" : "text-red-600")}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-xl bg-purple px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_-12px_rgba(91,74,238,0.85)] transition hover:bg-purple-dark disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer la roue"}
      </button>
    </form>
  );
}
