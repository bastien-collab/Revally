export function logoUrlFor(restaurant: { id: string; logoUpdatedAt: Date | null }): string | null {
  if (!restaurant.logoUpdatedAt) return null;
  return `/api/logo/${restaurant.id}?v=${restaurant.logoUpdatedAt.getTime()}`;
}
