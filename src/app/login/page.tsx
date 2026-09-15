import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-lavender px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/assets/revally-icon.png"
            alt="Revally"
            width={44}
            height={44}
            className="rounded-xl"
          />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
            Back-office Revally
          </h1>
          <p className="mt-1.5 text-[15px] font-medium text-ink-soft">
            Connectez-vous pour accéder à votre espace.
          </p>
        </div>

        <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(26,23,48,0.06)]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
