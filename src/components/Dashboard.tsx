"use client";

import {useEffect, useRef, useState} from "react";
import {
  formatCryptoQuantity,
  formatMoneyEUR,
  formatMoneyPLN,
  getPortfolioSummary,
} from "@/lib/transactionStats";
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
        <p className="section-label relative">Cały portfel</p>
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
              Koszt zakupu
            </p>
            <p className="mono-figure mt-2 text-lg font-semibold text-ink sm:text-xl">
              {formatMoneyPLN(summary.totalCostPLN)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Zysk / strata
            </p>
            <p
              className={`mono-figure mt-2 text-lg font-semibold sm:text-xl ${profitClass(summary.totalProfitPLN)}`}
            >
              {summary.totalProfitPLN != null
                ? `${summary.totalProfitPLN >= 0 ? "+" : ""}${formatMoneyPLN(summary.totalProfitPLN)}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Zmiana vs koszt
            </p>
            <p
              className={`mono-figure mt-2 text-lg font-semibold sm:text-xl ${profitClass(summary.totalProfitPLN)}`}
            >
              {summary.totalProfitPercent != null
                ? `${summary.totalProfitPercent >= 0 ? "+" : ""}${summary.totalProfitPercent.toFixed(2)}%`
                : "—"}
            </p>
          </div>
        </div>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Aktualna wartość
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
                    Średnia zakupu
                  </p>
                  <p className="mono-figure mt-1.5 text-sm font-semibold text-ink sm:text-base">
                    {holding.averagePLN != null
                      ? formatMoneyPLN(holding.averagePLN)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Cena rynkowa
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
                    Koszt łącznie
                  </p>
                  <p className="mono-figure mt-1.5 text-sm font-semibold text-ink sm:text-base">
                    {formatMoneyPLN(holding.costPLN)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Zysk / strata
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
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
