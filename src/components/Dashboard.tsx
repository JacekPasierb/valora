"use client";

import {useEffect, useRef, useState} from "react";
import {MetricLabel} from "@/components/InfoTip";
import {
  formatCryptoQuantity,
  formatMoneyEUR,
  formatMoneyPLN,
  getPortfolioSummary,
} from "@/lib/transactionStats";
import {
  formatThresholdLabel,
  getProfitThresholdStatus,
} from "@/lib/profitThresholds";
import {DashboardSkeleton} from "@/components/skeletons";
import {CryptoSymbol, Transaction} from "@/types/transaction";

type PriceMap = Partial<Record<CryptoSymbol, {pln: number; eur: number}>>;

type DashboardProps = {
  transactions: Transaction[];
};

const REFRESH_INTERVAL_MS = 30_000;

function profitClass(value: number | null): string {
  if (value == null || value === 0) {
    return "text-ink";
  }

  return value > 0 ? "text-gain" : "text-loss";
}

function holdingBorderClass(profitPLN: number | null): string {
  if (profitPLN == null || profitPLN === 0) {
    return "!border-line";
  }

  return profitPLN > 0 ? "!border-gain" : "!border-loss";
}

export default function Dashboard({transactions}: DashboardProps) {
  const [prices, setPrices] = useState<PriceMap | null>(null);
  const [eurPlnRate, setEurPlnRate] = useState<number | null>(null);
  const [eurPlnRateDate, setEurPlnRateDate] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  const loadPrices = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/prices", {cache: "no-store"});
      const data = (await response.json()) as {
        prices?: PriceMap;
        eurPlnRate?: number;
        eurPlnRateDate?: string;
        updatedAt?: string;
        error?: string;
      };

      if (!response.ok || !data.prices) {
        throw new Error(data.error ?? "Nie udało się pobrać cen.");
      }

      setPrices(data.prices);
      setEurPlnRate(data.eurPlnRate ?? null);
      setEurPlnRateDate(data.eurPlnRateDate ?? null);
      setUpdatedAt(data.updatedAt ?? null);
      hasLoadedRef.current = true;
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nie udało się pobrać cen.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPrices(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadPrices(true);
      }
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasLoadedRef.current) {
        void loadPrices(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const summary = getPortfolioSummary(transactions, prices, eurPlnRate);
  const {capital} = summary;

  if (transactions.length === 0) {
    return (
      <div className="surface rounded-2xl px-6 py-10 text-muted">
        Brak transakcji — dodaj zakup lub import, żeby zobaczyć pulpit.
      </div>
    );
  }

  if (isLoading && !prices) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="dash-toolbar">
        <div className="fx-chip" aria-label="Kurs euro NBP">
          <div className="fx-chip-left">
            <span className="fx-chip-pair">EUR → PLN</span>
            <span className="fx-chip-source">NBP</span>
          </div>
          <p className="fx-chip-rate mono-figure">
            {eurPlnRate != null ? (
              <>
                {eurPlnRate.toFixed(4)}
                <span className="fx-chip-unit">zł</span>
              </>
            ) : isLoading ? (
              "…"
            ) : (
              "—"
            )}
          </p>
          {eurPlnRateDate ? (
            <span className="fx-chip-date">{eurPlnRateDate}</span>
          ) : null}
        </div>

        <div className="dash-toolbar-actions">
          <div className="dash-status" aria-live="polite">
            <span
              className={`live-dot ${isRefreshing ? "live-dot-pulse" : ""}`}
            />
            <div className="dash-status-text">
              <span className="dash-status-live">
                {isRefreshing ? "Odświeżanie" : "Live"}
              </span>
              <span className="dash-status-meta mono-figure">
                {updatedAt
                  ? `Aktualizacja ${new Date(updatedAt).toLocaleTimeString("pl-PL", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}`
                  : "Oczekiwanie na aktualizację…"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadPrices(false)}
            disabled={isLoading || isRefreshing}
            className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-accent-soft disabled:opacity-50"
          >
            Odśwież
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-loss">{error}</p>}

      <section className="surface-strong relative overflow-hidden rounded-[1.25rem] p-5 sm:rounded-[1.5rem] sm:p-7 md:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-accent-soft/80 blur-3xl" />
        <p className="section-label relative">
          <MetricLabel tip="Aktualna wartość rynkowa wszystkich kryptowalut, które nadal trzymasz (ilość × cena live), w PLN i EUR.">
            Cały portfel
          </MetricLabel>
        </p>
        <p className="mono-figure relative mt-3 text-4xl font-semibold tracking-tight text-ink sm:mt-4 sm:text-5xl md:text-6xl">
          {summary.totalValuePLN != null
            ? formatMoneyPLN(summary.totalValuePLN)
            : isLoading
              ? "…"
              : "—"}
        </p>
        <p className="mono-figure relative mt-2 text-lg text-muted sm:text-xl">
          {summary.totalValueEUR != null
            ? formatMoneyEUR(summary.totalValueEUR)
            : "—"}
        </p>

        <div className="relative mt-6 grid gap-4 border-t border-line pt-5 sm:mt-8 sm:grid-cols-3 sm:gap-6 sm:pt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              <MetricLabel tip="Ile kosztowała część kryptowalut, którą nadal posiadasz. Po sprzedaży spada proporcjonalnie (odejmowany jest koszt sprzedanej części), a średnia zakupu zostaje ta sama.">
                Koszt pozostałej pozycji
              </MetricLabel>
            </p>
            <p className="mono-figure mt-2 text-lg font-semibold text-ink sm:text-xl">
              {formatMoneyPLN(summary.totalCostPLN)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              <MetricLabel tip="Różnica między aktualną wartością rynkową a kosztem pozostałej pozycji. To zysk lub strata „na papierze” — jeszcze niezrealizowane sprzedażą.">
                Zysk niezrealizowany
              </MetricLabel>
            </p>
            <p
              className={`mono-figure mt-2 text-lg font-semibold sm:text-xl ${profitClass(summary.unrealizedProfitPLN)}`}
            >
              {summary.unrealizedProfitPLN != null
                ? `${summary.unrealizedProfitPLN >= 0 ? "+" : ""}${formatMoneyPLN(summary.unrealizedProfitPLN)}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              <MetricLabel tip="Procentowa zmiana wartości pozostałej pozycji względem jej kosztu. Przy strategii +30% patrzysz właśnie na ten wskaźnik przed sprzedażą części pozycji.">
                Zmiana vs koszt pozycji
              </MetricLabel>
            </p>
            <p
              className={`mono-figure mt-2 text-lg font-semibold sm:text-xl ${profitClass(summary.unrealizedProfitPLN)}`}
            >
              {summary.unrealizedProfitPercent != null
                ? `${summary.unrealizedProfitPercent >= 0 ? "+" : ""}${summary.unrealizedProfitPercent.toFixed(2)}%`
                : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="surface rounded-[1.25rem] border-2 border-line p-5 sm:p-6 md:p-7">
        <p className="section-label">Strategia — odzyskanie kapitału</p>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Cel: zebrać w puli „Odzyskane” co najmniej tyle, ile wyniósł koszt
          wszystkich pozycji. Środki ze sprzedaży zostają na Krakenie w EUR.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              <MetricLabel tip="Suma kosztów wszystkich zakupów i importów — ile łącznie włożyłeś w pozycje. Nie maleje przy sprzedaży; to Twój punkt odniesienia do odzyskania kapitału.">
                Kapitał własny
              </MetricLabel>
            </p>
            <p className="mono-figure mt-2 text-xl font-semibold text-ink">
              {formatMoneyPLN(capital.ownCapitalPLN)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              <MetricLabel tip="Pełna kwota netto ze wszystkich sprzedaży, przeliczona na PLN. To NIE jest zysk — np. sprzedaż za 77 zł netto dodaje 77 zł do odzyskanych, nawet jeśli zysk wyniósł tylko 17 zł. EUR nadal leży na Krakenie.">
                Odzyskane
              </MetricLabel>
            </p>
            <p className="mono-figure mt-2 text-xl font-semibold text-accent">
              {formatMoneyPLN(capital.recoveredPLN)}
            </p>
            <p className="mono-figure mt-1 text-xs text-muted">
              {capital.recoveredEUR > 0
                ? formatMoneyEUR(capital.recoveredEUR)
                : "€0.00"}{" "}
              na Krakenie
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              <MetricLabel tip="Zysk z zamkniętych części pozycji: kwota netto ze sprzedaży minus koszt sprzedanej części. Osobna wartość od „Odzyskanych”.">
                Zysk zrealizowany
              </MetricLabel>
            </p>
            <p
              className={`mono-figure mt-2 text-xl font-semibold ${profitClass(capital.realizedProfitPLN)}`}
            >
              {capital.realizedProfitPLN >= 0 ? "+" : ""}
              {formatMoneyPLN(capital.realizedProfitPLN)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              <MetricLabel tip="Jaką część kapitału własnego już pokryły odzyskane środki (odzyskane ÷ kapitał własny). Cel: 100% lub więcej.">
                Postęp odzyskania
              </MetricLabel>
            </p>
            <p className="mono-figure mt-2 text-xl font-semibold text-ink">
              {capital.ownCapitalPLN > 0
                ? `${Math.min(capital.progressPercent, 999).toFixed(1)}%`
                : "—"}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
              <div
                className={`h-full rounded-full transition-all ${
                  capital.goalReached ? "bg-gain" : "bg-accent-strong"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, capital.progressPercent))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {capital.goalReached ? (
          <div className="mt-6 rounded-xl border border-gain/30 bg-emerald-50 px-4 py-3 text-sm text-ink">
            <p className="font-semibold text-gain">
              <MetricLabel tip="Odzyskane pokryły lub przekroczyły kapitał własny. Kwota do wypłaty to Twój wkład; nadwyżka to środki ponad wkład — Valora na razie tylko to pokazuje, bez wypłat bankowych.">
                Cel osiągnięty
              </MetricLabel>
            </p>
            <p className="mt-1 text-muted">
              Możesz wypłacić swój wkład{" "}
              <span className="mono-figure font-semibold text-ink">
                {formatMoneyPLN(capital.capitalToWithdrawPLN)}
              </span>
              . Nadwyżka do dalszego inwestowania:{" "}
              <span className="mono-figure font-semibold text-ink">
                {formatMoneyPLN(capital.surplusPLN)}
              </span>
              . Valora nie prowadzi jeszcze wypłat bankowych — to tylko
              informacja.
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">
            <MetricLabel tip="Różnica między kapitałem własnym a odzyskanymi — ile netto ze sprzedaży jeszcze potrzebujesz, żeby pokryć cały wkład w pozycje.">
              Brakuje do celu
            </MetricLabel>
            :{" "}
            <span className="mono-figure font-semibold text-ink">
              {formatMoneyPLN(capital.remainingToGoalPLN)}
            </span>
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="brand-mark text-xl font-bold text-ink sm:text-2xl">
            Poszczególne kryptowaluty
          </h2>
          <p className="text-sm text-muted">{summary.holdings.length} pozycji</p>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {summary.holdings.map((holding) => (
            <article
              key={holding.symbol}
              className={`surface rounded-[1.25rem] !border-2 p-4 transition duration-200 hover:-translate-y-0.5 sm:p-5 md:p-6 ${holdingBorderClass(holding.profitPLN)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="brand-mark text-xl font-bold text-ink sm:text-2xl">
                    {holding.label}{" "}
                    <span className="text-muted">{holding.symbol}</span>
                  </h3>
                  <p className="mono-figure mt-1 text-sm text-muted">
                    {formatCryptoQuantity(holding.quantity)} szt.
                  </p>
                </div>
                <div className="w-full text-left sm:w-auto sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted sm:justify-end">
                    <span className="inline-flex items-center gap-1 sm:justify-end">
                      <MetricLabel tip="Ile jest warta ta kryptowaluta teraz: posiadana ilość × aktualna cena rynkowa.">
                        Aktualna wartość
                      </MetricLabel>
                    </span>
                  </p>
                  <p className="mono-figure mt-1 text-2xl font-semibold text-ink sm:text-3xl">
                    {holding.currentValuePLN != null
                      ? formatMoneyPLN(holding.currentValuePLN)
                      : isLoading
                        ? "…"
                        : "—"}
                  </p>
                  <p className="mono-figure mt-0.5 text-sm text-muted">
                    {holding.currentValueEUR != null
                      ? formatMoneyEUR(holding.currentValueEUR)
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/80 pt-4 sm:mt-6 sm:gap-4 sm:pt-5 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <MetricLabel tip="Średnia ważona cena zakupu pozostałej ilości. Po częściowej sprzedaży nie powinna się zmieniać — spada ilość i koszt proporcjonalnie.">
                      Średnia zakupu
                    </MetricLabel>
                  </p>
                  <p className="mono-figure mt-1.5 text-sm font-semibold text-ink sm:text-base">
                    {holding.averagePLN != null
                      ? formatMoneyPLN(holding.averagePLN)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <MetricLabel tip="Aktualna cena rynkowa za 1 sztukę (live), w PLN i EUR.">
                      Cena rynkowa
                    </MetricLabel>
                  </p>
                  <p className="mono-figure mt-1.5 text-sm font-semibold text-ink sm:text-base">
                    {holding.currentPricePLN != null
                      ? formatMoneyPLN(holding.currentPricePLN)
                      : "—"}
                  </p>
                  <p className="mono-figure mt-0.5 text-xs text-muted sm:text-sm">
                    {holding.currentPriceEUR != null
                      ? formatMoneyEUR(holding.currentPriceEUR)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <MetricLabel tip="Koszt pozostałej ilości tej monety (po odjęciu kosztu sprzedanych części).">
                      Koszt pozycji
                    </MetricLabel>
                  </p>
                  <p className="mono-figure mt-1.5 text-sm font-semibold text-ink sm:text-base">
                    {formatMoneyPLN(holding.costPLN)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <MetricLabel tip="Aktualna wartość minus koszt pozycji. Procent pokazuje, o ile jesteś powyżej lub poniżej swojej średniej — tu celujesz w ok. +30% przed sprzedażą 20%.">
                      Zysk niezrealizowany
                    </MetricLabel>
                  </p>
                  <p
                    className={`mono-figure mt-1.5 text-sm font-semibold sm:text-base ${profitClass(holding.profitPLN)}`}
                  >
                    {holding.profitPLN != null
                      ? `${holding.profitPLN >= 0 ? "+" : ""}${formatMoneyPLN(holding.profitPLN)}`
                      : "—"}
                    {holding.profitPercent != null && (
                      <span className="ml-1 text-xs opacity-80 sm:ml-2 sm:text-sm">
                        ({holding.profitPercent >= 0 ? "+" : ""}
                        {holding.profitPercent.toFixed(2)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {(() => {
                const thresholds = getProfitThresholdStatus(
                  holding.symbol,
                  transactions,
                  holding.profitPercent,
                  holding.quantity,
                );

                return (
                  <div
                    className={`mt-4 rounded-xl border px-3.5 py-3 sm:px-4 ${
                      thresholds.suggestionActive
                        ? "border-accent/40 bg-accent-soft/50"
                        : "border-line/80 bg-paper/70"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      <MetricLabel tip="Progi realizacji w bieżącym cyklu pozycji: +30%, +50%, +80%, +100%. SELL przy progu oznacza go jako wykorzystany. Nowy BUY po sprzedaży startuje nowy cykl — wtedy +30% znów jest dostępne. Historia wcześniejszych cykli zostaje.">
                        Progi realizacji
                      </MetricLabel>
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                          Aktualny wynik
                        </p>
                        <p
                          className={`mono-figure mt-0.5 text-sm font-semibold ${profitClass(holding.profitPercent)}`}
                        >
                          {holding.profitPercent != null
                            ? `${holding.profitPercent >= 0 ? "+" : ""}${holding.profitPercent.toFixed(1)}%`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                          Ostatnio zrealizowany
                        </p>
                        <p className="mono-figure mt-0.5 text-sm font-semibold text-ink">
                          {thresholds.lastRealizedThreshold != null
                            ? formatThresholdLabel(
                                thresholds.lastRealizedThreshold,
                              )
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                          Następny próg
                        </p>
                        <p className="mono-figure mt-0.5 text-sm font-semibold text-ink">
                          {thresholds.nextThreshold != null
                            ? formatThresholdLabel(thresholds.nextThreshold)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`mt-3 text-sm font-medium ${
                        thresholds.suggestionActive ? "text-accent" : "text-ink"
                      }`}
                    >
                      {thresholds.statusLabel}
                    </p>

                    {thresholds.suggestionActive &&
                    thresholds.suggestedSellQuantity != null ? (
                      <p className="mt-1 text-xs text-muted">
                        Sugestia (nieautomatyczna): sprzedaj ok.{" "}
                        <span className="mono-figure font-semibold text-ink">
                          {formatCryptoQuantity(
                            thresholds.suggestedSellQuantity,
                          )}
                        </span>{" "}
                        {holding.symbol} (~20% pozycji), potem zapisz sprzedaż w
                        Valora.
                      </p>
                    ) : null}

                    {thresholds.previousCycles.length > 0 ? (
                      <p className="mt-2 text-xs text-muted">
                        Historia: {thresholds.previousCycles.length}{" "}
                        {thresholds.previousCycles.length === 1
                          ? "wcześniejszy cykl"
                          : "wcześniejsze cykle"}
                        {thresholds.previousCycles.map((cycle) => {
                          const last = cycle.realizedThresholds.at(-1);
                          return last != null
                            ? ` · ${cycle.startedAt}: do ${formatThresholdLabel(last)}`
                            : ` · ${cycle.startedAt}: bez progów`;
                        })}
                      </p>
                    ) : null}
                  </div>
                );
              })()}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
