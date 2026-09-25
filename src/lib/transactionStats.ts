import {CRYPTO_OPTIONS} from "@/data/cryptos";
import {CryptoSymbol, Transaction} from "@/types/transaction";

export function getTransactionSide(
  transaction: Transaction,
): "buy" | "sell" {
  if (transaction.side === "sell") {
    return "sell";
  }
  if (transaction.side === "buy") {
    return "buy";
  }
  // Fallback: sprzedaż zapisana bez `side` (stary schemat Mongo)
  if (
    transaction.netSalePLN != null ||
    transaction.netSaleEUR != null ||
    transaction.realizedProfitPLN != null
  ) {
    return "sell";
  }
  return "buy";
}

export function isOwnCapitalTransaction(transaction: Transaction): boolean {
  return getTransactionSide(transaction) === "buy";
}

export function getUnitPricePLN(transaction: Transaction): number | null {
  if (transaction.quantity <= 0) {
    return null;
  }

  if (getTransactionSide(transaction) === "sell") {
    if (transaction.cryptoPricePLN != null && transaction.cryptoPricePLN > 0) {
      return transaction.cryptoPricePLN;
    }
    if (transaction.netSalePLN != null && transaction.netSalePLN > 0) {
      return transaction.netSalePLN / transaction.quantity;
    }
  }

  if (transaction.cryptoPricePLN != null && transaction.cryptoPricePLN > 0) {
    return transaction.cryptoPricePLN;
  }

  if (transaction.investedPLN > 0) {
    return transaction.investedPLN / transaction.quantity;
  }

  if (transaction.cryptoPriceEUR > 0 && transaction.eurRate > 0) {
    return transaction.cryptoPriceEUR * transaction.eurRate;
  }

  return null;
}

export function getUnitPriceEUR(transaction: Transaction): number | null {
  if (transaction.quantity <= 0) {
    return null;
  }

  if (getTransactionSide(transaction) === "sell") {
    if (transaction.cryptoPriceEUR > 0) {
      return transaction.cryptoPriceEUR;
    }
    if (transaction.netSaleEUR != null && transaction.netSaleEUR > 0) {
      return transaction.netSaleEUR / transaction.quantity;
    }
  }

  if (transaction.cryptoPriceEUR > 0) {
    return transaction.cryptoPriceEUR;
  }

  if (transaction.investedEUR > 0) {
    return transaction.investedEUR / transaction.quantity;
  }

  const pricePLN = getUnitPricePLN(transaction);
  if (pricePLN != null && transaction.eurRate > 0) {
    return pricePLN / transaction.eurRate;
  }

  return null;
}

export type HoldingsStats = {
  totalQuantity: number;
  totalPLN: number;
  totalEUR: number;
  averagePLN: number | null;
  averageEUR: number | null;
  missingEurCount: number;
};

/** Pozostała pozycja: BUY dodaje, SELL odejmuje quantity i costSold (invested*). */
export function getHoldingsStats(transactions: Transaction[]): HoldingsStats {
  let totalQuantity = 0;
  let totalPLN = 0;
  let totalEUR = 0;
  let missingEurCount = 0;

  for (const transaction of transactions) {
    const side = getTransactionSide(transaction);
    const sign = side === "sell" ? -1 : 1;

    totalQuantity += sign * transaction.quantity;
    totalPLN += sign * transaction.investedPLN;
    totalEUR += sign * transaction.investedEUR;

    if (side === "buy" && !(transaction.investedEUR > 0)) {
      missingEurCount += 1;
    }
  }

  // unikaj ujemnych artefaktów float
  if (Math.abs(totalQuantity) < 1e-12) {
    totalQuantity = 0;
  }
  if (Math.abs(totalPLN) < 1e-8) {
    totalPLN = 0;
  }
  if (Math.abs(totalEUR) < 1e-8) {
    totalEUR = 0;
  }

  return {
    totalQuantity,
    totalPLN,
    totalEUR,
    averagePLN: totalQuantity > 0 ? totalPLN / totalQuantity : null,
    averageEUR:
      totalQuantity > 0 && missingEurCount === 0 && totalEUR > 0
        ? totalEUR / totalQuantity
        : null,
    missingEurCount,
  };
}

