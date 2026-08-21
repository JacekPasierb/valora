"use client";

import {useState} from "react";
import {CRYPTO_OPTIONS, getCryptoLabel} from "@/data/cryptos";
import {fetchNbpEurRate} from "@/lib/nbp";
import {
  applyEurRateToTransaction,
  formatCryptoQuantity,
  formatMoneyEUR,
  formatMoneyPLN,
  getHoldingsStats,
  getUnitPriceEUR,
  getUnitPricePLN,
} from "@/lib/transactionStats";
import {CryptoSymbol, Transaction} from "@/types/transaction";

type TransactionListProps = {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void | Promise<void>;
  onUpdateTransaction: (transaction: Transaction) => void | Promise<void>;
  onEditTransaction: (transaction: Transaction) => void;
};

function getSourceLabel(transaction: Transaction): string {
  return transaction.source === "imported" ? "Import" : "Zakup";
}

export default function TransactionList({
  transactions,
  onDeleteTransaction,
  onUpdateTransaction,
  onEditTransaction,
}: TransactionListProps) {
  const [filter, setFilter] = useState<CryptoSymbol | "all">("all");
  const [loadingRateId, setLoadingRateId] = useState<string | null>(null);
  const [rateError, setRateError] = useState("");

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((transaction) => transaction.crypto === filter);

  const showCryptoColumn = filter === "all";
  const stats = getHoldingsStats(filteredTransactions);

  if (transactions.length === 0) {
    return (
      <div className="surface rounded-2xl px-6 py-10 text-muted">
        Brak zapisanych transakcji.
      </div>
    );
  }

  const handleDelete = (transaction: Transaction) => {
    const confirmed = window.confirm(
      `Usunąć transakcję ${transaction.crypto} z dnia ${transaction.date}?`,
    );

    if (confirmed) {
      onDeleteTransaction(transaction.id);
    }
  };

  const handleFillNbpRate = async (transaction: Transaction) => {
    setLoadingRateId(transaction.id);
    setRateError("");

    try {
      const result = await fetchNbpEurRate(transaction.date);
      onUpdateTransaction(applyEurRateToTransaction(transaction, result.rate));
    } catch (error) {
      setRateError(
        error instanceof Error
          ? error.message
          : "Nie udało się pobrać kursu NBP.",
      );
    } finally {
      setLoadingRateId(null);
    }
  };

  const scopeLabel =
    filter === "all" ? "całego portfela" : getCryptoLabel(filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
            filter === "all"
              ? "bg-ink text-white"
              : "border border-line bg-paper-elevated text-muted hover:text-ink"
          }`}
        >
          Wszystkie
          <span className="mono-figure ml-2 text-xs opacity-70">
            {transactions.length}
          </span>
        </button>
        {CRYPTO_OPTIONS.map((crypto) => {
          const count = transactions.filter(
            (transaction) => transaction.crypto === crypto.symbol,
          ).length;

          return (
            <button
              key={crypto.symbol}
              type="button"
              onClick={() => setFilter(crypto.symbol)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                filter === crypto.symbol
                  ? "bg-ink text-white"
                  : "border border-line bg-paper-elevated text-muted hover:text-ink"
              }`}
            >
              {crypto.symbol}
              <span className="mono-figure ml-2 text-xs opacity-70">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="surface rounded-2xl px-6 py-10 text-muted">
          Brak transakcji dla {getCryptoLabel(filter as CryptoSymbol)}.
        </div>
      ) : (
        <>
          <div className="surface-strong rounded-[1.25rem] p-6">
            <p className="section-label">Średnia zakupu — {scopeLabel}</p>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Ważona średnia do porównania z aktualną ceną rynkową. Do porównania
              w złotówkach kurs euro nie jest potrzebny.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Ilość łącznie
                </p>
                <p className="mono-figure mt-2 text-xl font-semibold text-ink">
                  {formatCryptoQuantity(stats.totalQuantity)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Koszt łącznie
                </p>
                <p className="mono-figure mt-2 text-xl font-semibold text-ink">
                  {stats.totalPLN.toFixed(2)} zł
                </p>
                <p className="mono-figure text-sm text-muted">
                  {stats.missingEurCount === 0
                    ? `€${stats.totalEUR.toFixed(2)}`
                    : "EUR niepełne"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Średnia zakupu PLN
                </p>
                <p className="mono-figure mt-2 text-xl font-semibold text-accent">
                  {stats.averagePLN != null
                    ? formatMoneyPLN(stats.averagePLN)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Średnia zakupu EUR
                </p>
                <p className="mono-figure mt-2 text-xl font-semibold text-accent">
                  {stats.averageEUR != null
                    ? formatMoneyEUR(stats.averageEUR)
                    : "—"}
                </p>
                {stats.missingEurCount > 0 && (
                  <p className="mt-1 text-xs text-warn">
                    Kliknij „Kurs NBP” przy imporcie — pobierze średni kurs z
                    daty transakcji
                  </p>
                )}
              </div>
            </div>

            {rateError && (
              <p className="mt-4 text-sm font-medium text-loss">{rateError}</p>
            )}
          </div>

          <div className="history-cards lg:hidden">
            {filteredTransactions.map((transaction) => {
              const unitPLN = getUnitPricePLN(transaction);
              const unitEUR = getUnitPriceEUR(transaction);
              const needsEurRate = !(transaction.investedEUR > 0);

              return (
                <article key={transaction.id} className="history-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mono-figure text-sm text-muted">
                        {transaction.date}
                      </p>
                      <p className="brand-mark mt-1 text-xl font-bold text-ink">
                        {transaction.crypto}
                        <span
                          className={`ml-2 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            transaction.source === "imported"
                              ? "bg-amber-50 text-warn"
                              : "bg-accent-soft text-accent"
                          }`}
                        >
                          {getSourceLabel(transaction)}
                        </span>
                      </p>
                    </div>
                    <p className="mono-figure text-right text-lg font-semibold text-ink">
                      {transaction.investedPLN.toFixed(2)} zł
                    </p>
                  </div>

                  <div className="history-card-grid">
                    <div>
                      <p className="history-card-label">Ilość</p>
                      <p className="mono-figure text-sm font-semibold text-ink">
                        {formatCryptoQuantity(transaction.quantity)}
                      </p>
                    </div>
                    <div>
                      <p className="history-card-label">EUR</p>
                      <p className="mono-figure text-sm font-semibold text-ink">
                        {transaction.investedEUR > 0
                          ? `€${transaction.investedEUR.toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="history-card-label">Śr. PLN</p>
                      <p className="mono-figure text-sm font-semibold text-ink">
                        {unitPLN != null ? formatMoneyPLN(unitPLN) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="history-card-label">Śr. EUR</p>
                      <p className="mono-figure text-sm font-semibold text-ink">
                        {unitEUR != null ? formatMoneyEUR(unitEUR) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t border-line/70 pt-3">
                    {needsEurRate && (
                      <button
                        type="button"
                        onClick={() => handleFillNbpRate(transaction)}
                        disabled={loadingRateId === transaction.id}
                        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
                      >
                        {loadingRateId === transaction.id
                          ? "NBP…"
                          : "Kurs NBP"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditTransaction(transaction)}
                      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink transition hover:bg-paper"
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction)}
                      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-loss transition hover:bg-red-50"
                    >
                      Usuń
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="surface-strong hidden overflow-x-auto rounded-[1.25rem] lg:block">
            <table className="data-table min-w-[1100px]">
              <thead>
                <tr>
                  <th>Data</th>
                  {showCryptoColumn && <th>Krypto</th>}
                  <th>Typ</th>
                  <th>PLN</th>
                  <th>Kurs EUR</th>
                  <th>EUR</th>
                  <th>Średnia PLN</th>
                  <th>Średnia EUR</th>
                  <th>Ilość</th>
                  <th>Prowizja</th>
                  <th>
                    <span className="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => {
                  const unitPLN = getUnitPricePLN(transaction);
                  const unitEUR = getUnitPriceEUR(transaction);
                  const needsEurRate = !(transaction.investedEUR > 0);

                  return (
                    <tr key={transaction.id}>
                      <td className="mono-figure text-sm">{transaction.date}</td>

                      {showCryptoColumn && (
                        <td className="font-semibold text-ink">
                          {transaction.crypto}
                        </td>
                      )}

                      <td>
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            transaction.source === "imported"
                              ? "bg-amber-50 text-warn"
                              : "bg-accent-soft text-accent"
                          }`}
                        >
                          {getSourceLabel(transaction)}
                        </span>
                      </td>

                      <td className="mono-figure text-sm">
                        {transaction.investedPLN.toFixed(2)} zł
                      </td>

                      <td className="mono-figure text-sm">
                        {transaction.eurRate > 0
                          ? transaction.eurRate.toFixed(4)
                          : "—"}
                      </td>

                      <td className="mono-figure text-sm">
                        {transaction.investedEUR > 0
                          ? `€${transaction.investedEUR.toFixed(2)}`
                          : "—"}
                      </td>

                      <td className="mono-figure text-sm">
                        {unitPLN != null ? formatMoneyPLN(unitPLN) : "—"}
                      </td>

                      <td className="mono-figure text-sm">
                        {unitEUR != null ? formatMoneyEUR(unitEUR) : "—"}
                      </td>

                      <td className="mono-figure text-sm">
                        {formatCryptoQuantity(transaction.quantity)}
                      </td>

                      <td className="mono-figure text-sm">
                        {transaction.source === "imported"
                          ? "—"
                          : `€${transaction.feeEUR.toFixed(2)}`}
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {needsEurRate && (
                            <button
                              type="button"
                              onClick={() => handleFillNbpRate(transaction)}
                              disabled={loadingRateId === transaction.id}
                              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
                            >
                              {loadingRateId === transaction.id
                                ? "NBP…"
                                : "Kurs NBP"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTransaction(transaction)}
                            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink transition hover:bg-paper"
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(transaction)}
                            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-loss transition hover:bg-red-50"
                          >
                            Usuń
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
