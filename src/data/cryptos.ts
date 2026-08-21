import {CryptoSymbol} from "@/types/transaction";

export type CryptoOption = {
  symbol: CryptoSymbol;
  label: string;
  binanceSymbol: string;
  krakenPair: string;
  coinbaseProduct: string;
};

export const CRYPTO_OPTIONS: CryptoOption[] = [
  {
    symbol: "BTC",
    label: "Bitcoin",
    binanceSymbol: "BTCEUR",
    krakenPair: "XXBTZEUR",
    coinbaseProduct: "BTC-EUR",
  },
  {
    symbol: "ETH",
    label: "Ethereum",
    binanceSymbol: "ETHEUR",
    krakenPair: "XETHZEUR",
    coinbaseProduct: "ETH-EUR",
  },
  {
    symbol: "XRP",
    label: "XRP",
    binanceSymbol: "XRPEUR",
    krakenPair: "XXRPZEUR",
    coinbaseProduct: "XRP-EUR",
  },
  {
    symbol: "SOL",
    label: "Solana",
    binanceSymbol: "SOLEUR",
    krakenPair: "SOLEUR",
    coinbaseProduct: "SOL-EUR",
  },
];

export function getCryptoLabel(symbol: CryptoSymbol): string {
  return CRYPTO_OPTIONS.find((crypto) => crypto.symbol === symbol)?.label ?? symbol;
}
