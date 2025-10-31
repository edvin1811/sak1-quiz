import { NextResponse } from "next/server";
import { loadQuestionsFromMarkdown, loadCourseQuestions } from "@/lib/parseQuestions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = (searchParams.get("source") || "glosor").toLowerCase();
    const questions = source === "course" ? loadCourseQuestions() : loadQuestionsFromMarkdown();
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: "Kunde inte läsa frågorna." },
      { status: 500 }
    );
  }
}

