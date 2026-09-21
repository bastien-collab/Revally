"use client";

import { useRef, useState, useTransition } from "react";
import { uploadRestaurantLogo, removeRestaurantLogo } from "@/actions/restaurant";

export default function LogoUploadForm({
  restaurantId,
  logoUrl,
}: {
  restaurantId: string;
  logoUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [hasLogo, setHasLogo] = useState(!!logoUrl);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("logo", file);
    startTransition(async () => {
      const result = await uploadRestaurantLogo(restaurantId, formData);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        setPreview(null);
        return;
      }
      setHasLogo(true);
      setMessage({ type: "ok", text: "Logo mis à jour." });
    });
  }

  function onRemove() {
    setMessage(null);
    startTransition(async () => {
      const result = await removeRestaurantLogo(restaurantId);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setHasLogo(false);
      setPreview(null);
      setMessage({ type: "ok", text: "Logo supprimé." });
    });
  }

  const displayUrl = preview ?? (hasLogo ? logoUrl : null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-ink-soft">
        Affiché en haut de la roue, à la place du bloc &laquo;&nbsp;LOGO RESTO&nbsp;&raquo;. PNG, JPEG, WEBP ou SVG,
        2&nbsp;Mo max.
      </p>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02]">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-mute">Aucun logo</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-extrabold text-ink-soft transition hover:border-black/20 hover:text-ink disabled:opacity-60"
            >
              {isPending ? "Envoi…" : hasLogo ? "Changer le logo" : "Ajouter un logo"}
            </button>
            {hasLogo && (
              <button
                type="button"
                disabled={isPending}
                onClick={onRemove}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-extrabold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-60"
              >
                Supprimer
              </button>
            )}
          </div>
          {message && (
            <p className={"text-sm font-semibold " + (message.type === "ok" ? "text-emerald-600" : "text-red-600")}>
              {message.text}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}
