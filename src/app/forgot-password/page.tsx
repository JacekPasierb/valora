"use client";

import Link from "next/link";
import {FormEvent, useState} from "react";
import {useRouter} from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import {ButtonSpinner} from "@/components/Loader";
import PasswordField from "@/components/PasswordField";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/recover/question", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email}),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nie udało się pobrać pytania.");
        setPending(false);
        return;
      }

      setQuestion(data.question);
      setStep("reset");
      setPending(false);
    } catch {
      setPending(false);
      setError("Błąd połączenia. Spróbuj ponownie.");
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/recover/reset", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, securityAnswer, newPassword}),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nie udało się zmienić hasła.");
        setPending(false);
        return;
      }

      setStep("done");
      setPending(false);
    } catch {
      setPending(false);
      setError("Błąd połączenia. Spróbuj ponownie.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f0ee_0%,_#f6f4ef_45%,_#efeae2_100%)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo size={72} />
          <p className="brand-mark mt-3 text-center text-3xl font-bold tracking-tight text-ink">
            Valora
          </p>
          <p className="mt-1 text-center text-sm text-muted">
            Odzyskiwanie hasła
          </p>
        </div>

        <div className="surface-strong rounded-[1.5rem] p-6 md:p-7">
          <h1 className="brand-mark mb-6 text-2xl font-bold text-ink">
            Nie pamiętam hasła
          </h1>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {step === "email" ? (
            <form onSubmit={handleLookup}>
              <label className="mb-6 block">
                <span className="mb-1.5 block text-sm text-muted">E-mail konta</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-accent-strong px-4 py-2.5 font-medium text-white transition hover:opacity-95 disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <ButtonSpinner />
                    Sprawdzam…
                  </>
                ) : (
                  "Dalej"
                )}
              </button>
            </form>
          ) : null}

          {step === "reset" ? (
            <form onSubmit={handleReset}>
              <p className="mb-4 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                  Pytanie pomocnicze
                </span>
                <span className="mt-1 block">{question}</span>
              </p>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-sm text-muted">Odpowiedź</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  autoComplete="off"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent"
                />
              </label>

              <PasswordField
                label="Nowe hasło (min. 8 znaków)"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                minLength={8}
              />

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-accent-strong px-4 py-2.5 font-medium text-white transition hover:opacity-95 disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <ButtonSpinner />
                    Zapisuję…
                  </>
                ) : (
                  "Ustaw nowe hasło"
                )}
              </button>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="space-y-4">
              <p className="rounded-xl border border-line bg-accent-soft/50 px-4 py-3 text-sm text-ink">
                Hasło zostało zmienione. Możesz się zalogować nowym hasłem.
              </p>
              <button
                type="button"
                onClick={() => router.push("/sign-in")}
                className="w-full rounded-xl bg-accent-strong px-4 py-2.5 font-medium text-white transition hover:opacity-95"
              >
                Przejdź do logowania
              </button>
            </div>
          ) : null}

          <p className="mt-5 text-center text-sm text-muted">
            <Link
              href="/sign-in"
              className="text-accent underline-offset-2 hover:underline"
            >
              Wróć do logowania
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
