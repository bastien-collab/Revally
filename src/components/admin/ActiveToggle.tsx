"use client";

import { useTransition } from "react";
import { setRestaurantActive } from "@/actions/super-admin";

export default function ActiveToggle({ restaurantId, active }: { restaurantId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => { await setRestaurantActive(restaurantId, !active); })}
      className={
        "rounded-full px-3 py-1 text-xs font-bold transition disabled:opacity-50 " +
        (active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-black/[0.06] text-ink-mute hover:bg-black/10")
      }
    >
      {active ? "Actif" : "Désactivé"}
    </button>
  );
}
