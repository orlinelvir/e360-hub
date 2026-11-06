import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { gradeAndSaveQuizAttempt, getQuizAttempts } from "@/lib/services/quiz-service";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const attempts = await getQuizAttempts(user.uid);
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error("Error obteniendo intentos del examen:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawAnswers = Array.isArray(body.answers) ? body.answers : [];
    if (rawAnswers.length === 0) {
      return NextResponse.json({ error: "Debes responder el examen antes de enviarlo." }, { status: 400 });
    }

    const attempt = await gradeAndSaveQuizAttempt(user.uid, rawAnswers);
    return NextResponse.json({ success: true, attempt });
  } catch (error) {
    console.error("Error calificando el examen:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
