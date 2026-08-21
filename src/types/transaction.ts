export type CryptoSymbol = "BTC" | "ETH" | "XRP" | "SOL";

export type TransactionSource = "purchase" | "imported";

export type Transaction = {
  id: string;
  crypto: CryptoSymbol;
  date: string;
  investedPLN: number;
  eurRate: number;
  investedEUR: number;
  cryptoPriceEUR: number;
  quantity: number;
  feeEUR: number;
  source?: TransactionSource;
  cryptoPricePLN?: number;
};
