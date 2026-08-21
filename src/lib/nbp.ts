type NbpRateResponse = {
  rates: Array<{
    effectiveDate: string;
    mid: number;
  }>;
};

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export type NbpEurRate = {
  rate: number;
  effectiveDate: string;
};

export async function fetchNbpEurRate(date: string): Promise<NbpEurRate> {
  let currentDate = date;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await fetch(
      `https://api.nbp.pl/api/exchangerates/rates/a/eur/${currentDate}/?format=json`,
    );

    if (response.ok) {
      const data = (await response.json()) as NbpRateResponse;
      const rate = data.rates[0];

      if (!rate) {
        throw new Error("Brak kursu EUR w odpowiedzi NBP.");
      }

      return {
        rate: rate.mid,
        effectiveDate: rate.effectiveDate,
      };
    }

    if (response.status !== 404) {
      throw new Error("Nie udało się pobrać kursu EUR z NBP.");
    }

    currentDate = shiftDate(currentDate, -1);
  }

  throw new Error("Nie znaleziono kursu EUR NBP dla tej daty.");
}

export async function fetchLatestNbpEurRate(): Promise<NbpEurRate> {
  const response = await fetch(
    "https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json",
    {cache: "no-store"},
  );

  if (!response.ok) {
    const today = new Date().toISOString().slice(0, 10);
    return fetchNbpEurRate(today);
  }

  const data = (await response.json()) as NbpRateResponse;
  const rate = data.rates[0];

  if (!rate) {
    throw new Error("Brak aktualnego kursu EUR w odpowiedzi NBP.");
  }

  return {
    rate: rate.mid,
    effectiveDate: rate.effectiveDate,
  };
}
