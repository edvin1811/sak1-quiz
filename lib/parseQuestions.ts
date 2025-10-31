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
  correctKey?: string; // optional: a/b/c/d if available
};

const ANSWER_LETTERS = ["a", "b", "c", "d"] as const;

// Load from new Glosor-style sources: 1.md and 2.md
export function loadQuestionsFromMarkdown(): Question[] {
  const root = process.cwd();
  const paths = [path.join(root, "1.md"), path.join(root, "2.md")];
  const contents = paths
    .filter((p) => fs.existsSync(p))
    .map((p) => fs.readFileSync(p, "utf-8"));
  if (contents.length === 0) return [];
  const allLines = contents.flatMap((c) => c.split(/\r?\n/));
  return parseGlosorLines(allLines);
}

// Lines look like:
// (Frågan? A: alt1, B: alt2, C: alt3, D: alt4) # D
export function parseGlosorLines(lines: string[]): Question[] {
  const questions: Question[] = [];
  let counter = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith("(") || !line.includes("#")) continue;

    // Extract the trailing answer after '#'
    const answerMatch = /#\s*([A-Da-d])\s*$/.exec(line.replace(/\\#/g, "#"));
    if (!answerMatch) continue;
    const correctKey = answerMatch[1].toLowerCase();

    // Extract inside parentheses
    const insideMatch = /^\((.*)\)\s*#/.exec(line.replace(/\\#/g, "#"));
    if (!insideMatch) continue;
    const inside = insideMatch[1];

    // Split question from options: question part before ' A:'
    const aIndex = inside.indexOf(" A:");
    if (aIndex === -1) continue;
    const prompt = inside.slice(0, aIndex).trim().replace(/^\(+|\)+$/g, "");
    const optionsPart = inside.slice(aIndex).trim();

    // Parse options e.g. A: text, B: text, C: text, D: text
    const optRegex = /([A-Da-d])\s*:\s*([^,]+)(?:,|$)/g;
    const found: QuestionOption[] = [];
    let m: RegExpExecArray | null;
    while ((m = optRegex.exec(optionsPart))) {
      const k = m[1].toLowerCase();
      const text = m[2].trim();
      if (ANSWER_LETTERS.includes(k as (typeof ANSWER_LETTERS)[number])) {
        found.push({ key: k, text });
      }
    }

    if (found.length >= 2) {
      counter += 1;
      questions.push({
        number: counter,
        title: `Fråga ${counter}`,
        prompt,
        options: found,
        correctKey
      });
    }
  }

  return questions;
}

