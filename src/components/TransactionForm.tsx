"use client";

import {FormEvent, useMemo, useState} from "react";
import {CRYPTO_OPTIONS} from "@/data/cryptos";
import {fetchNbpEurRate} from "@/lib/nbp";
import {
  formatCryptoQuantity,
  formatMoneyEUR,
  formatMoneyPLN,
  getAvailableQuantity,
  getHoldingsStats,
} from "@/lib/transactionStats";
import {
  CryptoSymbol,
  Transaction,
  TransactionSource,
} from "@/types/transaction";

type TransactionFormProps = {
  initialTransaction?: Transaction | null;
  transactions?: Transaction[];
  onSaveTransaction: (transaction: Transaction) => void | Promise<void>;
  onCancelEdit?: () => void;
};

type EntryMode = TransactionSource | "sell";

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
  entryMode: EntryMode;
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
  netSaleEUR: string;
};

function getInitialFormValues(transaction?: Transaction | null): FormValues {
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
      netSaleEUR: "",
    };
  }

  if (transaction.side === "sell") {
    return {
      entryMode: "sell",
      avgPriceCurrency: "EUR",
      cryptoSymbol: transaction.crypto,
      date: transaction.date,
      investedPLN: "",
      eurRate: transaction.eurRate > 0 ? formatRate(transaction.eurRate) : "",
      investedEUR: "",
      cryptoPriceEUR:
        transaction.cryptoPriceEUR > 0
          ? String(transaction.cryptoPriceEUR)
          : "",
      avgPrice: "",
      quantity: String(transaction.quantity),
      feeEUR: transaction.feeEUR > 0 ? String(transaction.feeEUR) : "",
      netSaleEUR:
        transaction.netSaleEUR != null
          ? formatMoney(transaction.netSaleEUR)
          : "",
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
    netSaleEUR: "",
  };
}

