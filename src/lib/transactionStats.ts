import {CRYPTO_OPTIONS} from "@/data/cryptos";
import {CryptoSymbol, Transaction} from "@/types/transaction";

export function getUnitPricePLN(transaction: Transaction): number | null {
  if (transaction.quantity <= 0) {
    return null;
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

export function getHoldingsStats(transactions: Transaction[]): HoldingsStats {
  const totalQuantity = transactions.reduce(
    (sum, transaction) => sum + transaction.quantity,
    0,
  );
  const totalPLN = transactions.reduce(
    (sum, transaction) => sum + transaction.investedPLN,
    0,
  );
  const totalEUR = transactions.reduce(
    (sum, transaction) => sum + transaction.investedEUR,
    0,
  );
  const missingEurCount = transactions.filter(
    (transaction) => !(transaction.investedEUR > 0),
  ).length;

  return {
    totalQuantity,
    totalPLN,
    totalEUR,
    averagePLN: totalQuantity > 0 ? totalPLN / totalQuantity : null,
    averageEUR:
      totalQuantity > 0 && missingEurCount === 0
        ? totalEUR / totalQuantity
        : null,
    missingEurCount,
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
  profitPLN: number | null;
  profitPercent: number | null;
};

export type PortfolioSummary = {
  totalCostPLN: number;
  totalValueEUR: number | null;
  totalValuePLN: number | null;
  totalProfitPLN: number | null;
  totalProfitPercent: number | null;
  eurPlnRate: number | null;
  holdings: CryptoHoldingSummary[];
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
  const totalProfitPLN =
    totalValuePLN != null ? totalValuePLN - totalCostPLN : null;
  const totalProfitPercent =
    totalProfitPLN != null && totalCostPLN > 0
      ? (totalProfitPLN / totalCostPLN) * 100
      : null;

  return {
    totalCostPLN,
    totalValueEUR,
    totalValuePLN,
    totalProfitPLN,
    totalProfitPercent,
    eurPlnRate,
    holdings,
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
