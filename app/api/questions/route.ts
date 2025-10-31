import { NextResponse } from "next/server";
import { loadQuestionsFromMarkdown } from "@/lib/parseQuestions";

export async function GET() {
  try {
    const questions = loadQuestionsFromMarkdown();
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: "Kunde inte läsa frågorna." },
      { status: 500 }
    );
  }
}

