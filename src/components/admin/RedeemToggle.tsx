"use client";

import { useTransition } from "react";
import { setPlayRedeemed } from "@/actions/restaurant";

export default function RedeemToggle({ playId, redeemed }: { playId: string; redeemed: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => { await setPlayRedeemed(playId, !redeemed); })}
      className={
        "rounded-full px-3 py-1 text-xs font-bold transition disabled:opacity-50 " +
        (redeemed
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-gold/15 text-gold-dark hover:bg-gold/25")
      }
    >
      {redeemed ? "Récupéré ✓" : "Marquer récupéré"}
    </button>
  );
}
