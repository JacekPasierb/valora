import {Transaction} from "@/types/transaction";

export const transactions: Transaction[] = [
  {
    id: "1",
    crypto: "BTC",
    date: "2026-08-01",
    investedPLN: 100,
    eurRate: 4.3,
    investedEUR: 23.25,
    cryptoPriceEUR: 60000,
    quantity: 0.00038,
    feeEUR: 0.2,
  },
  {
    id: "2",
    crypto: "ETH",
    date: "2026-08-10",
    investedPLN: 100,
    eurRate: 4.28,
    investedEUR: 23.36,
    cryptoPriceEUR: 2400,
    quantity: 0.0097,
    feeEUR: 0.2,
  },
];
