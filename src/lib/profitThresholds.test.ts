import {describe, expect, it} from "vitest";
import {
  buildProfitCycles,
  getNextThreshold,
  getProfitPercentAtSell,
  getProfitThresholdStatus,
  PROFIT_THRESHOLDS,
} from "@/lib/profitThresholds";
import {Transaction} from "@/types/transaction";

function buy(overrides: Partial<Transaction> & Pick<Transaction, "id" | "quantity" | "investedPLN">): Transaction {
  return {
    crypto: "ETH",
    date: "2026-01-01",
    eurRate: 4.3,
    investedEUR: overrides.investedPLN / 4.3,
    cryptoPriceEUR: 0,
    feeEUR: 0,
    side: "buy",
    source: "purchase",
    ...overrides,
  };
}

function sell(input: {
  id: string;
  date?: string;
  quantity: number;
  investedPLN: number;
  netSalePLN: number;
}): Transaction {
  const {id, quantity, investedPLN, netSalePLN} = input;
  const unitPln = netSalePLN / quantity;
  return {
    id,
    crypto: "ETH",
    date: input.date ?? "2026-02-01",
    eurRate: 4.3,
    investedPLN,
    investedEUR: investedPLN / 4.3,
    cryptoPriceEUR: unitPln / 4.3,
    cryptoPricePLN: unitPln,
    quantity,
    feeEUR: 0,
    side: "sell",
    netSalePLN,
    netSaleEUR: netSalePLN / 4.3,
    realizedProfitPLN: netSalePLN - investedPLN,
  };
}

describe("profit thresholds helpers", () => {
  it("liczy % przy sprzedaży względem średniej", () => {
    // średnia 100, sprzedaż 130 → +30%
    expect(getProfitPercentAtSell(100, 130)).toBeCloseTo(30, 5);
  });

  it("zwraca kolejny niewykorzystany próg", () => {
    expect(getNextThreshold([])).toBe(30);
    expect(getNextThreshold([30])).toBe(50);
    expect(getNextThreshold([30, 50, 80])).toBe(100);
    expect(getNextThreshold([...PROFIT_THRESHOLDS])).toBeNull();
  });
});

describe("cykle realizacji zysku", () => {
  it("realizuje próg +30% przy SELL z zyskiem ≥ 30%", () => {
    // qty 1, koszt 100 → avg 100; sell 0.2 @ 130 → +30%
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      sell({
        id: "s1",
        date: "2026-02-10",
        quantity: 0.2,
        investedPLN: 20,
        netSalePLN: 26,
      }),
    ];

    const cycles = buildProfitCycles("ETH", txs);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!.realizedThresholds).toEqual([30]);
    expect(cycles[0]!.realizations[0]!.threshold).toBe(30);
  });

  it("po SELL nie sugeruje ponownie +30% — następny próg to +50%", () => {
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      sell({
        id: "s1",
        date: "2026-02-10",
        quantity: 0.2,
        investedPLN: 20,
        netSalePLN: 26,
      }),
    ];

    const status = getProfitThresholdStatus("ETH", txs, 31.2, 0.8);
    expect(status.lastRealizedThreshold).toBe(30);
    expect(status.nextThreshold).toBe(50);
    expect(status.suggestionActive).toBe(false);
    expect(status.statusLabel).toContain("+30%");
  });

  it("w tym samym cyklu przechodzi do +50% po drugiej sprzedaży przy ≥50%", () => {
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      sell({
        id: "s1",
        date: "2026-02-10",
        quantity: 0.2,
        investedPLN: 20,
        netSalePLN: 26, // +30%
      }),
      // avg nadal 100; sell @ 150 → +50%
      sell({
        id: "s2",
        date: "2026-03-10",
        quantity: 0.16,
        investedPLN: 16,
        netSalePLN: 24,
      }),
    ];

    const cycles = buildProfitCycles("ETH", txs);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!.realizedThresholds).toEqual([30, 50]);

    const status = getProfitThresholdStatus("ETH", txs, 55, 0.64);
    expect(status.nextThreshold).toBe(80);
    expect(status.suggestionActive).toBe(false);
  });

  it("SELL poniżej progu nie oznacza progu jako zrealizowanego", () => {
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      sell({
        id: "s1",
        date: "2026-02-10",
        quantity: 0.2,
        investedPLN: 20,
        netSalePLN: 22, // +10%
      }),
    ];

    const cycles = buildProfitCycles("ETH", txs);
    expect(cycles[0]!.realizedThresholds).toEqual([]);
    expect(getProfitThresholdStatus("ETH", txs, 10, 0.8).nextThreshold).toBe(
      30,
    );
  });

  it("BUY po SELL rozpoczyna nowy cykl i zachowuje historię", () => {
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      sell({
        id: "s1",
        date: "2026-02-10",
        quantity: 0.2,
        investedPLN: 20,
        netSalePLN: 26,
      }),
      buy({
        id: "b2",
        date: "2026-03-10",
        quantity: 0.5,
        investedPLN: 40,
        cryptoPricePLN: 80,
      }),
    ];

    const cycles = buildProfitCycles("ETH", txs);
    expect(cycles).toHaveLength(2);
    expect(cycles[0]!.realizedThresholds).toEqual([30]);
    expect(cycles[1]!.realizedThresholds).toEqual([]);
    expect(cycles[1]!.startTransactionId).toBe("b2");

    const status = getProfitThresholdStatus("ETH", txs, 12, 1.3);
    expect(status.previousCycles).toHaveLength(1);
    expect(status.previousCycles[0]!.realizedThresholds).toEqual([30]);
    expect(status.currentCycle?.id).toBe(cycles[1]!.id);
    expect(status.nextThreshold).toBe(30);
  });

  it("w nowym cyklu ponownie aktywuje sugestię +30%", () => {
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      sell({
        id: "s1",
        date: "2026-02-10",
        quantity: 0.2,
        investedPLN: 20,
        netSalePLN: 26,
      }),
      buy({
        id: "b2",
        date: "2026-03-10",
        quantity: 0.5,
        investedPLN: 40,
        cryptoPricePLN: 80,
      }),
    ];

    const status = getProfitThresholdStatus("ETH", txs, 31, 1.3);
    expect(status.nextThreshold).toBe(30);
    expect(status.suggestionActive).toBe(true);
    expect(status.suggestedSellQuantity).toBeCloseTo(1.3 * 0.2, 8);
    expect(status.lastRealizedThreshold).toBeNull();
  });

  it("kolejny BUY bez wcześniejszego SELL nie startuje nowego cyklu", () => {
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      buy({
        id: "b2",
        date: "2026-01-20",
        quantity: 0.5,
        investedPLN: 40,
        cryptoPricePLN: 80,
      }),
    ];

    const cycles = buildProfitCycles("ETH", txs);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!.startTransactionId).toBe("b1");
  });

  it("sam spadek ceny (bez BUY) nie resetuje zrealizowanego progu", () => {
    const txs = [
      buy({
        id: "b1",
        date: "2026-01-10",
        quantity: 1,
        investedPLN: 100,
        cryptoPricePLN: 100,
      }),
      sell({
        id: "s1",
        date: "2026-02-10",
        quantity: 0.2,
        investedPLN: 20,
        netSalePLN: 26,
      }),
    ];

    // live % spadł do +5% — nadal next = 50, 30 pozostaje zrealizowane
    const status = getProfitThresholdStatus("ETH", txs, 5, 0.8);
    expect(status.lastRealizedThreshold).toBe(30);
    expect(status.nextThreshold).toBe(50);
    expect(status.suggestionActive).toBe(false);
  });
});
