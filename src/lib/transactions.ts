import {Transaction} from "@/types/transaction";
import {TransactionDocument} from "@/models/Transaction";

export function toClientTransaction(
  doc: TransactionDocument & {_id?: unknown},
): Transaction {
  const hasSellFields =
    typeof doc.netSaleEUR === "number" ||
    typeof doc.netSalePLN === "number" ||
    typeof doc.realizedProfitPLN === "number";
  const side =
    doc.side === "sell" || doc.side === "buy"
      ? (doc.side as Transaction["side"])
      : hasSellFields
        ? "sell"
        : "buy";

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
    side,
    ...(side === "buy" && doc.source
      ? {source: doc.source as Transaction["source"]}
      : {}),
    ...(typeof doc.cryptoPricePLN === "number"
      ? {cryptoPricePLN: doc.cryptoPricePLN}
      : {}),
    ...(typeof doc.netSaleEUR === "number" ? {netSaleEUR: doc.netSaleEUR} : {}),
    ...(typeof doc.netSalePLN === "number" ? {netSalePLN: doc.netSalePLN} : {}),
    ...(typeof doc.realizedProfitPLN === "number"
      ? {realizedProfitPLN: doc.realizedProfitPLN}
      : {}),
  };
}

export function pickTransactionFields(
  body: Partial<Transaction>,
): Omit<Transaction, "id"> & {id?: string} {
  const side = body.side === "sell" ? "sell" : "buy";

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
    side,
    ...(side === "buy" && body.source ? {source: body.source} : {}),
    ...(typeof body.cryptoPricePLN === "number"
      ? {cryptoPricePLN: body.cryptoPricePLN}
      : {}),
    ...(side === "sell" && typeof body.netSaleEUR === "number"
      ? {netSaleEUR: body.netSaleEUR}
      : {}),
    ...(side === "sell" && typeof body.netSalePLN === "number"
      ? {netSalePLN: body.netSalePLN}
      : {}),
    ...(side === "sell" && typeof body.realizedProfitPLN === "number"
      ? {realizedProfitPLN: body.realizedProfitPLN}
      : {}),
  };
}

export function isValidTransactionPayload(
  body: Partial<Transaction>,
): body is Transaction {
  const side = body.side === "sell" ? "sell" : "buy";
  const baseValid =
    typeof body.crypto === "string" &&
    typeof body.date === "string" &&
    Number.isFinite(Number(body.investedPLN)) &&
    Number.isFinite(Number(body.eurRate)) &&
    Number.isFinite(Number(body.investedEUR)) &&
    Number.isFinite(Number(body.cryptoPriceEUR)) &&
    Number.isFinite(Number(body.quantity)) &&
    Number(body.quantity) > 0 &&
    Number.isFinite(Number(body.feeEUR ?? 0));

  if (!baseValid) {
    return false;
  }

  if (side === "sell") {
    return (
      Number.isFinite(Number(body.netSaleEUR)) &&
      Number.isFinite(Number(body.netSalePLN)) &&
      Number.isFinite(Number(body.realizedProfitPLN))
    );
  }

  return true;
}
