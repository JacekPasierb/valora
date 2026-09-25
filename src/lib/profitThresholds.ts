import {
  getHoldingsStats,
  getTransactionSide,
  getUnitPricePLN,
} from "@/lib/transactionStats";
import {CryptoSymbol, Transaction} from "@/types/transaction";

/** Progi realizacji zysku w jednym cyklu (% względem średniej). */
export const PROFIT_THRESHOLDS = [30, 50, 80, 100] as const;

export type ProfitThreshold = (typeof PROFIT_THRESHOLDS)[number];

/** Sugerowana część aktualnej pozycji do sprzedaży przy progu. */
export const SUGGESTED_SELL_FRACTION = 0.2;

export type ThresholdRealization = {
  threshold: ProfitThreshold;
  sellTransactionId: string;
  date: string;
  profitPercentAtSell: number;
};

export type ProfitCycle = {
  id: string;
  symbol: CryptoSymbol;
  startedAt: string;
  startTransactionId: string;
  realizedThresholds: ProfitThreshold[];
  realizations: ThresholdRealization[];
};

export type ProfitThresholdStatus = {
  symbol: CryptoSymbol;
  /** Bieżący niezrealizowany % vs średnia (live). */
  currentProfitPercent: number | null;
  currentCycle: ProfitCycle | null;
  previousCycles: ProfitCycle[];
  lastRealizedThreshold: ProfitThreshold | null;
  nextThreshold: ProfitThreshold | null;
  suggestedSellFraction: number;
  /** Ile szt. sprzedać przy sugestii (20% aktualnej pozycji). */
  suggestedSellQuantity: number | null;
  /** Czy live % osiągnął lub przekroczył następny próg. */
  suggestionActive: boolean;
  statusLabel: string;
};

function sortChronological(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) {
      return byDate;
    }
    return a.id.localeCompare(b.id);
  });
}

export function getNextThreshold(
  realized: readonly number[],
): ProfitThreshold | null {
  for (const threshold of PROFIT_THRESHOLDS) {
    if (!realized.includes(threshold)) {
      return threshold;
    }
  }
  return null;
}

export function getLastRealizedThreshold(
  realized: readonly number[],
): ProfitThreshold | null {
  let last: ProfitThreshold | null = null;
  for (const threshold of PROFIT_THRESHOLDS) {
    if (realized.includes(threshold)) {
      last = threshold;
    }
  }
  return last;
}

/**
 * % zysku w momencie SELL względem średniej przed tą sprzedażą.
 * Używa ceny sprzedaży (PLN) z transakcji.
 */
export function getProfitPercentAtSell(
  averagePLN: number,
  sellPricePLN: number,
): number | null {
  if (!(averagePLN > 0) || !(sellPricePLN > 0)) {
    return null;
  }
  return ((sellPricePLN - averagePLN) / averagePLN) * 100;
}

function emptyCycle(
  symbol: CryptoSymbol,
  startTx: Transaction,
  index: number,
): ProfitCycle {
  return {
    id: `${symbol}-cycle-${index}-${startTx.id}`,
    symbol,
    startedAt: startTx.date,
    startTransactionId: startTx.id,
    realizedThresholds: [],
    realizations: [],
  };
}

/**
 * Buduje historię cykli progów z transakcji jednej monety.
 *
 * - Pierwszy BUY startuje cykl.
 * - SELL w cyklu może oznaczyć `nextThreshold`, jeśli % przy sprzedaży ≥ próg.
 * - BUY po co najmniej jednym SELL w bieżącym cyklu → nowy cykl (historia zostaje).
 * - Sam SELL / spadek ceny nie startuje cyklu.
 */
