export type CryptoSymbol = "BTC" | "ETH" | "XRP" | "SOL";

export type TransactionSource = "purchase" | "imported";

export type TransactionSide = "buy" | "sell";

export type Transaction = {
  id: string;
  crypto: CryptoSymbol;
  date: string;
  /** BUY: koszt pozycji. SELL: costSold (koszt zdjęty z pozycji — NIE kwota sprzedaży). */
  investedPLN: number;
  eurRate: number;
  /** BUY: koszt w EUR. SELL: costSold w EUR. */
  investedEUR: number;
  cryptoPriceEUR: number;
  quantity: number;
  feeEUR: number;
  source?: TransactionSource;
  cryptoPricePLN?: number;
  /** Brak lub "buy" = zakup/import. */
  side?: TransactionSide;
  /** SELL: kwota netto w EUR (zostaje na Krakenie). */
  netSaleEUR?: number;
  /** SELL: kwota netto w PLN → pula „Odzyskane”. */
  netSalePLN?: number;
  /** SELL: netSalePLN − costSold. */
  realizedProfitPLN?: number;
};
