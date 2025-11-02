import fs from "node:fs";
import path from "node:path";
import { parseCourseMarkdown, type Question } from "./parseCourseMarkdown";

export type { Question, QuestionOption } from "./parseCourseMarkdown";

// Course-format parser for SAK1_Questions_with_Answers.md
export function loadCourseQuestions(): Question[] {
  const filePath = path.join(process.cwd(), "SAK1_Questions_with_Answers.md");
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  return parseCourseMarkdown(content);
}