export function getAvailableQuantity(
  transactions: Transaction[],
  crypto: CryptoSymbol,
  excludeId?: string,
): number {
  const relevant = transactions.filter(
    (transaction) =>
      transaction.crypto === crypto && transaction.id !== excludeId,
  );
  return getHoldingsStats(relevant).totalQuantity;
}

export type CapitalRecoverySummary = {
  /** Suma kosztów wszystkich pozycji (zakupy + importy). */
  ownCapitalPLN: number;
  /** Pula odzyskanych — netto ze sprzedaży w PLN (EUR na Krakenie). */
  recoveredPLN: number;
  recoveredEUR: number;
  realizedProfitPLN: number;
  /** Ile brakuje do odzyskania całego wkładu. */
  remainingToGoalPLN: number;
  progressPercent: number;
  goalReached: boolean;
  /** Po osiągnięciu celu: min(odzyskane, kapitał własny). */
  capitalToWithdrawPLN: number;
  /** Nadwyżka ponad wkład własny. */
  surplusPLN: number;
};

export function getCapitalRecoverySummary(
  transactions: Transaction[],
): CapitalRecoverySummary {
  let ownCapitalPLN = 0;
  let recoveredPLN = 0;
  let recoveredEUR = 0;
  let realizedProfitPLN = 0;

  for (const transaction of transactions) {
    if (isOwnCapitalTransaction(transaction)) {
      ownCapitalPLN += transaction.investedPLN;
    }

    if (getTransactionSide(transaction) === "sell") {
      recoveredPLN += transaction.netSalePLN ?? 0;
      recoveredEUR += transaction.netSaleEUR ?? 0;
      realizedProfitPLN += transaction.realizedProfitPLN ?? 0;
    }
  }

  const remainingToGoalPLN = Math.max(0, ownCapitalPLN - recoveredPLN);
  const progressPercent =
    ownCapitalPLN > 0 ? (recoveredPLN / ownCapitalPLN) * 100 : 0;
  const goalReached = ownCapitalPLN > 0 && recoveredPLN >= ownCapitalPLN;
  const capitalToWithdrawPLN = goalReached
    ? ownCapitalPLN
    : Math.min(recoveredPLN, ownCapitalPLN);
  const surplusPLN = Math.max(0, recoveredPLN - ownCapitalPLN);

  return {
    ownCapitalPLN,
    recoveredPLN,
    recoveredEUR,
    realizedProfitPLN,
    remainingToGoalPLN,
    progressPercent,
    goalReached,
    capitalToWithdrawPLN,
    surplusPLN,
  };
}

export type CryptoHoldingSummary = {
  symbol: CryptoSymbol;
  label: string;
  quantity: number;
  costPLN: number;
  averagePLN: number | null;
  currentPricePLN: number | null;
  currentPriceEUR: number | null;
  currentValueEUR: number | null;
  currentValuePLN: number | null;
  /** Niezrealizowany zysk pozycji. */
  profitPLN: number | null;
  profitPercent: number | null;
};

export type PortfolioSummary = {
  /** Koszt pozostałej pozycji (remaining cost basis). */
  totalCostPLN: number;
  totalValueEUR: number | null;
  totalValuePLN: number | null;
  /** Niezrealizowany zysk całego portfela. */
  unrealizedProfitPLN: number | null;
  unrealizedProfitPercent: number | null;
  /** @deprecated alias — niezrealizowany */
  totalProfitPLN: number | null;
  totalProfitPercent: number | null;
  eurPlnRate: number | null;
  holdings: CryptoHoldingSummary[];
  capital: CapitalRecoverySummary;
};

