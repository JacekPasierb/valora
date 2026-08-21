import {connectDB, getMongoConnectionErrorMessage} from "@/lib/mongodb";
import {getSecurityQuestionLabel} from "@/data/securityQuestions";
import {UserModel} from "@/models/User";
import {NextResponse} from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email.includes("@")) {
      return NextResponse.json(
        {error: "Podaj prawidłowy adres e-mail."},
        {status: 400},
      );
    }

    await connectDB();
    const user = await UserModel.findOne({email})
      .select("securityQuestionId")
      .lean();

    if (!user?.securityQuestionId) {
      return NextResponse.json(
        {
          error:
            "Nie znaleziono konta z pytaniem pomocniczym dla tego e-maila.",
        },
        {status: 404},
      );
    }

    const question = getSecurityQuestionLabel(user.securityQuestionId);
    if (!question) {
      return NextResponse.json(
        {error: "Konto ma nieprawidłowe pytanie pomocnicze."},
        {status: 400},
      );
    }

    return NextResponse.json({email, question});
  } catch (error) {
    console.error("POST /api/recover/question", error);
    return NextResponse.json(
      {error: getMongoConnectionErrorMessage(error)},
      {status: 500},
    );
  }
}
