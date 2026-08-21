"use client";

import Link from "next/link";
import {signIn} from "next-auth/react";
import {FormEvent, useState} from "react";
import {useRouter} from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import PasswordField from "@/components/PasswordField";
import {SECURITY_QUESTIONS} from "@/data/securityQuestions";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestionId, setSecurityQuestionId] = useState(
    SECURITY_QUESTIONS[0].id,
  );
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          name,
          email,
          password,
          securityQuestionId,
          securityAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nie udało się utworzyć konta.");
        setPending(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setPending(false);

      if (result?.error) {
        setError(
          "Konto utworzone, ale logowanie nie powiodło się. Spróbuj się zalogować.",
        );
        router.push("/sign-in");
        return;
      }

      router.push("/");
      router.refresh();
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
            Utwórz konto i śledź portfel
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="surface-strong rounded-[1.5rem] p-6 md:p-7"
        >
          <h1 className="brand-mark mb-6 text-2xl font-bold text-ink">
            Rejestracja
          </h1>

          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm text-muted">Imię</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent"
            />
          </label>

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
            label="Hasło (min. 8 znaków)"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            className="mb-4"
          />

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm text-muted">
              Pytanie pomocnicze
            </span>
            <select
              required
              value={securityQuestionId}
              onChange={(e) => setSecurityQuestionId(e.target.value as typeof securityQuestionId)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent"
            >
              {SECURITY_QUESTIONS.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm text-muted">
              Odpowiedź pomocnicza
            </span>
            <input
              type="text"
              required
              minLength={2}
              autoComplete="off"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent"
            />
            <span className="mt-1.5 block text-xs text-muted">
              Zapamiętaj odpowiedź — posłuży do odzyskania hasła. Wielkość liter
              nie ma znaczenia.
            </span>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent-strong px-4 py-2.5 font-medium text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {pending ? "Tworzenie konta…" : "Załóż konto"}
          </button>

          <p className="mt-5 text-center text-sm text-muted">
            Masz już konto?{" "}
            <Link
              href="/sign-in"
              className="text-accent underline-offset-2 hover:underline"
            >
              Zaloguj się
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
