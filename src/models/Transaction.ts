import {CryptoSymbol, TransactionSource} from "@/types/transaction";
import mongoose, {InferSchemaType, Model, Schema} from "mongoose";

const transactionSchema = new Schema(
  {
    id: {type: String, required: true},
    userId: {type: String, required: true, index: true},
    crypto: {
      type: String,
      enum: ["BTC", "ETH", "XRP", "SOL"] satisfies CryptoSymbol[],
      required: true,
    },
    date: {type: String, required: true},
    investedPLN: {type: Number, required: true},
    eurRate: {type: Number, required: true},
    investedEUR: {type: Number, required: true},
    cryptoPriceEUR: {type: Number, required: true},
    quantity: {type: Number, required: true},
    feeEUR: {type: Number, required: true, default: 0},
    source: {
      type: String,
      enum: ["purchase", "imported"] satisfies TransactionSource[],
      required: false,
    },
    cryptoPricePLN: {type: Number, required: false},
  },
  {timestamps: true},
);

transactionSchema.index({userId: 1, id: 1}, {unique: true});

export type TransactionDocument = InferSchemaType<typeof transactionSchema>;

type TransactionModel = Model<TransactionDocument>;

export const TransactionModel =
  (mongoose.models.Transaction as TransactionModel | undefined) ??
  mongoose.model<TransactionDocument>("Transaction", transactionSchema);
