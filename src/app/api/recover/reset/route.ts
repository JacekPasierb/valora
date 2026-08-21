import {connectDB, getMongoConnectionErrorMessage} from "@/lib/mongodb";
import {normalizeSecurityAnswer} from "@/data/securityQuestions";
import {UserModel} from "@/models/User";
import bcrypt from "bcryptjs";
import {NextResponse} from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const securityAnswer =
      typeof body.securityAnswer === "string" ? body.securityAnswer : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!email.includes("@")) {
      return NextResponse.json(
        {error: "Podaj prawidłowy adres e-mail."},
        {status: 400},
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {error: "Nowe hasło musi mieć co najmniej 8 znaków."},
        {status: 400},
      );
    }

    const normalizedAnswer = normalizeSecurityAnswer(securityAnswer);
    if (normalizedAnswer.length < 2) {
      return NextResponse.json(
        {error: "Podaj odpowiedź na pytanie pomocnicze."},
        {status: 400},
      );
    }

    await connectDB();
    const user = await UserModel.findOne({email});

    if (!user?.securityAnswerHash) {
      return NextResponse.json(
        {error: "Nie znaleziono konta z pytaniem pomocniczym."},
        {status: 404},
      );
    }

    const answerOk = await bcrypt.compare(
      normalizedAnswer,
      user.securityAnswerHash,
    );

    if (!answerOk) {
      return NextResponse.json(
        {error: "Nieprawidłowa odpowiedź na pytanie pomocnicze."},
        {status: 403},
      );
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({ok: true});
  } catch (error) {
    console.error("POST /api/recover/reset", error);
    return NextResponse.json(
      {error: getMongoConnectionErrorMessage(error)},
      {status: 500},
    );
  }
}
