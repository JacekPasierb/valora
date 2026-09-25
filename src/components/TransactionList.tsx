"use client";

import {useState} from "react";
import {CRYPTO_OPTIONS, getCryptoLabel} from "@/data/cryptos";
import InfoTip, {MetricLabel} from "@/components/InfoTip";
import {fetchNbpEurRate} from "@/lib/nbp";
import {
  applyEurRateToTransaction,
  formatCryptoQuantity,
  formatMoneyEUR,
  formatMoneyPLN,
  getHoldingsStats,
  getTransactionSide,
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

const TIPS = {
  summary:
    "Podsumowanie pozostałej pozycji w wybranym filtrze (po uwzględnieniu sprzedaży).",
  totalQty:
    "Pozostała ilość kryptowaluty w wybranym zakresie: zakupy i importy minus sprzedaże.",
  totalCost:
    "Koszt pozostałej pozycji (zakupy/importy minus koszt sprzedanych części). To nie jest kwota odzyskana ze sprzedaży.",
  avgPln:
    "Ważona średnia cena zakupu w PLN dla pozostałej ilości. Po częściowej sprzedaży zwykle zostaje taka sama.",
  avgEur:
    "Ważona średnia cena zakupu w EUR. Pojawi się, gdy wszystkie pozycje mają uzupełniony koszt w euro.",
  type: "Zakup — z Revolut/Kraken. Import — przeniesione z innej giełdy. Sprzedaż — zbycie części pozycji na Krakenie.",
  plnBuy: "Kwota w PLN włożona w tę pozycję (koszt zakupu lub importu).",
  plnSell:
    "Kwota netto ze sprzedaży w PLN — trafia do puli „Odzyskane”. To nie jest zysk zrealizowany.",
  eurRate:
    "Kurs EUR użyty do przeliczenia PLN ↔ EUR (np. z NBP z daty transakcji).",
  eurBuy: "Koszt tej transakcji w euro.",
  eurSell: "Kwota netto ze sprzedaży w EUR — środki zostają na Krakenie.",
  unitPlnBuy: "Cena jednostkowa / średnia tej transakcji w PLN.",
  unitPlnSell: "Cena sprzedaży za 1 sztukę w PLN.",
  unitEurBuy: "Cena jednostkowa / średnia tej transakcji w EUR.",
  unitEurSell: "Cena sprzedaży za 1 sztukę w EUR.",
  qtyBuy: "Ilość kryptowaluty dodana do portfela.",
  qtySell: "Ilość kryptowaluty sprzedana (odejmowana od pozycji).",
  fee: "Prowizja giełdy w EUR.",
  tablePln:
    "Przy zakupie/imporcie: koszt w PLN. Przy sprzedaży: netto ze sprzedaży w PLN (odzyskane).",
  tableEur:
    "Przy zakupie/imporcie: koszt w EUR. Przy sprzedaży: netto w EUR na Krakenie.",
  tableAvgPln:
    "Przy zakupie: średnia/cena jednostkowa PLN. Przy sprzedaży: cena sprzedaży PLN.",
  tableAvgEur:
    "Przy zakupie: średnia/cena jednostkowa EUR. Przy sprzedaży: cena sprzedaży EUR.",
  tableQty: "Ilość krypto. Przy sprzedaży ze znakiem minus.",
} as const;

function getTypeLabel(transaction: Transaction): string {
  if (getTransactionSide(transaction) === "sell") {
    return "Sprzedaż";
  }
  return transaction.source === "imported" ? "Import" : "Zakup";
}

function getTypeBadgeClass(transaction: Transaction): string {
  if (getTransactionSide(transaction) === "sell") {
    return "bg-rose-50 text-loss";
  }
  return transaction.source === "imported"
    ? "bg-amber-50 text-warn"
    : "bg-accent-soft text-accent";
}

function sortNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) {
      return byDate;
    }
    return b.id.localeCompare(a.id);
  });
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

  const filteredTransactions = sortNewestFirst(
    filter === "all"
      ? transactions
      : transactions.filter((transaction) => transaction.crypto === filter),
  );

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
            <p className="section-label">
              <MetricLabel tip={TIPS.summary}>
                {`Średnia zakupu — ${scopeLabel}`}
              </MetricLabel>
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Ważona średnia do porównania z aktualną ceną rynkową. Do porównania
              w złotówkach kurs euro nie jest potrzebny.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  <MetricLabel tip={TIPS.totalQty}>Ilość łącznie</MetricLabel>
                </p>
                <p className="mono-figure mt-2 text-xl font-semibold text-ink">
                  {formatCryptoQuantity(stats.totalQuantity)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  <MetricLabel tip={TIPS.totalCost}>Koszt łącznie</MetricLabel>
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
                  <MetricLabel tip={TIPS.avgPln}>Średnia zakupu PLN</MetricLabel>
                </p>
                <p className="mono-figure mt-2 text-xl font-semibold text-accent">
                  {stats.averagePLN != null
                    ? formatMoneyPLN(stats.averagePLN)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  <MetricLabel tip={TIPS.avgEur}>Średnia zakupu EUR</MetricLabel>
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
              const isSell = getTransactionSide(transaction) === "sell";
              const unitPLN = getUnitPricePLN(transaction);
              const unitEUR = getUnitPriceEUR(transaction);
              const needsEurRate = !isSell && !(transaction.investedEUR > 0);

              return (
                <article key={transaction.id} className="history-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mono-figure text-sm text-muted">
                        {transaction.date}
                      </p>
                      <p className="brand-mark mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-ink">
                        {transaction.crypto}
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getTypeBadgeClass(transaction)}`}
                        >
                          {getTypeLabel(transaction)}
                        </span>
                        <InfoTip text={TIPS.type} />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="history-card-label !inline-flex justify-end">
                        <MetricLabel tip={isSell ? TIPS.plnSell : TIPS.plnBuy}>
                          {isSell ? "Netto PLN" : "Koszt PLN"}
                        </MetricLabel>
                      </p>
                      <p className="mono-figure text-lg font-semibold text-ink">
                        {isSell
                          ? `${(transaction.netSalePLN ?? 0).toFixed(2)} zł`
                          : `${transaction.investedPLN.toFixed(2)} zł`}
                      </p>
                    </div>
                  </div>

                  <div className="history-card-grid">
                    <div>
                      <p className="history-card-label">
                        <MetricLabel tip={isSell ? TIPS.qtySell : TIPS.qtyBuy}>
                          Ilość
                        </MetricLabel>
                      </p>
                      <p className="mono-figure text-sm font-semibold text-ink">
                        {isSell ? "−" : ""}
                        {formatCryptoQuantity(transaction.quantity)}
                      </p>
                    </div>
                    <div>
                      <p className="history-card-label">
                        <MetricLabel tip={isSell ? TIPS.eurSell : TIPS.eurBuy}>
                          {isSell ? "Netto EUR" : "EUR"}
                        </MetricLabel>
                      </p>
                      <p className="mono-figure text-sm font-semibold text-ink">
                        {isSell
                          ? transaction.netSaleEUR != null
                            ? `€${transaction.netSaleEUR.toFixed(2)}`
                            : "—"
                          : transaction.investedEUR > 0
                            ? `€${transaction.investedEUR.toFixed(2)}`
                            : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="history-card-label">
                        <MetricLabel
                          tip={isSell ? TIPS.unitPlnSell : TIPS.unitPlnBuy}
                        >
                          {isSell ? "Cena PLN" : "Śr. PLN"}
                        </MetricLabel>
                      </p>
                      <p className="mono-figure text-sm font-semibold text-ink">
                        {unitPLN != null ? formatMoneyPLN(unitPLN) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="history-card-label">
                        <MetricLabel
                          tip={isSell ? TIPS.unitEurSell : TIPS.unitEurBuy}
                        >
                          {isSell ? "Cena EUR" : "Śr. EUR"}
                        </MetricLabel>
                      </p>
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
                  <th>
                    <MetricLabel tip={TIPS.type}>Typ</MetricLabel>
                  </th>
                  <th>
                    <MetricLabel tip={TIPS.tablePln}>PLN</MetricLabel>
                  </th>
                  <th>
                    <MetricLabel tip={TIPS.eurRate}>Kurs EUR</MetricLabel>
                  </th>
                  <th>
                    <MetricLabel tip={TIPS.tableEur}>EUR</MetricLabel>
                  </th>
                  <th>
                    <MetricLabel tip={TIPS.tableAvgPln}>Średnia PLN</MetricLabel>
                  </th>
                  <th>
                    <MetricLabel tip={TIPS.tableAvgEur}>Średnia EUR</MetricLabel>
                  </th>
                  <th>
                    <MetricLabel tip={TIPS.tableQty}>Ilość</MetricLabel>
                  </th>
                  <th>
                    <MetricLabel tip={TIPS.fee}>Prowizja</MetricLabel>
                  </th>
                  <th>
                    <span className="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => {
                  const isSell = getTransactionSide(transaction) === "sell";
                  const unitPLN = getUnitPricePLN(transaction);
                  const unitEUR = getUnitPriceEUR(transaction);
                  const needsEurRate =
                    !isSell && !(transaction.investedEUR > 0);

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
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${getTypeBadgeClass(transaction)}`}
                        >
                          {getTypeLabel(transaction)}
                        </span>
                      </td>

                      <td className="mono-figure text-sm">
                        {isSell
                          ? `${(transaction.netSalePLN ?? 0).toFixed(2)} zł`
                          : `${transaction.investedPLN.toFixed(2)} zł`}
                      </td>

                      <td className="mono-figure text-sm">
                        {transaction.eurRate > 0
                          ? transaction.eurRate.toFixed(4)
                          : "—"}
                      </td>

                      <td className="mono-figure text-sm">
                        {isSell
                          ? transaction.netSaleEUR != null
                            ? `€${transaction.netSaleEUR.toFixed(2)}`
                            : "—"
                          : transaction.investedEUR > 0
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
                        {isSell ? "−" : ""}
                        {formatCryptoQuantity(transaction.quantity)}
                      </td>

                      <td className="mono-figure text-sm">
                        {isSell || transaction.source !== "imported"
                          ? `€${transaction.feeEUR.toFixed(2)}`
                          : "—"}
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
