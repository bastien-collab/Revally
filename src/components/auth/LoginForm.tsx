"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-ink-soft">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 rounded-xl border border-black/10 bg-white px-4 text-[15px] font-medium text-ink outline-none focus:border-purple focus:ring-4 focus:ring-purple/15"
          placeholder="vous@exemple.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-ink-soft">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-12 rounded-xl border border-black/10 bg-white px-4 text-[15px] font-medium text-ink outline-none focus:border-purple focus:ring-4 focus:ring-purple/15"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 min-h-12 rounded-xl bg-purple text-[15px] font-extrabold text-white shadow-[0_16px_34px_-16px_rgba(91,74,238,0.85)] transition hover:bg-purple-dark disabled:opacity-60"
      >
        {isPending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
