import Link from "next/link";
import { getGlobalOverview, getAllRestaurantsOverview } from "@/lib/stats";
import StatCard from "@/components/admin/StatCard";
import ActiveToggle from "@/components/admin/ActiveToggle";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default async function AdminHomePage() {
  const [overview, restaurants] = await Promise.all([getGlobalOverview(), getAllRestaurantsOverview()]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Vue d&apos;ensemble</h1>
        <Link
          href="/admin/restaurants/new"
          className="rounded-xl bg-purple px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_-12px_rgba(91,74,238,0.85)] transition hover:bg-purple-dark"
        >
          + Nouveau restaurant
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Restaurants" value={String(overview.totalRestaurants)} hint={`${overview.activeRestaurants} actifs`} />
        <StatCard label="Parties jouées" value={String(overview.totalPlays)} accent="purple" />
        <StatCard label="Lots gagnés" value={String(overview.totalWins)} accent="gold" />
        <StatCard
          label="Taux de gain"
          value={overview.totalPlays > 0 ? `${Math.round((overview.totalWins / overview.totalPlays) * 100)}%` : "—"}
        />
        <StatCard label="Emails collectés" value={String(overview.totalOptins)} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-extrabold text-ink">Restaurants</h2>
        {restaurants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-sm font-medium text-ink-mute">
            Aucun restaurant pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(26,23,48,0.04)]">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] text-[11px] font-bold uppercase tracking-wider text-ink-mute">
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Parties</th>
                  <th className="px-4 py-3">Lots gagnés</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/restaurants/${r.id}`} className="font-bold text-ink hover:text-purple">
                        {r.name}
                      </Link>
                      <div className="text-xs font-medium text-ink-mute">/r/{r.slug}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-soft">{r.totalPlays}</td>
                    <td className="px-4 py-3 font-semibold text-ink-soft">{r.totalWins}</td>
                    <td className="px-4 py-3 font-medium text-ink-mute">{dateFormatter.format(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <ActiveToggle restaurantId={r.id} active={r.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
