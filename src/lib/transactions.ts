import {Transaction} from "@/types/transaction";
import {TransactionDocument} from "@/models/Transaction";

export function toClientTransaction(
  doc: TransactionDocument & {_id?: unknown},
): Transaction {
  return {
    id: doc.id,
    crypto: doc.crypto as Transaction["crypto"],
    date: doc.date,
    investedPLN: doc.investedPLN,
    eurRate: doc.eurRate,
    investedEUR: doc.investedEUR,
    cryptoPriceEUR: doc.cryptoPriceEUR,
    quantity: doc.quantity,
    feeEUR: doc.feeEUR,
    ...(doc.source ? {source: doc.source as Transaction["source"]} : {}),
    ...(typeof doc.cryptoPricePLN === "number"
      ? {cryptoPricePLN: doc.cryptoPricePLN}
      : {}),
  };
}

export function pickTransactionFields(
  body: Partial<Transaction>,
): Omit<Transaction, "id"> & {id?: string} {
  return {
    ...(body.id ? {id: body.id} : {}),
    crypto: body.crypto!,
    date: body.date!,
    investedPLN: Number(body.investedPLN),
    eurRate: Number(body.eurRate),
    investedEUR: Number(body.investedEUR),
    cryptoPriceEUR: Number(body.cryptoPriceEUR),
    quantity: Number(body.quantity),
    feeEUR: Number(body.feeEUR ?? 0),
    ...(body.source ? {source: body.source} : {}),
    ...(typeof body.cryptoPricePLN === "number"
      ? {cryptoPricePLN: body.cryptoPricePLN}
      : {}),
  };
}

export function isValidTransactionPayload(
  body: Partial<Transaction>,
): body is Transaction {
  return (
    typeof body.crypto === "string" &&
    typeof body.date === "string" &&
    Number.isFinite(Number(body.investedPLN)) &&
    Number.isFinite(Number(body.eurRate)) &&
    Number.isFinite(Number(body.investedEUR)) &&
    Number.isFinite(Number(body.cryptoPriceEUR)) &&
    Number.isFinite(Number(body.quantity)) &&
    Number.isFinite(Number(body.feeEUR ?? 0))
  );
}
