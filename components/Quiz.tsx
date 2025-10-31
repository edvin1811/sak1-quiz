"use client";

import { useEffect, useMemo, useState } from "react";

type QuestionOption = {
  key: string;
  text: string;
};

type Question = {
  number: number;
  title: string;
  prompt: string;
  options: QuestionOption[];
  correctKey?: string;
  explanation?: string;
};

type ApiResponse = {
  questions: Question[];
};

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [source, setSource] = useState<"glosor" | "course">("glosor");

  // Shuffle helper
  const shuffleInPlace = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Fetch questions (depends on source)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/questions?source=${source}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Nätverksfel");
        const data: ApiResponse = await res.json();
        // Deep copy, then shuffle questions and options
        const cloned: Question[] = data.questions.map((q) => ({
          number: q.number,
          title: q.title,
          prompt: q.prompt,
          options: q.options.map((o) => ({ key: o.key, text: o.text })),
          correctKey: q.correctKey,
          explanation: (q as any).explanation
        }));
        // Shuffle alternatives per question
        cloned.forEach((q) => {
          shuffleInPlace(q.options);
        });
        // Shuffle question order
        shuffleInPlace(cloned);
        // New quiz session: reset answers state and storage
        setAnswers({});
        setAnswered({});
        try { localStorage.removeItem("sak1-answers"); } catch {}
        setQuestions(cloned);
      } catch (e) {
        setError("Kunde inte ladda frågorna");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [source]);

  // Persist to localStorage (optional; still store within a session)
  useEffect(() => {
    try { localStorage.setItem("sak1-answers", JSON.stringify(answers)); } catch {}
  }, [answers]);

  const total = questions.length;
  const current = questions[currentIdx];
  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((currentIdx + 1) / total) * 100);
  }, [currentIdx, total]);

  const selectAnswer = (qNum: number, key: string) => {
    // If already answered, do nothing (locked after selection)
    if (answered[qNum]) return;
    setAnswers((prev) => ({ ...prev, [qNum]: key }));
    setAnswered((prev) => ({ ...prev, [qNum]: true }));
  };

  const goPrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIdx((i) => Math.min(total - 1, i + 1));

  if (loading) return <p>Laddar…</p>;
  if (error) return <p className="error">{error}</p>;
  if (total === 0) return <p>Inga frågor hittades.</p>;

  if (showResults) {
    const numCorrect = questions.reduce((acc, q) => acc + (answers[q.number] === q.correctKey ? 1 : 0), 0);
    const numWrong = total - numCorrect;
    return (
      <div className="quiz">
        <h2>Resultat</h2>
        <p className="prompt">Rätt: {numCorrect} · Fel: {numWrong} · Totalt: {total}</p>
        <section className="card">
          <ul>
            {questions.map((q) => {
              const picked = answers[q.number];
              const correct = q.correctKey;
              const isCorrect = picked && correct && picked === correct;
              return (
                <li key={q.number} style={{ marginBottom: 8 }}>
                  <strong>{q.title}</strong> — {isCorrect ? "Rätt" : "Fel"}
                  <div style={{ marginTop: 4 }}>
                    Ditt svar: {picked ?? "(ej valt)"} {(!isCorrect && picked) ? "✗" : ""}
                  </div>
                  <div>Rätt svar: {correct ?? "(saknas)"} ✓</div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="meta" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Datakälla:
          <select value={source} onChange={(e) => setSource(e.target.value as any)} style={{ marginLeft: 8 }}>
            <option value="glosor">Glosor (1.md + 2.md)</option>
            <option value="course">Kursformat (SAK1_Questions_with_Answers.md)</option>
          </select>
        </label>
        <span style={{ marginLeft: "auto" }}>
          Fråga {currentIdx + 1} av {total}
        </span>
      </div>

      <article className="card">
        <h2>{current.title}</h2>
        <p className="prompt">{current.prompt}</p>
        <form className="options">
          {current.options.map((opt) => {
            const id = `q${current.number}-${opt.key}`;
            const checked = answers[current.number] === opt.key;
            const isCorrect = current.correctKey && current.correctKey === opt.key;
            const isAnswered = !!answered[current.number];
            const isWrongSelected = isAnswered && checked && !isCorrect;
            return (
              <label
                key={opt.key}
                htmlFor={id}
                className={`option ${checked ? "checked" : ""} ${isAnswered && isCorrect ? "correct" : ""} ${isWrongSelected ? "wrong" : ""}`}
              >
                <input
                  id={id}
                  type="radio"
                  name={`q${current.number}`}
                  value={opt.key}
                  checked={checked}
                  onChange={() => selectAnswer(current.number, opt.key)}
                  disabled={isAnswered}
                />
                <span className="optkey">{opt.key})</span>
                <span className="opttext">{opt.text}</span>
              </label>
            );
          })}
        </form>
        {answered[current.number] && current.explanation ? (
          <p className="muted" style={{ marginTop: 8 }}>Motivering: {current.explanation}</p>
        ) : null}
      </article>

      <div className="nav">
        <button onClick={goPrev} disabled={currentIdx === 0}>
          Föregående
        </button>
        {currentIdx < total - 1 ? (
          <button onClick={goNext} disabled={!answered[current.number]}>
            Nästa
          </button>
        ) : (
          <button onClick={() => setShowResults(true)} disabled={!answered[current.number]}>
            Slutför
          </button>
        )}
      </div>

      <section className="summary">
        <details>
          <summary>Sammanfattning av svar</summary>
          <ul>
            {questions.map((q) => (
              <li key={q.number}>
                {q.title}: {answers[q.number] ? answers[q.number] : "(ej valt)"}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}