export function getPortfolioSummary(
  transactions: Transaction[],
  prices: Partial<Record<CryptoSymbol, {pln: number; eur: number}>> | null,
  eurPlnRate: number | null = null,
): PortfolioSummary {
  const holdings = CRYPTO_OPTIONS.map((crypto) => {
    const cryptoTransactions = transactions.filter(
      (transaction) => transaction.crypto === crypto.symbol,
    );
    const stats = getHoldingsStats(cryptoTransactions);
    const currentPriceEUR = prices?.[crypto.symbol]?.eur ?? null;
    const currentPricePLN =
      currentPriceEUR != null && eurPlnRate != null && eurPlnRate > 0
        ? currentPriceEUR * eurPlnRate
        : (prices?.[crypto.symbol]?.pln ?? null);
    const currentValueEUR =
      currentPriceEUR != null && stats.totalQuantity > 0
        ? currentPriceEUR * stats.totalQuantity
        : null;
    const currentValuePLN =
      currentValueEUR != null && eurPlnRate != null && eurPlnRate > 0
        ? currentValueEUR * eurPlnRate
        : null;
    const profitPLN =
      currentValuePLN != null ? currentValuePLN - stats.totalPLN : null;
    const profitPercent =
      profitPLN != null && stats.totalPLN > 0
        ? (profitPLN / stats.totalPLN) * 100
        : null;

    return {
      symbol: crypto.symbol,
      label: crypto.label,
      quantity: stats.totalQuantity,
      costPLN: stats.totalPLN,
      averagePLN: stats.averagePLN,
      currentPricePLN,
      currentPriceEUR,
      currentValueEUR,
      currentValuePLN,
      profitPLN,
      profitPercent,
    } satisfies CryptoHoldingSummary;
  }).filter((holding) => holding.quantity > 0);

  const totalCostPLN = holdings.reduce(
    (sum, holding) => sum + holding.costPLN,
    0,
  );
  const hasAllValues = holdings.every(
    (holding) =>
      holding.currentValuePLN != null && holding.currentValueEUR != null,
  );
  const totalValueEUR = hasAllValues
    ? holdings.reduce((sum, holding) => sum + (holding.currentValueEUR ?? 0), 0)
    : null;
  const totalValuePLN = hasAllValues
    ? holdings.reduce((sum, holding) => sum + (holding.currentValuePLN ?? 0), 0)
    : null;
  const unrealizedProfitPLN =
    totalValuePLN != null ? totalValuePLN - totalCostPLN : null;
  const unrealizedProfitPercent =
    unrealizedProfitPLN != null && totalCostPLN > 0
      ? (unrealizedProfitPLN / totalCostPLN) * 100
      : null;

  return {
    totalCostPLN,
    totalValueEUR,
    totalValuePLN,
    unrealizedProfitPLN,
    unrealizedProfitPercent,
    totalProfitPLN: unrealizedProfitPLN,
    totalProfitPercent: unrealizedProfitPercent,
    eurPlnRate,
    holdings,
    capital: getCapitalRecoverySummary(transactions),
  };
}

export function formatMoneyPLN(value: number): string {
  return `${value.toFixed(2)} zł`;
}

export function formatMoneyEUR(value: number): string {
  return `€${value.toFixed(2)}`;
}

/** Tylko prezentacja UI — max 8 miejsc, bez zbędnych zer na końcu. */
export function formatCryptoQuantity(value: number): string {
  return Number(value.toFixed(8)).toString();
}

export function applyEurRateToTransaction(
  transaction: Transaction,
  eurRate: number,
): Transaction {
  if (getTransactionSide(transaction) === "sell") {
    const netSaleEUR = transaction.netSaleEUR ?? 0;
    const netSalePLN =
      eurRate > 0 ? Number((netSaleEUR * eurRate).toFixed(2)) : 0;
    const costSoldPLN = transaction.investedPLN;
    return {
      ...transaction,
      eurRate,
      netSalePLN,
      realizedProfitPLN: Number((netSalePLN - costSoldPLN).toFixed(2)),
      cryptoPricePLN:
        transaction.cryptoPriceEUR > 0 && eurRate > 0
          ? Number((transaction.cryptoPriceEUR * eurRate).toFixed(8))
          : transaction.cryptoPricePLN,
    };
  }

  const investedEUR =
    eurRate > 0 ? Number((transaction.investedPLN / eurRate).toFixed(2)) : 0;

  const unitPLN =
    transaction.cryptoPricePLN != null && transaction.cryptoPricePLN > 0
      ? transaction.cryptoPricePLN
      : transaction.quantity > 0
        ? transaction.investedPLN / transaction.quantity
        : 0;

  const cryptoPriceEUR =
    eurRate > 0 && unitPLN > 0
      ? Number((unitPLN / eurRate).toFixed(8))
      : transaction.cryptoPriceEUR;

  return {
    ...transaction,
    eurRate,
    investedEUR,
    cryptoPriceEUR,
    cryptoPricePLN: unitPLN > 0 ? unitPLN : transaction.cryptoPricePLN,
  };
}
