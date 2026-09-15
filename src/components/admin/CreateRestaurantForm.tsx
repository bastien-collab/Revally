"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRestaurantWithAdmin } from "@/actions/super-admin";

const inputClass =
  "min-h-11 rounded-xl border border-black/10 bg-white px-3.5 text-sm font-semibold text-ink outline-none focus:border-purple focus:ring-4 focus:ring-purple/15";

export default function CreateRestaurantForm() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRestaurantWithAdmin({
        restaurantName,
        googleReviewUrl,
        adminName,
        adminEmail,
        adminPassword,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/restaurants/${result.data!.restaurantId}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5">
        <legend className="px-1 text-sm font-extrabold text-ink">Restaurant</legend>
        <Field label="Nom du restaurant">
          <input
            required
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className={inputClass}
            placeholder="Bella Vista"
          />
        </Field>
        <Field label="Lien de l'avis Google" hint="Lien 'Laisser un avis' de la fiche Google du restaurant.">
          <input
            required
            type="url"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            className={inputClass}
            placeholder="https://search.google.com/local/writereview?..."
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5">
        <legend className="px-1 text-sm font-extrabold text-ink">Compte administrateur du restaurant</legend>
        <Field label="Nom du contact">
          <input required value={adminName} onChange={(e) => setAdminName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email de connexion">
          <input
            required
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Mot de passe" hint="Au moins 8 caractères — communiquez-le au restaurant.">
          <input
            required
            type="text"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
      </fieldset>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-xl bg-purple px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_-12px_rgba(91,74,238,0.85)] transition hover:bg-purple-dark disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer le restaurant"}
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
