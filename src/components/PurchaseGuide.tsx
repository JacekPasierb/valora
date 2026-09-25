"use client";

import {useState} from "react";

const PURCHASE_STEPS = [
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

type GuideTab = "purchase" | "sell" | "metrics";

type PurchaseGuideProps = {
  onAddTransaction?: () => void;
};

export default function PurchaseGuide({onAddTransaction}: PurchaseGuideProps) {
  const [tab, setTab] = useState<GuideTab>("purchase");

  return (
    <div className="space-y-6">
      <div className="surface-strong rounded-[1.5rem] p-6 md:p-8">
        <p className="section-label">Poradnik Valora</p>
        <h2 className="brand-mark mt-2 text-3xl font-bold text-ink">
          Zakup, sprzedaż i odzyskanie kapitału
        </h2>
        <p className="mt-3 max-w-3xl text-muted">
          Jak kupować przez Revolut i Kraken, kiedy sprzedawać część pozycji oraz
          co oznaczają liczby na pulpicie — w tym pula „Odzyskane”.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-paper p-1">
        {(
          [
            {id: "purchase" as const, label: "Zakup"},
            {id: "sell" as const, label: "Sprzedaż"},
            {id: "metrics" as const, label: "Liczby"},
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
              tab === item.id
                ? "bg-ink text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "purchase" ? (
        <>
          <div className="surface rounded-[1.25rem] p-5 md:p-6">
            <p className="section-label">Ścieżka zakupu</p>
            <h3 className="brand-mark mt-2 text-2xl font-bold text-ink">
              Revolut → EUR → Kraken → krypto
            </h3>
            <p className="mt-2 text-sm text-muted">
              Co miesiąc możesz dokładać np. 100 zł z wypłaty. Kupujesz, gdy
              cena jest poniżej Twojej średniej; gdy jest wyżej — czekasz.
            </p>
          </div>

          <ol className="space-y-4">
            {PURCHASE_STEPS.map((step, index) => (
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
                      <span className="font-semibold text-accent">
                        Do zapisania:{" "}
                      </span>
                      {step.record}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="surface rounded-[1.25rem] p-5 md:p-6">
            <h3 className="brand-mark text-xl font-bold text-ink">
              Import z innej giełdy
            </h3>
            <p className="mt-2 text-sm text-muted">
              Gdy przenosisz już posiadane krypto, w formularzu wybierz{" "}
              <strong className="text-ink">Import</strong>. Podajesz ilość,
              koszt i średnią — Valora dolicza to do pozycji i kapitału własnego,
              ale bez prowizji Revolut/Kraken.
            </p>
          </div>
        </>
      ) : null}

      {tab === "sell" ? (
        <div className="space-y-4">
          <div className="surface rounded-[1.25rem] p-5 md:p-6">
            <p className="section-label">Strategia</p>
            <h3 className="brand-mark mt-2 text-2xl font-bold text-ink">
              +30% → sprzedajesz ~20% pozycji
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Gdy aktualna wartość monety jest ok.{" "}
              <strong className="text-ink">30% powyżej Twojej średniej</strong>,
              sprzedajesz część pozycji (np. 20%). Reszta zostaje na rynku i
              dalej „grasz procentami”. Środki ze sprzedaży zostają na Krakenie{" "}
              <strong className="text-ink">w EUR</strong> — na razie nie
              wypłacasz ich na konto bankowe.
            </p>
          </div>

          <ol className="space-y-4">
            <li className="surface rounded-[1.25rem] p-5 md:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="brand-mark text-2xl font-bold text-ink">
                    Sprawdź zysk niezrealizowany
                  </h3>
                  <p className="mt-1 text-muted">
                    Na pulpicie przy monecie patrzysz na procent vs koszt
                    pozycji.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-ink">
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Ok. <strong>+30%</strong> — rozważ sprzedaż części
                        pozycji.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Poniżej średniej — raczej dokupujesz z miesięcznej
                        kwoty, zamiast sprzedawać.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </li>

            <li className="surface rounded-[1.25rem] p-5 md:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="brand-mark text-2xl font-bold text-ink">
                    Sprzedaj na Krakenie
                  </h3>
                  <p className="mt-1 text-muted">
                    Zamień wybraną ilość krypto na EUR (Market/Limit).
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-ink">
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Zapisz: ilość sprzedaną, cenę EUR, prowizję i{" "}
                        <strong>kwotę netto EUR</strong>.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        EUR zostaje na saldzie Krakena — Valora tylko to
                        księguje.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </li>

            <li className="surface rounded-[1.25rem] p-5 md:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="brand-mark text-2xl font-bold text-ink">
                    Zapisz sprzedaż w Valora
                  </h3>
                  <p className="mt-1 text-muted">
                    W formularzu wybierz zakładkę{" "}
                    <strong className="text-ink">Sprzedaż</strong>.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-ink">
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Podaj datę, krypto, ilość, cenę, prowizję i netto EUR.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Kurs NBP z daty transakcji przelicza netto na PLN do
                        puli „Odzyskane”.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Valora odejmuje proporcjonalny koszt pozycji —{" "}
                        <strong>średnia zakupu reszty zostaje taka sama</strong>
                        .
                      </span>
                    </li>
                  </ul>
                  <p className="mt-4 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">
                    <span className="font-semibold text-accent">Przykład: </span>
                    koszt pozycji 300 zł, sprzedajesz 20% → koszt sprzedanej
                    części ~60 zł. Netto 77 zł → odzyskane +77 zł, zysk
                    zrealizowany +17 zł. Reszta pozycji: koszt ~240 zł, średnia
                    bez zmian, % nadal może być ok. +30%.
                  </p>
                </div>
              </div>
            </li>

            <li className="surface rounded-[1.25rem] p-5 md:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white">
                  4
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="brand-mark text-2xl font-bold text-ink">
                    Cel: odzyskać kapitał własny
                  </h3>
                  <p className="mt-1 text-muted">
                    Co miesiąc dalej dokładasz własne pieniądze na zakupy. Ze
                    sprzedaży zbierasz pulę odzyskanych.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-ink">
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Gdy <strong>Odzyskane ≥ Kapitał własny</strong>, Valora
                        pokazuje „Cel osiągnięty”.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Dopiero wtedy możesz wypłacić swój wkład z Krakena na
                        konto — Valora na razie tylko to sygnalizuje, bez
                        automatycznych wypłat.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-strong" />
                      <span>
                        Nadwyżka ponad wkład zostaje do dalszej gry na giełdzie.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          </ol>
        </div>
      ) : null}

      {tab === "metrics" ? (
        <div className="space-y-4">
          <div className="surface rounded-[1.25rem] p-5 md:p-6">
            <p className="section-label">Pulpit</p>
            <h3 className="brand-mark mt-2 text-2xl font-bold text-ink">
              Co oznaczają kwoty
            </h3>
            <p className="mt-2 text-sm text-muted">
              Przy każdej metryce jest też kółeczko „?” z krótką chmurką.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              {
                title: "Cały portfel",
                text: "Aktualna wartość rynkowa krypto, które nadal trzymasz (ilość × cena live).",
              },
              {
                title: "Koszt pozostałej pozycji",
                text: "Ile kosztowała część, którą nadal posiadasz. Po sprzedaży spada proporcjonalnie — średnia zostaje.",
              },
              {
                title: "Zysk niezrealizowany",
                text: "Wartość rynkowa minus koszt pozostałej pozycji. To zysk „na papierze”, dopóki nie sprzedasz.",
              },
              {
                title: "Kapitał własny",
                text: "Suma kosztów wszystkich zakupów i importów — ile łącznie włożyłeś w pozycje. Punkt odniesienia do celu odzyskania.",
              },
              {
                title: "Odzyskane",
                text: "Pełna kwota netto ze sprzedaży (EUR na Krakenie → PLN). To NIE jest zysk. Sprzedaż za 77 zł netto = +77 zł odzyskanych.",
              },
              {
                title: "Zysk zrealizowany",
                text: "Netto ze sprzedaży minus koszt sprzedanej części. Osobno od odzyskanych (np. 77 − 60 = 17 zł).",
              },
              {
                title: "Postęp odzyskania",
                text: "Odzyskane ÷ kapitał własny. Cel: 100% lub więcej. Poniżej — Valora pokazuje, ile jeszcze brakuje.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="surface rounded-[1.25rem] p-5"
              >
                <h4 className="font-semibold text-ink">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-accent/25 bg-accent-soft/40 px-4 py-3 text-sm text-ink">
            <p className="font-semibold text-accent">
              Odzyskane ≠ zysk zrealizowany
            </p>
            <p className="mt-1 text-muted">
              Do strategii wypłacenia siebie z gry patrzysz na{" "}
              <strong className="text-ink">Odzyskane</strong> względem kapitału
              własnego. Zysk zrealizowany to tylko informacja, ile zarobiłeś na
              zamkniętej części.
            </p>
          </div>
        </div>
      ) : null}

      <div className="surface-strong flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] p-5 md:p-6">
        <div>
          <p className="brand-mark text-xl font-bold text-ink">Gotowe?</p>
          <p className="mt-1 text-sm text-muted">
            {tab === "sell"
              ? "Dodaj sprzedaż z danymi z Krakena."
              : "Dodaj zakup, import albo sprzedaż."}
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
