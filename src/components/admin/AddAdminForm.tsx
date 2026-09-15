"use client";

import { useState, useTransition } from "react";
import { addRestaurantAdmin } from "@/actions/super-admin";

const inputClass =
  "min-h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-purple focus:ring-4 focus:ring-purple/15";

export default function AddAdminForm({ restaurantId }: { restaurantId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await addRestaurantAdmin(restaurantId, { name, email, password });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "ok", text: `Compte créé pour ${email}.` });
      setName("");
      setEmail("");
      setPassword("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Nom</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink-soft">Mot de passe</label>
        <input required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-lg bg-purple px-4 text-sm font-extrabold text-white transition hover:bg-purple-dark disabled:opacity-60"
      >
        {isPending ? "Ajout…" : "Ajouter"}
      </button>
      {message && (
        <p className={"basis-full text-sm font-semibold " + (message.type === "ok" ? "text-emerald-600" : "text-red-600")}>
          {message.text}
        </p>
      )}
    </form>
  );
}
