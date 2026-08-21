"use client";

import {FormEvent, useState} from "react";
import {CRYPTO_OPTIONS} from "@/data/cryptos";
import {fetchNbpEurRate} from "@/lib/nbp";
import {CryptoSymbol, Transaction, TransactionSource} from "@/types/transaction";

type TransactionFormProps = {
  initialTransaction?: Transaction | null;
  onSaveTransaction: (transaction: Transaction) => void | Promise<void>;
  onCancelEdit?: () => void;
};

const inputClassName = "field-input placeholder:text-muted";

function toNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatRate(value: number): string {
  return value.toFixed(4);
}

function formatQuantity(value: number): string {
  return Number(value.toFixed(8)).toString();
}

function calcEur(pln: string, rate: string): string {
  const plnNumber = toNumber(pln);
  const rateNumber = toNumber(rate);

  if (!(plnNumber > 0) || !(rateNumber > 0)) {
    return "";
  }

  return formatMoney(plnNumber / rateNumber);
}

function calcPln(eur: string, rate: string): string {
  const eurNumber = toNumber(eur);
  const rateNumber = toNumber(rate);

  if (!(eurNumber > 0) || !(rateNumber > 0)) {
    return "";
  }

  return formatMoney(eurNumber * rateNumber);
}

function calcQuantity(eur: string, price: string): string {
  const eurNumber = toNumber(eur);
  const priceNumber = toNumber(price);

  if (!(eurNumber > 0) || !(priceNumber > 0)) {
    return "";
  }

  // Kraken podaje volume = koszt / cena; prowizja jest osobno i nie pomniejsza quantity
  return formatQuantity(eurNumber / priceNumber);
}

function calcImportedEur(quantity: string, avgPrice: string): string {
  const quantityNumber = toNumber(quantity);
  const avgPriceNumber = toNumber(avgPrice);

  if (!(quantityNumber > 0) || !(avgPriceNumber > 0)) {
    return "";
  }

  return formatMoney(quantityNumber * avgPriceNumber);
}

function calcImportedRate(pln: string, eur: string): string {
  const plnNumber = toNumber(pln);
  const eurNumber = toNumber(eur);

  if (!(plnNumber > 0) || !(eurNumber > 0)) {
    return "";
  }

  return formatRate(plnNumber / eurNumber);
}

function calcAvgFromTotal(pln: string, quantity: string): string {
  const plnNumber = toNumber(pln);
  const quantityNumber = toNumber(quantity);

  if (!(plnNumber > 0) || !(quantityNumber > 0)) {
    return "";
  }

  return Number((plnNumber / quantityNumber).toFixed(8)).toString();
}

function calcQuantityFromTotal(pln: string, avgPrice: string): string {
  const plnNumber = toNumber(pln);
  const avgPriceNumber = toNumber(avgPrice);

  if (!(plnNumber > 0) || !(avgPriceNumber > 0)) {
    return "";
  }

  return formatQuantity(plnNumber / avgPriceNumber);
}

function calcPriceEurFromPln(avgPln: string, rate: string): string {
  const avgPlnNumber = toNumber(avgPln);
  const rateNumber = toNumber(rate);

  if (!(avgPlnNumber > 0) || !(rateNumber > 0)) {
    return "";
  }

  return Number((avgPlnNumber / rateNumber).toFixed(8)).toString();
}

function hasValue(value: string): boolean {
  return toNumber(value) > 0;
}

type AvgPriceCurrency = "EUR" | "PLN";

type FormValues = {
  entryMode: TransactionSource;
  avgPriceCurrency: AvgPriceCurrency;
  cryptoSymbol: CryptoSymbol;
  date: string;
  investedPLN: string;
  eurRate: string;
  investedEUR: string;
  cryptoPriceEUR: string;
  avgPrice: string;
  quantity: string;
  feeEUR: string;
};

