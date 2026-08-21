"use client";

const STEPS = [
  {
    title: "Wpłata złotówek na Revolut",
    summary: "Przelej PLN z konta bankowego na Revolut.",
    details: [
      "Otwórz aplikację Revolut i przejdź do konta w PLN.",
      "Wybierz Doładuj / Dodaj pieniądze i skopiuj dane do przelewu.",
      "Zrób przelew z banku na konto Revolut w złotówkach (np. 100 zł).",
      "Poczekaj, aż środki pojawią się na saldzie PLN w Revolut.",
    ],
    record: "W Valora zapiszesz: Wpłacono PLN.",
  },
  {
    title: "Zamiana PLN na EUR",
    summary: "Przewalutuj złotówki na euro w Revolut.",
    details: [
      "W Revolut wybierz Wymień / Exchange.",
      "Sprzedaj PLN i kup EUR (np. 100 zł → ok. 23 EUR).",
      "Zapisz kurs wymiany pokazany w aplikacji (PLN za 1 EUR).",
      "Sprawdź, ile dokładnie EUR otrzymałeś po przewalutowaniu.",
    ],
    record: "W Valora zapiszesz: Kurs EUR oraz Otrzymano EUR.",
  },
  {
    title: "Przelew EUR z Revolut na Kraken",
    summary: "Wyślij euro na giełdę Kraken bez zbędnych opłat.",
    details: [
      "Zaloguj się na Kraken i otwórz Funding / Deposit.",
      "Wybierz walutę EUR i metodę przelewu bankowego (SEPA).",
      "Skopiuj dane do przelewu z Krakena (IBAN, odbiorca, referencja).",
      "W Revolut wyślij przelew EUR dokładnie na te dane.",
      "Poczekaj, aż euro pojawi się na saldzie w Kraken (zwykle bez prowizji SEPA).",
    ],
    record: "Ta sama kwota EUR powinna dojść na Kraken, jeśli nie ma opłat.",
  },
  {
    title: "Zakup kryptowaluty na Kraken",
    summary: "Kup wybrane krypto za dostępne EUR.",
    details: [
      "Wejdź w Trade i wybierz parę, np. XRP/EUR, BTC/EUR, SOL/EUR.",
      "Ustaw zlecenie Market lub Limit na kwotę EUR, którą chcesz wydać.",
      "Potwierdź zakup i zapisz: cenę za 1 szt., kupioną ilość oraz prowizję.",
      "Prowizja jest osobno — nie odejmuj jej ręcznie od ilości z giełdy.",
    ],
    record:
      "W Valora: cena EUR, ilość z Krakena, prowizja EUR i data zakupu.",
  },
] as const;

type PurchaseGuideProps = {
  onAddTransaction?: () => void;
};

export default function PurchaseGuide({onAddTransaction}: PurchaseGuideProps) {
  return (
    <div className="space-y-6">
      <div className="surface-strong rounded-[1.5rem] p-6 md:p-8">
        <p className="section-label">Ścieżka zakupu</p>
        <h2 className="brand-mark mt-2 text-3xl font-bold text-ink">
          Revolut → EUR → Kraken → krypto
        </h2>
        <p className="mt-3 max-w-3xl text-muted">
          Krótka instrukcja całego przebiegu. Po zakupie dodaj transakcję w
          Valora, żeby średnia i pulpit były aktualne.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="surface rounded-[1.25rem] p-5 md:p-6"
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="brand-mark text-2xl font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1 text-muted">{step.summary}</p>

                <ul className="mt-4 space-y-2">
                  {step.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex gap-2 text-sm leading-relaxed text-ink"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">
                  <span className="font-semibold text-accent">Do zapisania: </span>
                  {step.record}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="surface-strong flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] p-5 md:p-6">
        <div>
          <p className="brand-mark text-xl font-bold text-ink">Gotowe?</p>
          <p className="mt-1 text-sm text-muted">
            Dodaj transakcję z danymi z Revolut i Krakena.
          </p>
        </div>
        {onAddTransaction && (
          <button
            type="button"
            onClick={onAddTransaction}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
          >
            Dodaj transakcję
          </button>
        )}
      </div>
    </div>
  );
}
