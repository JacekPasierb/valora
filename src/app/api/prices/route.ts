import {CRYPTO_OPTIONS} from "@/data/cryptos";
import {fetchLatestNbpEurRate} from "@/lib/nbp";
import {CryptoSymbol} from "@/types/transaction";
import {NextResponse} from "next/server";

type BinanceTicker = {
  symbol: string;
  price: string;
};

export type CryptoPrices = Record<
  CryptoSymbol,
  {
    pln: number;
    eur: number;
  }
>;

export async function GET() {
  try {
    const symbols = CRYPTO_OPTIONS.map((crypto) => crypto.binanceSymbol);
    const symbolsParam = encodeURIComponent(JSON.stringify(symbols));

    const [cryptoResponse, nbpRate] = await Promise.all([
      fetch(
        `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        },
      ),
      fetchLatestNbpEurRate(),
    ]);

    if (!cryptoResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Nie udało się pobrać aktualnych cen z Binance. Spróbuj za chwilę.",
        },
        {status: 502},
      );
    }

    const tickers = (await cryptoResponse.json()) as BinanceTicker[];
    const priceBySymbol = new Map(
      tickers.map((ticker) => [ticker.symbol, Number(ticker.price)]),
    );

    const prices = {} as CryptoPrices;

    for (const crypto of CRYPTO_OPTIONS) {
      const eur = priceBySymbol.get(crypto.binanceSymbol) ?? 0;
      prices[crypto.symbol] = {
        eur,
        pln: eur > 0 ? eur * nbpRate.rate : 0,
      };
    }

    return NextResponse.json({
      prices,
      eurPlnRate: nbpRate.rate,
      eurPlnRateDate: nbpRate.effectiveDate,
      updatedAt: new Date().toISOString(),
      source: "binance+nbp",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nieznany błąd połączenia.";

    return NextResponse.json(
      {
        error: `Błąd połączenia z serwisem cen: ${message}`,
      },
      {status: 502},
    );
  }
}
