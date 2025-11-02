"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { parseCourseMarkdown, type Question } from "@/lib/parseCourseMarkdown";

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
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shuffle helper
  const shuffleInPlace = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Load and process questions
  const loadQuestions = (questionsToLoad: Question[]) => {
    // Deep copy, then shuffle questions and options
    const cloned: Question[] = questionsToLoad.map((q) => ({
      number: q.number,
      title: q.title,
      prompt: q.prompt,
      options: q.options.map((o) => ({ key: o.key, text: o.text })),
      correctKey: q.correctKey,
      explanation: q.explanation
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
    setCurrentIdx(0);
    setShowResults(false);
    try { localStorage.removeItem("sak1-answers"); } catch {}
    setQuestions(cloned);
    setError(null);
  };

  // Don't try to load from API - user must import a file

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a markdown file
    if (!file.name.endsWith(".md")) {
      setError("Vänligen välj en .md-fil");
      return;
    }

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCourseMarkdown(content);
        
        if (parsed.length === 0) {
          setError("Inga frågor hittades i filen. Kontrollera att filen har rätt format.");
          setLoading(false);
          return;
        }

        loadQuestions(parsed);
        setLoading(false);
      } catch (err) {
        setError("Kunde inte läsa filen. Kontrollera formatet.");
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Kunde inte läsa filen");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  // Clear imported file
  const clearFile = () => {
    setFileName(null);
    setQuestions([]);
    setAnswers({});
    setAnswered({});
    setCurrentIdx(0);
    setShowResults(false);
    setError(null);
    try { localStorage.removeItem("sak1-answers"); } catch {}
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Set initial loading to false since we're not loading anything on mount
  useEffect(() => {
    setLoading(false);
  }, []);

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

  // Show loading state
  if (loading) {
    return (
      <div className="quiz" style={{ textAlign: "center", padding: "2rem" }}>
        <p>Laddar…</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="quiz" style={{ textAlign: "center", padding: "2rem" }}>
        <p className="error" style={{ marginBottom: "1rem" }}>{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white"
          }}
        >
          Stäng
        </button>
      </div>
    );
  }

  // Show import screen if no file loaded
  if (total === 0 || !fileName) {
    return (
      <div className="quiz" style={{ textAlign: "center", padding: "3rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "1rem" }}>Quiz-applikation</h1>
        <p style={{ marginBottom: "2rem", fontSize: "1.1em", color: "#666" }}>
          Välj en markdown-fil med quiz-frågor för att komma igång.
        </p>
        <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "12px 24px",
              cursor: "pointer",
              border: "2px solid #0070f3",
              borderRadius: "8px",
              background: "#0070f3",
              color: "white",
              fontSize: "1em",
              fontWeight: "500"
            }}
          >
            Välj quiz-fil (.md)
          </button>
        </label>
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px", textAlign: "left" }}>
          <p style={{ marginTop: 0, fontWeight: "bold" }}>Förväntat filformat:</p>
          <pre style={{ 
            background: "white", 
            padding: "1rem", 
            borderRadius: "4px", 
            overflow: "auto",
            fontSize: "0.9em",
            marginBottom: 0
          }}>
{`## Fråga 1
Vad kan man analysera med en riskanalys?
- a) Informationssäkerhetsrisker gällande IT-system
- b) Informationssäkerhetsrisker gällande Människor
- **d) Samtliga ovanstående** ✓

*Motivering: En riskanalys kan omfatta alla aspekter...*`}
          </pre>
        </div>
      </div>
    );
  }

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
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span>Importera quiz-fil:</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "4px 12px",
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white"
              }}
            >
              Välj fil
            </button>
          </label>
          {fileName && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.9em", color: "#666" }}>
                {fileName}
              </span>
              <button
                type="button"
                onClick={clearFile}
                style={{
                  padding: "4px 12px",
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  background: "white",
                  fontSize: "0.9em"
                }}
              >
                Rensa
              </button>
            </div>
          )}
        </div>
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


