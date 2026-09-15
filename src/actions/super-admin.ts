"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/game";
import { revalidatePath } from "next/cache";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const DEFAULT_PRIZES = [
  { position: 0, label: "1 café offert", emoji: "☕", isWin: true, weight: 8 },
  { position: 1, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 20 },
  { position: 2, label: "-10% de réduction", emoji: "🏷️", isWin: true, weight: 14 },
  { position: 3, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 20 },
  { position: 4, label: "1 dessert offert", emoji: "🍰", isWin: true, weight: 8 },
  { position: 5, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 16 },
  { position: 6, label: "-10% de réduction", emoji: "🏷️", isWin: true, weight: 14 },
  { position: 7, label: "Rien cette fois", emoji: "🤞", isWin: false, weight: 20 },
];

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  return null;
}

export async function createRestaurantWithAdmin(input: {
  restaurantName: string;
  slug?: string;
  googleReviewUrl: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}): Promise<ActionResult<{ restaurantId: string }>> {
  await requireSuperAdmin();

  const restaurantName = input.restaurantName.trim();
  const googleReviewUrl = input.googleReviewUrl.trim();
  const adminName = input.adminName.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();

  if (!restaurantName) return { ok: false, error: "Le nom du restaurant est requis." };
  if (!/^https?:\/\//i.test(googleReviewUrl)) {
    return { ok: false, error: "Le lien d'avis Google doit être une URL valide." };
  }
  if (!adminName) return { ok: false, error: "Le nom du contact est requis." };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(adminEmail)) {
    return { ok: false, error: "Email invalide." };
  }
  const pwError = validatePassword(input.adminPassword);
  if (pwError) return { ok: false, error: pwError };

  const slug = slugify(input.slug?.trim() || restaurantName);
  if (!slug) return { ok: false, error: "Impossible de générer un identifiant pour ce restaurant." };

  const [existingSlug, existingEmail] = await Promise.all([
    prisma.restaurant.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email: adminEmail } }),
  ]);
  if (existingSlug) return { ok: false, error: "Cet identifiant de restaurant est déjà utilisé." };
  if (existingEmail) return { ok: false, error: "Cet email est déjà utilisé." };

  const passwordHash = await hashPassword(input.adminPassword);

  const restaurant = await prisma.$transaction(async (tx) => {
    const r = await tx.restaurant.create({
      data: { name: restaurantName, slug, googleReviewUrl },
    });
    await tx.prize.createMany({
      data: DEFAULT_PRIZES.map((p) => ({ ...p, restaurantId: r.id })),
    });
    await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "RESTAURANT_ADMIN",
        restaurantId: r.id,
      },
    });
    return r;
  });

  revalidatePath("/admin");
  return { ok: true, data: { restaurantId: restaurant.id } };
}

export async function setRestaurantActive(restaurantId: string, active: boolean): Promise<ActionResult> {
  await requireSuperAdmin();
  await prisma.restaurant.update({ where: { id: restaurantId }, data: { active } });
  revalidatePath("/admin");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  return { ok: true };
}

export async function addRestaurantAdmin(
  restaurantId: string,
  input: { name: string; email: string; password: string }
): Promise<ActionResult> {
  await requireSuperAdmin();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { ok: false, error: "Le nom est requis." };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return { ok: false, error: "Email invalide." };
  const pwError = validatePassword(input.password);
  if (pwError) return { ok: false, error: pwError };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Cet email est déjà utilisé." };

  const passwordHash = await hashPassword(input.password);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "RESTAURANT_ADMIN", restaurantId },
  });

  revalidatePath(`/admin/restaurants/${restaurantId}`);
  return { ok: true };
}