function getInitialFormValues(
  transaction?: Transaction | null,
): FormValues {
  if (!transaction) {
    return {
      entryMode: "purchase",
      avgPriceCurrency: "EUR",
      cryptoSymbol: "XRP",
      date: "",
      investedPLN: "",
      eurRate: "",
      investedEUR: "",
      cryptoPriceEUR: "",
      avgPrice: "",
      quantity: "",
      feeEUR: "",
    };
  }

  const isImported = transaction.source === "imported";
  const usePlnAvg =
    isImported &&
    transaction.cryptoPricePLN != null &&
    transaction.cryptoPricePLN > 0;

  return {
    entryMode: transaction.source ?? "purchase",
    avgPriceCurrency: usePlnAvg ? "PLN" : "EUR",
    cryptoSymbol: transaction.crypto,
    date: transaction.date,
    investedPLN:
      transaction.investedPLN > 0 ? String(transaction.investedPLN) : "",
    eurRate: transaction.eurRate > 0 ? formatRate(transaction.eurRate) : "",
    investedEUR:
      transaction.investedEUR > 0 ? formatMoney(transaction.investedEUR) : "",
    cryptoPriceEUR:
      transaction.cryptoPriceEUR > 0
        ? String(transaction.cryptoPriceEUR)
        : "",
    avgPrice: usePlnAvg
      ? String(transaction.cryptoPricePLN)
      : transaction.cryptoPriceEUR > 0
        ? String(transaction.cryptoPriceEUR)
        : "",
    quantity: String(transaction.quantity),
    feeEUR: transaction.feeEUR > 0 ? String(transaction.feeEUR) : "",
  };
}

