"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionCookie, destroySessionCookie } from "@/lib/auth";

export type LoginResult = { ok: true; role: "SUPER_ADMIN" | "RESTAURANT_ADMIN" } | { ok: false; error: string };

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false, error: "Email et mot de passe requis." };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return { ok: false, error: "Identifiants incorrects." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Identifiants incorrects." };

  await createSessionCookie({
    sub: user.id,
    role: user.role,
    restaurantId: user.restaurantId,
    name: user.name,
    email: user.email,
  });

  return { ok: true, role: user.role };
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
