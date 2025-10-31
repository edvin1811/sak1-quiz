# SAK1 Quiz (Next.js)

This Next.js app parses `1.md` and `2.md` (100 questions total) and shows a quiz where you can select one alternative per question. It also knows the correct answer from each line (format: `(Question A: a, B: b, C: c, D: d) # X`).

## Requirements
- Node 18+

## Run
```
npm install
npm run dev
```
Open `http://localhost:3000`.

## Structure
- `app/` – App Router, UI and API
  - `app/api/questions/route.ts` – API that parses the markdown and returns JSON
  - `app/page.tsx` – Loads the quiz component (CSR)
- `components/Quiz.tsx` – Quiz UI with navigation and stored selections
- `lib/parseQuestions.ts` – Simple parser for the markdown format
- `styles/globals.css` – Styling

## Data files
Keep `1.md` and `2.md` in the project root (same level as `package.json`).

## Notes
- No correct answers are shown; this is for practice.
- Your selections are saved in `localStorage`.
