import "server-only";
import { getSession, type SessionPayload } from "@/lib/auth";

export class AuthError extends Error {}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated");
  return session;
}

export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") throw new AuthError("Not authorized");
  return session;
}

/** Super admins can access any restaurant; restaurant admins only their own. */
export async function requireRestaurantAccess(restaurantId: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role === "SUPER_ADMIN") return session;
  if (session.role === "RESTAURANT_ADMIN" && session.restaurantId === restaurantId) {
    return session;
  }
  throw new AuthError("Not authorized");
}
