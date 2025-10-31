import fs from "node:fs";
import path from "node:path";

export type QuestionOption = {
  key: string; // a, b, c, d
  text: string;
};

export type Question = {
  number: number;
  title: string; // e.g., "Fråga 1"
  prompt: string; // question text
  options: QuestionOption[];
};

const ANSWER_LETTERS = ["a", "b", "c", "d"] as const;

export function loadQuestionsFromMarkdown(): Question[] {
  const mdPath = path.join(process.cwd(), "SAK1_All_Unique_Questions.md");
  const file = fs.readFileSync(mdPath, "utf-8");
  return parseMarkdown(file);
}

export function parseMarkdown(markdown: string): Question[] {
  const lines = markdown.split(/\r?\n/);
  const questions: Question[] = [];

  let current: Partial<Question> | null = null;
  let collectingOptions = false;

  const pushCurrentIfComplete = () => {
    if (!current) return;
    if (
      typeof current.number === "number" &&
      current.title &&
      current.prompt &&
      current.options &&
      current.options.length > 0
    ) {
      questions.push(current as Question);
    }
    current = null;
    collectingOptions = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Start of a question block: lines like "## Fråga 1"
    const qMatch = /^##\s*Fråga\s*(\d+)/i.exec(line);
    if (qMatch) {
      pushCurrentIfComplete();
      const number = Number(qMatch[1]);
      current = {
        number,
        title: `Fråga ${number}`,
        prompt: "",
        options: []
      };
      collectingOptions = false;
      continue;
    }

    if (!current) continue;

    // First non-empty, non-header line after header is the prompt
    if (!current.prompt && line && !line.startsWith("- ")) {
      current.prompt = line.replace(/^\*\*OBS:\*\*.*/i, "");
      continue;
    }

    // Option lines: "- a) ..."
    const optMatch = /^-\s*([a-dA-D])\)\s*(.+)$/.exec(line);
    if (optMatch) {
      collectingOptions = true;
      const key = optMatch[1].toLowerCase();
      const text = optMatch[2].trim();
      if (
        current.options &&
        ANSWER_LETTERS.includes(key as (typeof ANSWER_LETTERS)[number])
      ) {
        current.options.push({ key, text });
      }
      continue;
    }

    // If we've started options and hit a non-option, the question likely ended
    if (collectingOptions && line && !line.startsWith("- ")) {
      pushCurrentIfComplete();
    }
  }

  // Push trailing question
  if (current) pushCurrentIfComplete();

  return questions;
}

