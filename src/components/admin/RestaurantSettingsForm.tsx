"use client";

import { useState, useTransition } from "react";
import { updateRestaurantSettings } from "@/actions/restaurant";

const inputClass =
  "min-h-11 rounded-xl border border-black/10 bg-white px-3.5 text-sm font-semibold text-ink outline-none focus:border-purple focus:ring-4 focus:ring-purple/15";

type Settings = {
  name: string;
  googleReviewUrl: string;
  unlockDelay: number;
  confettiEnabled: boolean;
};

export default function RestaurantSettingsForm({
  restaurantId,
  initial,
}: {
  restaurantId: string;
  initial: Settings;
}) {
  const [values, setValues] = useState<Settings>(initial);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateRestaurantSettings(restaurantId, values);
      setMessage(result.ok ? { type: "ok", text: "Paramètres enregistrés." } : { type: "error", text: result.error });
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Nom du restaurant">
        <input
          type="text"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className={inputClass}
        />
      </Field>

      <Field label="Lien de l'avis Google" hint="Lien 'Laisser un avis' de la fiche Google du restaurant.">
        <input
          type="url"
          required
          value={values.googleReviewUrl}
          onChange={(e) => setValues((v) => ({ ...v, googleReviewUrl: e.target.value }))}
          className={inputClass}
        />
      </Field>

      <Field label="Délai avant de pouvoir jouer (secondes)" hint="Le temps laissé pour vraiment poster l'avis avant de débloquer la roue.">
        <input
          type="number"
          min={0}
          max={30}
          value={values.unlockDelay}
          onChange={(e) => setValues((v) => ({ ...v, unlockDelay: Number(e.target.value) || 0 }))}
          className={inputClass + " w-28"}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <input
          type="checkbox"
          checked={values.confettiEnabled}
          onChange={(e) => setValues((v) => ({ ...v, confettiEnabled: e.target.checked }))}
          className="h-4 w-4 accent-purple"
        />
        Confettis à la victoire
      </label>

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
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink-soft">{label}</label>
      {children}
      {hint && <p className="text-xs font-medium text-ink-mute">{hint}</p>}
    </div>
  );
}
