"use client";

import Link from "next/link";
import {signIn} from "next-auth/react";
import {FormEvent, useState} from "react";
import {useRouter} from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import PasswordField from "@/components/PasswordField";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Nieprawidłowy e-mail lub hasło.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f0ee_0%,_#f6f4ef_45%,_#efeae2_100%)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo size={72} />
          <p className="brand-mark mt-3 text-center text-3xl font-bold tracking-tight text-ink">
            Valora
          </p>
          <p className="mt-1 text-center text-sm text-muted">
            Zaloguj się do swojego portfela
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="surface-strong rounded-[1.5rem] p-6 md:p-7"
        >
          <h1 className="brand-mark mb-6 text-2xl font-bold text-ink">
            Logowanie
          </h1>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm text-muted">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent"
            />
          </label>

          <PasswordField
            label="Hasło"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent-strong px-4 py-2.5 font-medium text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {pending ? "Logowanie…" : "Zaloguj się"}
          </button>

          <p className="mt-4 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-accent underline-offset-2 hover:underline"
            >
              Nie pamiętam hasła
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-muted">
            Nie masz konta?{" "}
            <Link href="/sign-up" className="text-accent underline-offset-2 hover:underline">
              Załóż konto
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
