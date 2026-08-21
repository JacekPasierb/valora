import {CryptoSymbol} from "@/types/transaction";

export type CryptoOption = {
  symbol: CryptoSymbol;
  label: string;
  binanceSymbol: string;
};

export const CRYPTO_OPTIONS: CryptoOption[] = [
  {symbol: "BTC", label: "Bitcoin", binanceSymbol: "BTCEUR"},
  {symbol: "ETH", label: "Ethereum", binanceSymbol: "ETHEUR"},
  {symbol: "XRP", label: "XRP", binanceSymbol: "XRPEUR"},
  {symbol: "SOL", label: "Solana", binanceSymbol: "SOLEUR"},
];

export function getCryptoLabel(symbol: CryptoSymbol): string {
  return CRYPTO_OPTIONS.find((crypto) => crypto.symbol === symbol)?.label ?? symbol;
}
