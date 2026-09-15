import RedeemToggle from "@/components/admin/RedeemToggle";

type PlayRow = {
  id: string;
  won: boolean;
  code: string | null;
  email: string | null;
  optin: boolean;
  redeemed: boolean;
  createdAt: Date;
  prize: { label: string; emoji: string } | null;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function PlaysTable({ plays, editable }: { plays: PlayRow[]; editable: boolean }) {
  if (plays.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-sm font-medium text-ink-mute">
        Aucune participation pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(26,23,48,0.04)]">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] text-[11px] font-bold uppercase tracking-wider text-ink-mute">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Résultat</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Opt-in</th>
            {editable && <th className="px-4 py-3">Statut</th>}
          </tr>
        </thead>
        <tbody>
          {plays.map((p) => (
            <tr key={p.id} className="border-b border-black/[0.04] last:border-0">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-soft">
                {dateFormatter.format(p.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {p.won ? (
                  <span className="font-semibold text-ink">
                    {p.prize?.emoji} {p.prize?.label}
                  </span>
                ) : (
                  <span className="font-medium text-ink-mute">Perdu</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-ink">{p.code ?? "—"}</td>
              <td className="px-4 py-3 text-ink-soft">{p.email ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-3">
                {p.email ? (p.optin ? "Oui" : "Non") : "—"}
              </td>
              {editable && (
                <td className="whitespace-nowrap px-4 py-3">
                  {p.won ? <RedeemToggle playId={p.id} redeemed={p.redeemed} /> : "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
