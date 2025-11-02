import { NextResponse } from "next/server";
import { loadCourseQuestions } from "@/lib/parseQuestions";

export async function GET(request: Request) {
  try {
    const questions = loadCourseQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: "Kunde inte läsa frågorna." },
      { status: 500 }
    );
  }
}