export default function TransactionForm({
  initialTransaction = null,
  onSaveTransaction,
  onCancelEdit,
}: TransactionFormProps) {
  const isEditing = initialTransaction != null;
  const initialValues = getInitialFormValues(initialTransaction);

  const [entryMode, setEntryMode] = useState<TransactionSource>(
    initialValues.entryMode,
  );
  const [avgPriceCurrency, setAvgPriceCurrency] = useState<AvgPriceCurrency>(
    initialValues.avgPriceCurrency,
  );
  const [cryptoSymbol, setCryptoSymbol] = useState<CryptoSymbol>(
    initialValues.cryptoSymbol,
  );
  const [date, setDate] = useState(initialValues.date);
  const [investedPLN, setInvestedPLN] = useState(initialValues.investedPLN);
  const [eurRate, setEurRate] = useState(initialValues.eurRate);
  const [investedEUR, setInvestedEUR] = useState(initialValues.investedEUR);
  const [cryptoPriceEUR, setCryptoPriceEUR] = useState(
    initialValues.cryptoPriceEUR,
  );
  const [avgPrice, setAvgPrice] = useState(initialValues.avgPrice);
  const [quantity, setQuantity] = useState(initialValues.quantity);
  const [feeEUR, setFeeEUR] = useState(initialValues.feeEUR);
  const [isFetchingNbpRate, setIsFetchingNbpRate] = useState(false);
  const [nbpRateInfo, setNbpRateInfo] = useState("");
  const [nbpRateError, setNbpRateError] = useState("");

  const applyFromPln = (pln: string, rate: string, price: string) => {
    const nextEur = calcEur(pln, rate);
    setInvestedEUR(nextEur);
    setQuantity(calcQuantity(nextEur, price));
  };

  const applyFromEur = (eur: string, rate: string, price: string) => {
    const nextPln = calcPln(eur, rate);
    if (nextPln) {
      setInvestedPLN(nextPln);
    }
    setQuantity(calcQuantity(eur, price));
  };

  const applyFromRate = (
    rate: string,
    pln: string,
    eur: string,
    price: string,
  ) => {
    if (hasValue(eur)) {
      applyFromEur(eur, rate, price);
      return;
    }

    if (hasValue(pln)) {
      applyFromPln(pln, rate, price);
    }
  };

  const applyImportedEurMode = (
    nextQuantity: string,
    nextAvgEur: string,
    pln: string,
  ) => {
    const nextEur = calcImportedEur(nextQuantity, nextAvgEur);
    setCryptoPriceEUR(nextAvgEur);
    setInvestedEUR(nextEur);
    setEurRate(calcImportedRate(pln, nextEur));
  };

  const syncImportedEurFromPln = (
    nextPln: string,
    nextAvgPln: string,
    rate: string,
  ) => {
    if (!hasValue(rate)) {
      setInvestedEUR("");
      setCryptoPriceEUR("");
      return;
    }

    setInvestedEUR(calcEur(nextPln, rate));
    setCryptoPriceEUR(calcPriceEurFromPln(nextAvgPln, rate));
  };

  const applyImportedPlnFromQuantity = (
    nextQuantity: string,
    nextAvgPln: string,
    nextPln: string,
    rate: string,
  ) => {
    if (hasValue(nextAvgPln)) {
      const calculatedPln = calcImportedEur(nextQuantity, nextAvgPln);
      setInvestedPLN(calculatedPln);
      syncImportedEurFromPln(calculatedPln, nextAvgPln, rate);
      return;
    }

    if (hasValue(nextPln)) {
      const calculatedAvg = calcAvgFromTotal(nextPln, nextQuantity);
      setAvgPrice(calculatedAvg);
      syncImportedEurFromPln(nextPln, calculatedAvg, rate);
    }
  };

  const applyImportedPlnFromAvg = (
    nextQuantity: string,
    nextAvgPln: string,
    nextPln: string,
    rate: string,
  ) => {
    if (hasValue(nextQuantity)) {
      const calculatedPln = calcImportedEur(nextQuantity, nextAvgPln);
      setInvestedPLN(calculatedPln);
      syncImportedEurFromPln(calculatedPln, nextAvgPln, rate);
      return;
    }

    if (hasValue(nextPln)) {
      const calculatedQuantity = calcQuantityFromTotal(nextPln, nextAvgPln);
      setQuantity(calculatedQuantity);
      syncImportedEurFromPln(nextPln, nextAvgPln, rate);
    }
  };

  const applyImportedPlnFromTotal = (
    nextQuantity: string,
    nextAvgPln: string,
    nextPln: string,
    rate: string,
  ) => {
    if (hasValue(nextQuantity)) {
      const calculatedAvg = calcAvgFromTotal(nextPln, nextQuantity);
      setAvgPrice(calculatedAvg);
      syncImportedEurFromPln(nextPln, calculatedAvg, rate);
      return;
    }

    if (hasValue(nextAvgPln)) {
      const calculatedQuantity = calcQuantityFromTotal(nextPln, nextAvgPln);
      setQuantity(calculatedQuantity);
      syncImportedEurFromPln(nextPln, nextAvgPln, rate);
    }
  };

  const resetForm = () => {
    setCryptoSymbol("XRP");
    setDate("");
    setInvestedPLN("");
    setEurRate("");
    setInvestedEUR("");
    setCryptoPriceEUR("");
    setAvgPrice("");
    setQuantity("");
    setFeeEUR("");
    setNbpRateInfo("");
    setNbpRateError("");
  };

  const handleFetchNbpRate = async () => {
    if (!date) {
      setNbpRateError("Najpierw ustaw datę transakcji.");
      return;
    }

    setIsFetchingNbpRate(true);
    setNbpRateError("");
    setNbpRateInfo("");

    try {
      const result = await fetchNbpEurRate(date);
      const nextRate = formatRate(result.rate);
      setEurRate(nextRate);
      syncImportedEurFromPln(investedPLN, avgPrice, nextRate);
      setNbpRateInfo(
        `Kurs NBP z ${result.effectiveDate}: ${nextRate} zł (średni)`,
      );
    } catch (error) {
      setNbpRateError(
        error instanceof Error
          ? error.message
          : "Nie udało się pobrać kursu NBP.",
      );
    } finally {
      setIsFetchingNbpRate(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isImported = entryMode === "imported";
    const quantityNumber = toNumber(quantity);
    const investedPLNNumber = toNumber(investedPLN);
    const investedEURNumber = toNumber(investedEUR) || 0;
    const eurRateNumber = toNumber(eurRate) || 0;
    const cryptoPriceEURNumber = toNumber(cryptoPriceEUR) || 0;

    const cryptoPricePLNNumber =
      isImported && avgPriceCurrency === "PLN"
        ? toNumber(avgPrice)
        : quantityNumber > 0 && investedPLNNumber > 0
          ? investedPLNNumber / quantityNumber
          : cryptoPriceEURNumber > 0 && eurRateNumber > 0
            ? cryptoPriceEURNumber * eurRateNumber
            : 0;

    const resolvedPriceEUR =
      cryptoPriceEURNumber > 0
        ? cryptoPriceEURNumber
        : cryptoPricePLNNumber > 0 && eurRateNumber > 0
          ? cryptoPricePLNNumber / eurRateNumber
          : quantityNumber > 0 && investedEURNumber > 0
            ? investedEURNumber / quantityNumber
            : 0;

    const newTransaction: Transaction = {
      id: initialTransaction?.id ?? crypto.randomUUID(),
      crypto: cryptoSymbol,
      date,
      investedPLN: investedPLNNumber,
      eurRate: eurRateNumber,
      investedEUR: investedEURNumber,
      cryptoPriceEUR: resolvedPriceEUR,
      quantity: quantityNumber,
      feeEUR: isImported ? 0 : toNumber(feeEUR),
      source: entryMode,
      cryptoPricePLN: cryptoPricePLNNumber > 0 ? cryptoPricePLNNumber : undefined,
    };

    await onSaveTransaction(newTransaction);
    if (!isEditing) {
      resetForm();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-strong w-full max-w-xl rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-6 md:p-7"
    >
      <h2 className="brand-mark mb-2 text-2xl font-bold text-ink">
        {isEditing ? "Edytuj transakcję" : "Dodaj transakcję"}
      </h2>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-paper p-1">
        <button
          type="button"
          onClick={() => {
            setEntryMode("purchase");
            resetForm();
          }}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            entryMode === "purchase"
              ? "bg-ink text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          Zakup (Revolut → Kraken)
        </button>
        <button
          type="button"
          onClick={() => {
            setEntryMode("imported");
            resetForm();
          }}
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            entryMode === "imported"
              ? "bg-ink text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          Przeniesione z giełdy
        </button>
      </div>

      <p className="mb-6 text-sm text-muted">
        {entryMode === "purchase"
          ? "Pełny przebieg: Revolut (PLN → EUR) → Kraken → zakup"
          : "Gdy nie pamiętasz opłat — wpisz ilość, całkowity koszt i średnią cenę"}
      </p>

      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            1. Podstawy
          </h3>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              {entryMode === "purchase" ? "Data zakupu" : "Data przeniesienia"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              Krypto
            </label>
            <select
              value={cryptoSymbol}
              onChange={(event) =>
                setCryptoSymbol(event.target.value as CryptoSymbol)
              }
              className={inputClassName}
            >
              {CRYPTO_OPTIONS.map((crypto) => (
                <option key={crypto.symbol} value={crypto.symbol}>
                  {crypto.label} - {crypto.symbol}
                </option>
              ))}
            </select>
          </div>
        </section>

        {entryMode === "purchase" ? (
          <>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                2. Revolut — wpłata i przewalutowanie
              </h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Wpłacono PLN
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={investedPLN}
                  onChange={(event) => {
                    const value = event.target.value;
                    setInvestedPLN(value);
                    applyFromPln(value, eurRate, cryptoPriceEUR);
                  }}
                  placeholder="100"
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Kurs EUR (PLN za 1 EUR)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={eurRate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEurRate(value);
                    applyFromRate(
                      value,
                      investedPLN,
                      investedEUR,
                      cryptoPriceEUR,
                    );
                  }}
                  placeholder="4.3368"
                  required
                  className={inputClassName}
                />
                <p className="mt-1.5 text-xs text-muted">
                  PLN ↔ EUR przeliczają się wzajemnie przez kurs
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Otrzymano EUR (po przewalutowaniu)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={investedEUR}
                  onChange={(event) => {
                    const value = event.target.value;
                    setInvestedEUR(value);
                    applyFromEur(value, eurRate, cryptoPriceEUR);
                  }}
                  placeholder="23.05"
                  required
                  className={inputClassName}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                3. Kraken — zakup
              </h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Cena zakupu (EUR za 1 szt.)
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={cryptoPriceEUR}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCryptoPriceEUR(value);
                    setQuantity(calcQuantity(investedEUR, value));
                  }}
                  placeholder="1.17499"
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Prowizja Krakena (EUR)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={feeEUR}
                  onChange={(event) => setFeeEUR(event.target.value)}
                  placeholder="0.1844"
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Ilość krypto
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="19.61702128"
                  required
                  className={inputClassName}
                />
                <p className="mt-1.5 text-xs text-muted">
                  Ilość = EUR ÷ cena (jak volume z giełdy). Prowizja jest osobno
                  i nie pomniejsza ilości — możesz wkleić dokładną wartość z
                  Krakena.
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              2. Dane z poprzedniej giełdy
            </h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Ilość krypto
              </label>
              <input
                type="number"
                step="0.00000001"
                value={quantity}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuantity(value);

                  if (avgPriceCurrency === "EUR") {
                    applyImportedEurMode(value, avgPrice, investedPLN);
                  } else {
                    applyImportedPlnFromQuantity(
                      value,
                      avgPrice,
                      investedPLN,
                      eurRate,
                    );
                  }
                }}
                placeholder="227.37174"
                required
                className={inputClassName}
              />
            </div>

            <div>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium text-ink">
                  Średnia cena zakupu
                </label>

                <div className="flex w-fit rounded-lg bg-paper p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAvgPriceCurrency("EUR");
                      setAvgPrice("");
                      setCryptoPriceEUR("");
                      setInvestedEUR("");
                      setEurRate("");
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      avgPriceCurrency === "EUR"
                        ? "bg-ink text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    EUR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvgPriceCurrency("PLN");
                      setAvgPrice("");
                      setCryptoPriceEUR("");
                      setInvestedEUR("");
                      setEurRate("");
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      avgPriceCurrency === "PLN"
                        ? "bg-ink text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    PLN
                  </button>
                </div>
              </div>

              <input
                type="number"
                step="0.00000001"
                value={avgPrice}
                onChange={(event) => {
                  const value = event.target.value;
                  setAvgPrice(value);

                  if (avgPriceCurrency === "EUR") {
                    applyImportedEurMode(quantity, value, investedPLN);
                  } else {
                    applyImportedPlnFromAvg(
                      quantity,
                      value,
                      investedPLN,
                      eurRate,
                    );
                  }
                }}
                placeholder={avgPriceCurrency === "EUR" ? "2400" : "6.38"}
                required
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-muted">
                {avgPriceCurrency === "EUR"
                  ? "Średnia cena w euro za 1 sztukę"
                  : "Średnia = koszt ÷ ilość (albo wpisz ręcznie)"}
              </p>
            </div>

            {avgPriceCurrency === "EUR" ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Całkowity koszt (PLN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={investedPLN}
                  onChange={(event) => {
                    const value = event.target.value;
                    setInvestedPLN(value);
                    setEurRate(calcImportedRate(value, investedEUR));
                  }}
                  placeholder="5000"
                  required
                  className={inputClassName}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Całkowity koszt (PLN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={investedPLN}
                    onChange={(event) => {
                      const value = event.target.value;
                      setInvestedPLN(value);
                      applyImportedPlnFromTotal(
                        quantity,
                        avgPrice,
                        value,
                        eurRate,
                      );
                    }}
                    placeholder="1450"
                    required
                    className={inputClassName}
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Np. 1450 zł + ilość 227,37174 → średnia ≈ 6,38 zł
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Kurs EUR
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      value={eurRate}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEurRate(value);
                        setNbpRateInfo("");
                        syncImportedEurFromPln(investedPLN, avgPrice, value);
                      }}
                      placeholder="4.30"
                      className={inputClassName}
                    />
                    <button
                      type="button"
                      onClick={handleFetchNbpRate}
                      disabled={isFetchingNbpRate || !date}
                      className="shrink-0 rounded-lg border border-line px-3 py-3 text-sm text-ink transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isFetchingNbpRate ? "Pobieram…" : "Kurs NBP"}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Nie musisz pamiętać kursu — pobierz średni kurs NBP z daty
                    transakcji. Do porównania z ceną rynkową wystarczy też sama
                    średnia PLN.
                  </p>
                  {nbpRateInfo && (
                    <p className="mt-1.5 text-xs text-gain">{nbpRateInfo}</p>
                  )}
                  {nbpRateError && (
                    <p className="mt-1.5 text-xs text-loss">{nbpRateError}</p>
                  )}
                </div>
              </>
            )}

            <div className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">
              <p>
                Całkowity koszt PLN:{" "}
                <span className="font-medium text-ink">
                  {investedPLN ? `${investedPLN} zł` : "—"}
                </span>
              </p>
              <p className="mt-1">
                Średnia PLN:{" "}
                <span className="font-medium text-ink">
                  {avgPriceCurrency === "PLN" && avgPrice
                    ? `${avgPrice} zł`
                    : "—"}
                </span>
              </p>
              <p className="mt-1">
                Koszt w EUR:{" "}
                <span className="font-medium text-ink">
                  {investedEUR ? `€${investedEUR}` : "—"}
                </span>
              </p>
              <p className="mt-1">
                Średnia w EUR:{" "}
                <span className="font-medium text-ink">
                  {cryptoPriceEUR ? `€${cryptoPriceEUR}` : "—"}
                </span>
              </p>
              <p className="mt-1">
                Kurs EUR:{" "}
                <span className="font-medium text-ink">
                  {eurRate || "—"}
                </span>
              </p>
              <p className="mt-1">Prowizja: brak (0 EUR)</p>
            </div>
          </section>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button type="submit" className="btn-primary">
          {isEditing ? "Zapisz zmiany" : "Zapisz transakcję"}
        </button>

        {isEditing && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="btn-secondary">
            Anuluj
          </button>
        )}
      </div>
    </form>
  );
}
