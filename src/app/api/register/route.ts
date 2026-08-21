import {connectDB, getMongoConnectionErrorMessage} from "@/lib/mongodb";
import {
  getSecurityQuestionLabel,
  isSecurityQuestionId,
  normalizeSecurityAnswer,
} from "@/data/securityQuestions";
import {UserModel} from "@/models/User";
import bcrypt from "bcryptjs";
import {NextResponse} from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const securityQuestionId =
      typeof body.securityQuestionId === "string"
        ? body.securityQuestionId
        : "";
    const securityAnswer =
      typeof body.securityAnswer === "string" ? body.securityAnswer : "";

    if (name.length < 2) {
      return NextResponse.json(
        {error: "Imię musi mieć co najmniej 2 znaki."},
        {status: 400},
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {error: "Podaj prawidłowy adres e-mail."},
        {status: 400},
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {error: "Hasło musi mieć co najmniej 8 znaków."},
        {status: 400},
      );
    }

    if (!isSecurityQuestionId(securityQuestionId)) {
      return NextResponse.json(
        {error: "Wybierz pytanie pomocnicze."},
        {status: 400},
      );
    }

    const normalizedAnswer = normalizeSecurityAnswer(securityAnswer);
    if (normalizedAnswer.length < 2) {
      return NextResponse.json(
        {error: "Odpowiedź pomocnicza musi mieć co najmniej 2 znaki."},
        {status: 400},
      );
    }

    await connectDB();

    const existing = await UserModel.findOne({email}).lean();
    if (existing) {
      return NextResponse.json(
        {error: "Konto z tym e-mailem już istnieje."},
        {status: 409},
      );
    }

    const [passwordHash, securityAnswerHash] = await Promise.all([
      bcrypt.hash(password, 12),
      bcrypt.hash(normalizedAnswer, 12),
    ]);

    await UserModel.create({
      name,
      email,
      passwordHash,
      securityQuestionId,
      securityAnswerHash,
    });

    return NextResponse.json(
      {
        ok: true,
        securityQuestion: getSecurityQuestionLabel(securityQuestionId),
      },
      {status: 201},
    );
  } catch (error) {
    console.error("POST /api/register", error);
    return NextResponse.json(
      {error: getMongoConnectionErrorMessage(error)},
      {status: 500},
    );
  }
}
