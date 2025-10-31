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

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sak1-answers");
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, []);

  // Fetch questions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/questions", { cache: "no-store" });
        if (!res.ok) throw new Error("Nätverksfel");
        const data: ApiResponse = await res.json();
        setQuestions(data.questions);
      } catch (e) {
        setError("Kunde inte ladda frågorna");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sak1-answers", JSON.stringify(answers));
    } catch {}
  }, [answers]);

  const total = questions.length;
  const current = questions[currentIdx];
  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((currentIdx + 1) / total) * 100);
  }, [currentIdx, total]);

  const selectAnswer = (qNum: number, key: string) => {
    setAnswers((prev) => ({ ...prev, [qNum]: key }));
  };

  const goPrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIdx((i) => Math.min(total - 1, i + 1));

  if (loading) return <p>Laddar…</p>;
  if (error) return <p className="error">{error}</p>;
  if (total === 0) return <p>Inga frågor hittades.</p>;

  return (
    <div className="quiz">
      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="meta">
        <span>
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
            return (
              <label key={opt.key} htmlFor={id} className={`option ${checked ? "checked" : ""}`}>
                <input
                  id={id}
                  type="radio"
                  name={`q${current.number}`}
                  value={opt.key}
                  checked={checked}
                  onChange={() => selectAnswer(current.number, opt.key)}
                />
                <span className="optkey">{opt.key})</span>
                <span className="opttext">{opt.text}</span>
              </label>
            );
          })}
        </form>
      </article>

      <div className="nav">
        <button onClick={goPrev} disabled={currentIdx === 0}>
          Föregående
        </button>
        <button onClick={goNext} disabled={currentIdx === total - 1}>
          Nästa
        </button>
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