export function buildProfitCycles(
  symbol: CryptoSymbol,
  transactions: Transaction[],
): ProfitCycle[] {
  const cryptoTxs = sortChronological(
    transactions.filter((tx) => tx.crypto === symbol),
  );

  const cycles: ProfitCycle[] = [];
  let current: ProfitCycle | null = null;
  let soldInCurrentCycle = false;
  let cycleIndex = 0;
  const position: Transaction[] = [];

  for (const tx of cryptoTxs) {
    const side = getTransactionSide(tx);

    if (side === "buy") {
      if (current == null) {
        cycleIndex += 1;
        current = emptyCycle(symbol, tx, cycleIndex);
        soldInCurrentCycle = false;
      } else if (soldInCurrentCycle) {
        cycles.push(current);
        cycleIndex += 1;
        current = emptyCycle(symbol, tx, cycleIndex);
        soldInCurrentCycle = false;
      }

      position.push(tx);
      continue;
    }

    // SELL
    if (current == null) {
      continue;
    }

    const statsBefore = getHoldingsStats(position);
    const sellPricePLN = getUnitPricePLN(tx);
    const profitPercent =
      statsBefore.averagePLN != null && sellPricePLN != null
        ? getProfitPercentAtSell(statsBefore.averagePLN, sellPricePLN)
        : null;

    const next = getNextThreshold(current.realizedThresholds);
    if (
      next != null &&
      profitPercent != null &&
      profitPercent + 1e-9 >= next
    ) {
      current.realizedThresholds = [...current.realizedThresholds, next];
      current.realizations = [
        ...current.realizations,
        {
          threshold: next,
          sellTransactionId: tx.id,
          date: tx.date,
          profitPercentAtSell: profitPercent,
        },
      ];
    }

    position.push(tx);
    soldInCurrentCycle = true;
  }

  if (current != null) {
    cycles.push(current);
  }

  return cycles;
}

export function formatThresholdLabel(threshold: number): string {
  return `+${threshold}%`;
}

export function buildStatusLabel(params: {
  nextThreshold: ProfitThreshold | null;
  lastRealizedThreshold: ProfitThreshold | null;
  suggestionActive: boolean;
  currentProfitPercent: number | null;
}): string {
  const {nextThreshold, lastRealizedThreshold, suggestionActive} = params;

  if (suggestionActive && nextThreshold != null) {
    return `Sugestia: rozważ sprzedaż 20% przy progu ${formatThresholdLabel(nextThreshold)}`;
  }

  if (lastRealizedThreshold != null && nextThreshold != null) {
    return `Próg ${formatThresholdLabel(lastRealizedThreshold)} zrealizowany`;
  }

  if (lastRealizedThreshold != null && nextThreshold == null) {
    return `Wszystkie progi cyklu zrealizowane (ostatni ${formatThresholdLabel(lastRealizedThreshold)})`;
  }

  if (nextThreshold != null) {
    return `Oczekiwanie na próg ${formatThresholdLabel(nextThreshold)}`;
  }

  return "Brak aktywnego cyklu progów";
}

export function getProfitThresholdStatus(
  symbol: CryptoSymbol,
  transactions: Transaction[],
  currentProfitPercent: number | null,
  currentQuantity: number,
): ProfitThresholdStatus {
  const cycles = buildProfitCycles(symbol, transactions);
  const previousCycles = cycles.slice(0, -1);
  const currentCycle = cycles.length > 0 ? cycles[cycles.length - 1]! : null;

  const realized = currentCycle?.realizedThresholds ?? [];
  const lastRealizedThreshold = getLastRealizedThreshold(realized);
  const nextThreshold = getNextThreshold(realized);
  const suggestionActive =
    nextThreshold != null &&
    currentProfitPercent != null &&
    currentProfitPercent + 1e-9 >= nextThreshold;

  const suggestedSellQuantity =
    suggestionActive && currentQuantity > 0
      ? currentQuantity * SUGGESTED_SELL_FRACTION
      : null;

  return {
    symbol,
    currentProfitPercent,
    currentCycle,
    previousCycles,
    lastRealizedThreshold,
    nextThreshold,
    suggestedSellFraction: SUGGESTED_SELL_FRACTION,
    suggestedSellQuantity,
    suggestionActive,
    statusLabel: buildStatusLabel({
      nextThreshold,
      lastRealizedThreshold,
      suggestionActive,
      currentProfitPercent,
    }),
  };
}