export default function TransactionForm({
  initialTransaction = null,
  transactions = [],
  onSaveTransaction,
  onCancelEdit,
}: TransactionFormProps) {
  const isEditing = initialTransaction != null;
  const initialValues = getInitialFormValues(initialTransaction);

  const [entryMode, setEntryMode] = useState<EntryMode>(
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
  const [netSaleEUR, setNetSaleEUR] = useState(initialValues.netSaleEUR);
  const [isFetchingNbpRate, setIsFetchingNbpRate] = useState(false);
  const [nbpRateInfo, setNbpRateInfo] = useState("");
  const [nbpRateError, setNbpRateError] = useState("");
  const [formError, setFormError] = useState("");

  const availableQuantity = useMemo(
    () =>
      getAvailableQuantity(
        transactions,
        cryptoSymbol,
        initialTransaction?.id,
      ),
    [transactions, cryptoSymbol, initialTransaction?.id],
  );

  const positionStats = useMemo(() => {
    const relevant = transactions.filter(
      (transaction) =>
        transaction.crypto === cryptoSymbol &&
        transaction.id !== initialTransaction?.id,
    );
    return getHoldingsStats(relevant);
  }, [transactions, cryptoSymbol, initialTransaction?.id]);

  const sellPreview = useMemo(() => {
    const qty = toNumber(quantity);
    const price = toNumber(cryptoPriceEUR);
    const fee = toNumber(feeEUR) || 0;
    const rate = toNumber(eurRate);
    const gross = qty > 0 && price > 0 ? qty * price : 0;
    const net =
      toNumber(netSaleEUR) > 0
        ? toNumber(netSaleEUR)
        : gross > 0
          ? Math.max(0, gross - fee)
          : 0;
    const netPln = rate > 0 && net > 0 ? net * rate : 0;
    const avgPln = positionStats.averagePLN;
    const avgEur = positionStats.averageEUR;
    const costSoldPln =
      qty > 0 && avgPln != null ? qty * avgPln : 0;
    const costSoldEur =
      qty > 0 && avgEur != null
        ? qty * avgEur
        : rate > 0 && costSoldPln > 0
          ? costSoldPln / rate
          : 0;
    const realized = netPln - costSoldPln;

    return {
      gross,
      net,
      netPln,
      costSoldPln,
      costSoldEur,
      realized,
      avgPln,
      avgEur,
    };
  }, [
    quantity,
    cryptoPriceEUR,
    feeEUR,
    eurRate,
    netSaleEUR,
    positionStats.averagePLN,
    positionStats.averageEUR,
  ]);

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

  const syncSellNetFromGross = (qty: string, price: string, fee: string) => {
    const qtyN = toNumber(qty);
    const priceN = toNumber(price);
    const feeN = toNumber(fee) || 0;
    if (qtyN > 0 && priceN > 0) {
      setNetSaleEUR(formatMoney(Math.max(0, qtyN * priceN - feeN)));
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
    setNetSaleEUR("");
    setNbpRateInfo("");
    setNbpRateError("");
    setFormError("");
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
      if (entryMode === "imported") {
        syncImportedEurFromPln(investedPLN, avgPrice, nextRate);
      }
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
    setFormError("");

    const quantityNumber = toNumber(quantity);
    const eurRateNumber = toNumber(eurRate) || 0;

    if (entryMode === "sell") {
      if (!(quantityNumber > 0)) {
        setFormError("Podaj ilość sprzedawanej kryptowaluty.");
        return;
      }
      if (quantityNumber > availableQuantity + 1e-12) {
        setFormError(
          `Nie możesz sprzedać więcej niż posiadasz (${formatCryptoQuantity(availableQuantity)}).`,
        );
        return;
      }
      if (!(sellPreview.avgPln != null && sellPreview.avgPln > 0)) {
        setFormError("Brak średniej zakupu dla tej pozycji — nie da się sprzedać.");
        return;
      }
      if (!(sellPreview.net > 0) || !(eurRateNumber > 0)) {
        setFormError("Podaj cenę/netto sprzedaży oraz kurs EUR.");
        return;
      }

      const sellPriceEUR = toNumber(cryptoPriceEUR);
      const costSoldPLN = Number(sellPreview.costSoldPln.toFixed(2));
      const costSoldEUR = Number(sellPreview.costSoldEur.toFixed(2));
      const netSaleEURNumber = Number(sellPreview.net.toFixed(2));
      const netSalePLNNumber = Number(sellPreview.netPln.toFixed(2));
      const realizedProfitPLN = Number(
        (netSalePLNNumber - costSoldPLN).toFixed(2),
      );

      const newTransaction: Transaction = {
        id: initialTransaction?.id ?? crypto.randomUUID(),
        crypto: cryptoSymbol,
        date,
        investedPLN: costSoldPLN,
        eurRate: eurRateNumber,
        investedEUR: costSoldEUR,
        cryptoPriceEUR: sellPriceEUR,
        quantity: quantityNumber,
        feeEUR: toNumber(feeEUR) || 0,
        side: "sell",
        cryptoPricePLN:
          sellPriceEUR > 0 && eurRateNumber > 0
            ? Number((sellPriceEUR * eurRateNumber).toFixed(8))
            : undefined,
        netSaleEUR: netSaleEURNumber,
        netSalePLN: netSalePLNNumber,
        realizedProfitPLN,
      };

      await onSaveTransaction(newTransaction);
      if (!isEditing) {
        resetForm();
      }
      return;
    }

    const isImported = entryMode === "imported";
    const investedPLNNumber = toNumber(investedPLN);
    const investedEURNumber = toNumber(investedEUR) || 0;
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
      side: "buy",
      cryptoPricePLN: cryptoPricePLNNumber > 0 ? cryptoPricePLNNumber : undefined,
    };

    await onSaveTransaction(newTransaction);
    if (!isEditing) {
      resetForm();
    }
  };

  const switchMode = (mode: EntryMode) => {
    setEntryMode(mode);
    resetForm();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-strong w-full max-w-xl rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-6 md:p-7"
    >
      <h2 className="brand-mark mb-2 text-2xl font-bold text-ink">
        {isEditing ? "Edytuj transakcję" : "Dodaj transakcję"}
      </h2>

      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-line bg-paper p-1">
        <button
          type="button"
          onClick={() => switchMode("purchase")}
          className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
            entryMode === "purchase"
              ? "bg-ink text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          Zakup
        </button>
        <button
          type="button"
          onClick={() => switchMode("imported")}
          className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
            entryMode === "imported"
              ? "bg-ink text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          Import
        </button>
        <button
          type="button"
          onClick={() => switchMode("sell")}
          className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
            entryMode === "sell"
              ? "bg-ink text-white"
              : "text-muted hover:text-ink"
          }`}
        >
          Sprzedaż
        </button>
      </div>

      <p className="mb-6 text-sm text-muted">
        {entryMode === "purchase"
          ? "Revolut (PLN → EUR) → Kraken → zakup. Liczy się do kapitału własnego (koszt pozycji)."
          : entryMode === "imported"
            ? "Import z innej giełdy — wchodzi w średnią i w kapitał własny (koszt pozycji)."
            : "Sprzedaż na Krakenie w EUR. Netto zostaje na giełdzie i zasila pulę „Odzyskane” (PLN)."}
      </p>

      {formError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {formError}
        </p>
      ) : null}

      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            1. Podstawy
          </h3>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              {entryMode === "sell"
                ? "Data sprzedaży"
                : entryMode === "purchase"
                  ? "Data zakupu"
                  : "Data przeniesienia"}
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
            {entryMode === "sell" ? (
              <p className="mt-1.5 text-xs text-muted">
                Dostępne:{" "}
                <span className="font-medium text-ink">
                  {formatCryptoQuantity(Math.max(0, availableQuantity))}
                </span>
                {positionStats.averagePLN != null
                  ? ` · średnia ${formatMoneyPLN(positionStats.averagePLN)}`
                  : ""}
              </p>
            ) : null}
          </div>
        </section>

        {entryMode === "sell" ? (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              2. Sprzedaż na Krakenie (EUR)
            </h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Ilość sprzedawana
              </label>
              <input
                type="number"
                step="0.00000001"
                value={quantity}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuantity(value);
                  syncSellNetFromGross(value, cryptoPriceEUR, feeEUR);
                }}
                placeholder="0.00757"
                required
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Cena sprzedaży (EUR za 1 szt.)
              </label>
              <input
                type="number"
                step="0.00001"
                value={cryptoPriceEUR}
                onChange={(event) => {
                  const value = event.target.value;
                  setCryptoPriceEUR(value);
                  syncSellNetFromGross(quantity, value, feeEUR);
                }}
                placeholder="2400"
                required
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Prowizja (EUR)
              </label>
              <input
                type="number"
                step="0.0001"
                value={feeEUR}
                onChange={(event) => {
                  const value = event.target.value;
                  setFeeEUR(value);
                  syncSellNetFromGross(quantity, cryptoPriceEUR, value);
                }}
                placeholder="0.12"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Kwota netto (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={netSaleEUR}
                onChange={(event) => setNetSaleEUR(event.target.value)}
                placeholder="17.67"
                required
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-muted">
                EUR zostaje na Krakenie. Valora dolicza to do puli „Odzyskane” po
                przeliczeniu na PLN.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink">
                Kurs EUR (PLN za 1 EUR)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={eurRate}
                  onChange={(event) => {
                    setEurRate(event.target.value);
                    setNbpRateInfo("");
                  }}
                  placeholder="4.30"
                  required
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={handleFetchNbpRate}
                  disabled={isFetchingNbpRate || !date}
                  className="shrink-0 rounded-lg border border-line px-3 py-3 text-sm text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFetchingNbpRate ? "Pobieram…" : "Kurs NBP"}
                </button>
              </div>
              {nbpRateInfo && (
                <p className="mt-1.5 text-xs text-gain">{nbpRateInfo}</p>
              )}
              {nbpRateError && (
                <p className="mt-1.5 text-xs text-loss">{nbpRateError}</p>
              )}
            </div>

            <div className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">
              <p>
                Odzyskane (netto PLN):{" "}
                <span className="font-semibold text-ink">
                  {sellPreview.netPln > 0
                    ? formatMoneyPLN(sellPreview.netPln)
                    : "—"}
                </span>
              </p>
              <p className="mt-1">
                Koszt sprzedanej części:{" "}
                <span className="font-medium text-ink">
                  {sellPreview.costSoldPln > 0
                    ? formatMoneyPLN(sellPreview.costSoldPln)
                    : "—"}
                </span>
              </p>
              <p className="mt-1">
                Zysk zrealizowany:{" "}
                <span
                  className={`font-semibold ${
                    sellPreview.netPln > 0
                      ? sellPreview.realized >= 0
                        ? "text-gain"
                        : "text-loss"
                      : "text-ink"
                  }`}
                >
                  {sellPreview.netPln > 0
                    ? `${sellPreview.realized >= 0 ? "+" : ""}${formatMoneyPLN(sellPreview.realized)}`
                    : "—"}
                </span>
              </p>
              <p className="mt-2 text-xs">
                Odzyskane ≠ zysk. Do puli idzie pełne netto (np.{" "}
                {sellPreview.net > 0
                  ? formatMoneyEUR(sellPreview.net)
                  : "17,67 EUR"}
                ), a zysk to netto minus koszt części.
              </p>
            </div>
          </section>
        ) : entryMode === "purchase" ? (
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
                      className="shrink-0 rounded-lg border border-line px-3 py-3 text-sm text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isFetchingNbpRate ? "Pobieram…" : "Kurs NBP"}
                    </button>
                  </div>
                  {nbpRateInfo && (
                    <p className="mt-1.5 text-xs text-gain">{nbpRateInfo}</p>
                  )}
                  {nbpRateError && (
                    <p className="mt-1.5 text-xs text-loss">{nbpRateError}</p>
                  )}
                </div>
              </>
            )}
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
