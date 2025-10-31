# SAK1 Quiz (Next.js)

This Next.js app parses `SAK1_All_Unique_Questions.md` and shows a quiz where you can select one alternative per question.

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

## Data file
Keep `SAK1_All_Unique_Questions.md` in the project root (same level as `package.json`).

## Notes
- No correct answers are shown; this is for practice.
- Your selections are saved in `localStorage`.
