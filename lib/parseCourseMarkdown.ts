// Browser-compatible parser for course format markdown files
// This file can be imported both in Node.js and browser environments

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
  explanation?: string; // optional motivation text
};

// Course-format parser for SAK1_Questions_with_Answers.md
// Structure example:
// ## Fråga 1
// Frågetext...
// - a) Foo
// - b) **Bar** ✓
// - c) Baz
// - d) Qux
//
// *Motivering: text...*
export function parseCourseMarkdown(markdown: string): Question[] {
  const lines = markdown.split(/\r?\n/);
  const questions: Question[] = [];

  let current: Partial<Question> | null = null;
  let optionBuffer: QuestionOption[] = [];
  let explanationBuffer: string | null = null;
  let qCounter = 0;

  const pushCurrent = () => {
    if (!current) return;
    if (
      typeof current.number === "number" &&
      current.prompt &&
      optionBuffer.length >= 2
    ) {
      questions.push({
        number: current.number!,
        title: `Fråga ${current.number}`,
        prompt: current.prompt!,
        options: optionBuffer.slice(),
        correctKey: current.correctKey,
        explanation: explanationBuffer || undefined
      });
    }
    current = null;
    optionBuffer = [];
    explanationBuffer = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    const header = /^##\s*Fråga\s*(\d+)/i.exec(line);
    if (header) {
      pushCurrent();
      qCounter += 1;
      current = { number: Number(header[1]) || qCounter };
      continue;
    }

    if (!current) continue;

    // Prompt: first non-empty non-bullet line after header
    if (!current.prompt && line && !line.startsWith("- ")) {
      current.prompt = line;
      continue;
    }

    // Options: lines starting with "- ", can be bolded like: - **d) Text** ✓
    if (line.startsWith("- ")) {
      let rest = line.slice(2).trim();
      let bolded = false;
      if (rest.startsWith("**") && rest.includes("**", 2)) {
        // Strip surrounding bold if present
        const m = /^\*\*(.*)\*\*/.exec(rest);
        if (m) {
          rest = m[1].trim();
          bolded = true;
        }
      }
      // Remove trailing checkmarks and any final ✓/✔️ after bold
      rest = rest.replace(/[✓✔️]+\s*$/u, "").trim();
      const opt2 = /^([a-dA-D])\)\s*(.+)$/.exec(rest);
      if (opt2) {
        const key = opt2[1].toLowerCase();
        let text = opt2[2].trim();
        // If inner bold still exists around text, strip it and mark correct
        if (/\*\*(.+)\*\*/.test(text)) {
          text = text.replace(/\*\*(.+)\*\*/g, "$1");
          bolded = true;
        }
        if (bolded) current.correctKey = key;
        optionBuffer.push({ key, text });
        continue;
      }
    }

    // Explanation line(s)
    const mot = /^\*Motivering:\s*(.+)\*?$/.exec(line);
    if (mot) {
      explanationBuffer = mot[1].trim();
      continue;
    }

    // If we encounter a blank line and we already have options, the block may end soon; handled on next header
  }

  pushCurrent();
  return questions;
}

