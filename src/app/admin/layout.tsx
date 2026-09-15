import { getSession } from "@/lib/auth";
import Shell from "@/components/admin/Shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <Shell
      eyebrow="Revally — super admin"
      title="Tous les restaurants"
      name={session?.name ?? ""}
      links={[{ href: "/admin", label: "Restaurants" }]}
    >
      {children}
    </Shell>
  );
}
