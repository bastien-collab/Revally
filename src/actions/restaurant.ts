"use server";

import { prisma } from "@/lib/prisma";
import { requireRestaurantAccess } from "@/lib/authz";
import { LOSE_LABEL, LOSE_EMOJI, isPrizeSlot } from "@/lib/wheel-visuals";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateRestaurantSettings(
  restaurantId: string,
  data: {
    name: string;
    googleReviewUrl: string;
    unlockDelay: number;
    confettiEnabled: boolean;
  }
): Promise<ActionResult> {
  await requireRestaurantAccess(restaurantId);

  const name = data.name.trim();
  const googleReviewUrl = data.googleReviewUrl.trim();
  if (!name) return { ok: false, error: "Le nom est requis." };
  if (!/^https?:\/\//i.test(googleReviewUrl)) {
    return { ok: false, error: "Le lien d'avis Google doit être une URL valide." };
  }
  const unlockDelay = Math.max(0, Math.min(30, Math.round(data.unlockDelay)));

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { name, googleReviewUrl, unlockDelay, confettiEnabled: data.confettiEnabled },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  return { ok: true };
}

export type PrizeInput = { position: number; label: string; emoji: string; weight: number };

export async function updatePrizes(restaurantId: string, prizes: PrizeInput[]): Promise<ActionResult> {
  await requireRestaurantAccess(restaurantId);

  if (prizes.length !== 8) return { ok: false, error: "La roue doit avoir exactement 8 cases." };

  await prisma.$transaction(
    prizes.map((p) => {
      const win = isPrizeSlot(p.position);
      const weight = Math.max(1, Math.min(100, Math.round(p.weight)));
      return prisma.prize.update({
        where: { restaurantId_position: { restaurantId, position: p.position } },
        data: win
          ? {
              label: p.label.trim().slice(0, 40) || "Lot",
              emoji: p.emoji.trim().slice(0, 8) || "🎁",
              weight,
              isWin: true,
            }
          : {
              label: LOSE_LABEL,
              emoji: LOSE_EMOJI,
              weight,
              isWin: false,
            },
      });
    })
  );

  revalidatePath("/dashboard/settings");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  return { ok: true };
}

export async function setPlayRedeemed(playId: string, redeemed: boolean): Promise<ActionResult> {
  const play = await prisma.play.findUnique({ where: { id: playId } });
  if (!play) return { ok: false, error: "Introuvable." };
  await requireRestaurantAccess(play.restaurantId);

  await prisma.play.update({
    where: { id: playId },
    data: { redeemed, redeemedAt: redeemed ? new Date() : null },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/admin/restaurants/${play.restaurantId}`);
  return { ok: true };
}
