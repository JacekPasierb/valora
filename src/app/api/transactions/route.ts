import {connectDB} from "@/lib/mongodb";
import {
  isValidTransactionPayload,
  pickTransactionFields,
  toClientTransaction,
} from "@/lib/transactions";
import {auth} from "@/auth";
import {TransactionModel} from "@/models/Transaction";
import {NextResponse} from "next/server";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  try {
    await connectDB();
    const docs = await TransactionModel.find({userId})
      .sort({date: -1, createdAt: -1})
      .lean();

    return NextResponse.json(docs.map((doc) => toClientTransaction(doc)));
  } catch (error) {
    console.error("GET /api/transactions", error);
    return NextResponse.json(
      {error: "Nie udało się pobrać transakcji."},
      {status: 500},
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  try {
    const body = await request.json();

    // Bulk import (np. migracja z localStorage)
    if (Array.isArray(body)) {
      await connectDB();
      const created = [];

      for (const item of body) {
        if (!isValidTransactionPayload(item) || !item.id) {
          continue;
        }

        const fields = pickTransactionFields(item);
        const doc = await TransactionModel.findOneAndUpdate(
          {userId, id: item.id},
          {$set: {...fields, userId}},
          {upsert: true, new: true, setDefaultsOnInsert: true},
        ).lean();

        if (doc) {
          created.push(toClientTransaction(doc));
        }
      }

      return NextResponse.json(created, {status: 201});
    }

    if (!isValidTransactionPayload(body)) {
      return NextResponse.json(
        {error: "Nieprawidłowe dane transakcji."},
        {status: 400},
      );
    }

    const id = body.id ?? crypto.randomUUID();
    const fields = pickTransactionFields({...body, id});

    await connectDB();
    const doc = await TransactionModel.findOneAndUpdate(
      {userId, id},
      {$set: {...fields, userId, id}},
      {upsert: true, new: true, setDefaultsOnInsert: true},
    ).lean();

    return NextResponse.json(toClientTransaction(doc!), {status: 201});
  } catch (error) {
    console.error("POST /api/transactions", error);
    return NextResponse.json(
      {error: "Nie udało się zapisać transakcji."},
      {status: 500},
    );
  }
}
