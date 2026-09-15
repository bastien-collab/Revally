import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Shell from "@/components/admin/Shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const restaurant = session?.restaurantId
    ? await prisma.restaurant.findUnique({ where: { id: session.restaurantId } })
    : null;

  return (
    <Shell
      eyebrow="Espace restaurant"
      title={restaurant?.name ?? ""}
      name={session?.name ?? ""}
      links={[
        { href: "/dashboard", label: "Tableau de bord" },
        { href: "/dashboard/settings", label: "Paramètres & roue" },
      ]}
    >
      {children}
    </Shell>
  );
}
