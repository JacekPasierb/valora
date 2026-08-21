import {CRYPTO_OPTIONS} from "@/data/cryptos";
import {fetchLatestNbpEurRate} from "@/lib/nbp";
import {CryptoSymbol} from "@/types/transaction";
import {NextResponse} from "next/server";

export type CryptoPrices = Record<
  CryptoSymbol,
  {
    pln: number;
    eur: number;
  }
>;

type EurPriceMap = Partial<Record<CryptoSymbol, number>>;

type BinanceTicker = {
  symbol: string;
  price: string;
};

async function fetchBinancePrices(baseUrl: string): Promise<EurPriceMap> {
  const symbols = CRYPTO_OPTIONS.map((crypto) => crypto.binanceSymbol);
  const symbolsParam = encodeURIComponent(JSON.stringify(symbols));
  const response = await fetch(
    `${baseUrl}/api/v3/ticker/price?symbols=${symbolsParam}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {Accept: "application/json"},
    },
  );

  if (!response.ok) {
    throw new Error(`Binance ${response.status} (${baseUrl})`);
  }

  const tickers = (await response.json()) as BinanceTicker[];
  const priceBySymbol = new Map(
    tickers.map((ticker) => [ticker.symbol, Number(ticker.price)]),
  );

  const prices: EurPriceMap = {};
  for (const crypto of CRYPTO_OPTIONS) {
    const eur = priceBySymbol.get(crypto.binanceSymbol);
    if (typeof eur === "number" && Number.isFinite(eur) && eur > 0) {
      prices[crypto.symbol] = eur;
    }
  }

  if (Object.keys(prices).length === 0) {
    throw new Error(`Binance puste ceny (${baseUrl})`);
  }

  return prices;
}

async function fetchKrakenPrices(): Promise<EurPriceMap> {
  const pairs = CRYPTO_OPTIONS.map((crypto) => crypto.krakenPair).join(",");
  const response = await fetch(
    `https://api.kraken.com/0/public/Ticker?pair=${pairs}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {Accept: "application/json"},
    },
  );

  if (!response.ok) {
    throw new Error(`Kraken ${response.status}`);
  }

  const payload = (await response.json()) as {
    error?: string[];
    result?: Record<string, {c?: string[]}>;
  };

  if (payload.error?.length) {
    throw new Error(`Kraken: ${payload.error.join(", ")}`);
  }

  const result = payload.result ?? {};
  const prices: EurPriceMap = {};

  for (const crypto of CRYPTO_OPTIONS) {
    const ticker =
      result[crypto.krakenPair] ??
      Object.entries(result).find(([key]) =>
        key.includes(crypto.symbol === "BTC" ? "XBT" : crypto.symbol),
      )?.[1];

    const eur = Number(ticker?.c?.[0]);
    if (Number.isFinite(eur) && eur > 0) {
      prices[crypto.symbol] = eur;
    }
  }

  if (Object.keys(prices).length === 0) {
    throw new Error("Kraken puste ceny");
  }

  return prices;
}

async function fetchCoinbasePrices(): Promise<EurPriceMap> {
  const entries = await Promise.all(
    CRYPTO_OPTIONS.map(async (crypto) => {
      const response = await fetch(
        `https://api.exchange.coinbase.com/products/${crypto.coinbaseProduct}/ticker`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
          headers: {Accept: "application/json"},
        },
      );

      if (!response.ok) {
        throw new Error(`Coinbase ${crypto.symbol} ${response.status}`);
      }

      const ticker = (await response.json()) as {price?: string};
      const eur = Number(ticker.price);
      if (!Number.isFinite(eur) || eur <= 0) {
        throw new Error(`Coinbase ${crypto.symbol} nieprawidłowa cena`);
      }

      return [crypto.symbol, eur] as const;
    }),
  );

  return Object.fromEntries(entries) as EurPriceMap;
}

function hasAllSymbols(prices: EurPriceMap): prices is Record<CryptoSymbol, number> {
  return CRYPTO_OPTIONS.every(
    (crypto) =>
      typeof prices[crypto.symbol] === "number" &&
      Number.isFinite(prices[crypto.symbol]) &&
      (prices[crypto.symbol] as number) > 0,
  );
}

async function fetchEurPrices(): Promise<{prices: Record<CryptoSymbol, number>; source: string}> {
  const attempts: Array<{name: string; run: () => Promise<EurPriceMap>}> = [
    {
      name: "binance",
      run: () => fetchBinancePrices("https://api.binance.com"),
    },
    {
      name: "binance-vision",
      run: () => fetchBinancePrices("https://data-api.binance.vision"),
    },
    {name: "kraken", run: fetchKrakenPrices},
    {name: "coinbase", run: fetchCoinbasePrices},
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const prices = await attempt.run();
      if (!hasAllSymbols(prices)) {
        throw new Error("brak pełnego zestawu symboli");
      }
      return {prices, source: attempt.name};
    } catch (error) {
      errors.push(
        `${attempt.name}: ${error instanceof Error ? error.message : "błąd"}`,
      );
    }
  }

  throw new Error(errors.join(" | "));
}

export async function GET() {
  try {
    const [{prices: eurPrices, source}, nbpRate] = await Promise.all([
      fetchEurPrices(),
      fetchLatestNbpEurRate(),
    ]);

    const prices = {} as CryptoPrices;
    for (const crypto of CRYPTO_OPTIONS) {
      const eur = eurPrices[crypto.symbol];
      prices[crypto.symbol] = {
        eur,
        pln: eur * nbpRate.rate,
      };
    }

    return NextResponse.json({
      prices,
      eurPlnRate: nbpRate.rate,
      eurPlnRateDate: nbpRate.effectiveDate,
      updatedAt: new Date().toISOString(),
      source: `${source}+nbp`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nieznany błąd połączenia.";

    console.error("GET /api/prices", message);

    return NextResponse.json(
      {
        error:
          "Nie udało się pobrać aktualnych cen kryptowalut. Spróbuj za chwilę.",
        details: message,
      },
      {status: 502},
    );
  }
}
