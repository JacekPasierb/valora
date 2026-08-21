import {connectDB} from "@/lib/mongodb";
import {
  isValidTransactionPayload,
  pickTransactionFields,
  toClientTransaction,
} from "@/lib/transactions";
import {auth} from "@/auth";
import {TransactionModel} from "@/models/Transaction";
import {NextResponse} from "next/server";

type RouteContext = {
  params: Promise<{id: string}>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;

  try {
    const body = await request.json();

    if (!isValidTransactionPayload({...body, id})) {
      return NextResponse.json(
        {error: "Nieprawidłowe dane transakcji."},
        {status: 400},
      );
    }

    const fields = pickTransactionFields({...body, id});
    await connectDB();

    const doc = await TransactionModel.findOneAndUpdate(
      {userId, id},
      {$set: {...fields, userId, id}},
      {new: true},
    ).lean();

    if (!doc) {
      return NextResponse.json(
        {error: "Nie znaleziono transakcji."},
        {status: 404},
      );
    }

    return NextResponse.json(toClientTransaction(doc));
  } catch (error) {
    console.error("PUT /api/transactions/[id]", error);
    return NextResponse.json(
      {error: "Nie udało się zaktualizować transakcji."},
      {status: 500},
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;

  try {
    await connectDB();
    const result = await TransactionModel.deleteOne({userId, id});

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {error: "Nie znaleziono transakcji."},
        {status: 404},
      );
    }

    return NextResponse.json({ok: true});
  } catch (error) {
    console.error("DELETE /api/transactions/[id]", error);
    return NextResponse.json(
      {error: "Nie udało się usunąć transakcji."},
      {status: 500},
    );
  }
}
