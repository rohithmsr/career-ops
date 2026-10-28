# Rohith's Career-Ops Guide & Workflow Cheatsheet

This guide summarizes how the `career-ops` system works, how its files are structured, and how to use the Web UI and AI Chat together throughout your job search.

---

## 1. System Architecture: Two Distinct Layers

The repository is cleanly split into two layers so system updates never interfere with your personal data:

* **System Layer (`*.mjs`, `modes/*.md`, `dashboard/`, `templates/`)**:
  * The underlying JavaScript automation engine, scrapers, ATS validators, and agent instructions.
  * **Why `.mjs` files update**: Whenever the repository syncs with upstream GitHub releases, `.mjs` files update with bug fixes and new ATS scrapers.
  * **Rule**: You **never need to read, write, or worry about `.mjs` files**. They are simply background machinery.
* **User Layer (`data/*`, `reports/*`, `output/*`, `interview-prep/*`, `cv.md`, `config/*`)**:
  * Your personal job search data.
  * These files are **guaranteed to never be overwritten** by system updates. All your applications, reports, notes, and CVs live safely here.

---

## 2. Web UI vs. AI Chat: How to Work

You have two complementary interfaces that work on the same underlying data:

### A. The Web UI (`npm run ui`) — Visual Mission Control
Best for daily high-volume monitoring and automation:
* Running zero-token scans across job portals (Ashby, Greenhouse, Lever, etc.).
* Browsing job evaluations and match scores.
* Viewing the state of your application pipeline in a clean visual layout.

### B. The AI Chat (Right Here) — Interactive Copilot
Best for reasoning, document generation, and live conversation:
* **Interactive Mock Interviews**: Practicing questions one by one with real-time feedback.
* **Interview Prep Dossiers**: Deep research on company engineering blogs, questions, and team stack.
* **Tailored CV Generation**: Producing ATS-optimized PDF/LaTeX resumes matched to specific JDs.
* **Post-Interview Debriefs**: Processing transcripts and logging interview lessons.
* **Offer & Contract Review**: Analyzing clauses, equity, restrictive covenants, and negotiation points.

> **Note**: Both the Web UI and the AI Chat share the exact same files. Any update made in chat immediately updates what you see in the UI.

---

## 3. Which Files Should You Actually View?

Ignore the code files. These are the core user files that matter:

| Purpose | File / Directory | What it contains |
| :--- | :--- | :--- |
| **Master Applications Board** | `data/applications.md` | Your master tracker table: Company, Role, Score, Status (`Applied`, `Interview`, `Assessment`), Report link, and Notes. |
| **Job Evaluation Reports** | `reports/` | Numbered markdown reports (e.g., `reports/011-gitlab-backend-india-2026-10-25.md`) detailing fit analysis (1–5 score), missing keywords, and recommendations. |
| **Generated CVs & PDFs** | `output/` | Tailored PDFs and HTML CVs created for specific job applications. |
| **Interview Dossiers & Notes** | `interview-prep/` | Company research (`{company}-{role}.md`), your STAR story bank (`story-bank.md`), question banks, and session logs. |
| **Incoming Un-evaluated Roles** | `data/pipeline.md` | Your inbox of job URLs waiting to be evaluated. |
| **Master CV & Profile** | `cv.md` & `config/profile.yml` | Ground truth for your background, skills, target archetypes, and compensation expectations. |

---

## 4. End-to-End Workflow: When You Get Shortlisted

When a company contacts you or shortlists your profile, follow this 6-step playbook:

### Step 1: Update Application Status
Update your tracker from `Applied` to `Interview` (or `Assessment` if it's an online screening test):
```powershell
node set-status.mjs <tracker#|company> Interview --note "Shortlisted for Round 1"
```
*(Example: `node set-status.mjs 11 Interview --note "Recruiter screening scheduled"`).*
This atomically updates `data/applications.md` and appends a transition timestamp to `data/status-log.tsv`.

### Step 2: Generate Company & Role Dossier (`interview-prep`)
* **In Chat**: *"Run interview-prep for [Company] [Role]"*
* **What it does**:
  * Researches recent company news, engineering blogs, and team priorities.
  * Extracts reported interview questions from Glassdoor and LeetCode.
  * Checks your prior stated compensation (`node salary-gap.mjs --stated-for <tracker#>`) to avoid quoting conflicting salary numbers across rounds.
  * Maps your STAR achievements from `interview-prep/story-bank.md` to the JD's requirements.
  * Saves a complete dossier to `interview-prep/{company}-{role}.md`.

### Step 3: Build a Time-Blocked Prep Schedule (`interview/plan`)
* **In Chat**: *"I have an interview with [Company] on [Date/Time] for [Round], build my prep plan"*
* **What it does**:
  * Calculates preparation time and creates a structured schedule.
  * Categorizes **strengths to anchor on** vs. **critical gaps to close**.
  * If you have panelist names from a calendar invite, parses panelist personas and suggests specific questions for each.

### Step 4: Run AI Mock Practice (`interview/practice`)
* **In Chat**: *"Let's do a mock interview for [Company] [Role]"*
* **What it does**:
  * The AI acts as the interviewer (Recruiter, Engineering Manager, or Staff Engineer).
  * Asks questions **one by one**; you answer out loud or typed.
  * Gives immediate structured feedback: STAR structure, metric strength, alignment with `cv.md`, and logs results in `interview-prep/question-bank.md`.

### Step 5: Post-Interview Debrief (`interview/debrief`)
* **In Chat**: *"Here is what happened in my interview with [Company]: [paste notes or Meet/Zoom transcript]"*
* **What it does**:
  * Analyzes what went well, what caught you off guard, and records interviewer-stated priorities.
  * Saves the session transcript to `interview-prep/sessions/{company}-{role}-{round}-{date}.md`.
  * Refines your question and story banks for upcoming rounds.

### Step 6: Offer & Contract Review (`offer-prep`)
* **In Chat**: *"Review this offer letter / contract for clauses and negotiation points: [paste text]"*
* **What it does**:
  * Breaks down total compensation (base, bonus, equity, vesting schedules).
  * Explains clauses in plain English (IP assignment, non-competes, notice periods).
  * Prepares candidate-side negotiation leverage and questions for the hiring team.

---

## 5. Scanning & Evaluating Openings in Bulk

### A. Scanning is Always Free (Zero Tokens)
* The **Scan** feature directly hits public ATS APIs (Greenhouse, Lever, Ashby, Workday) without invoking an LLM.
* Scanning boards and discovering openings incurs **0 tokens / $0.00**.

### B. Bulk Evaluating via the Web UI
When you want to evaluate multiple openings into structured fit reports (1–5 score) all at once:
1. **Explore → Add to Pipeline**:
   * Run a scan on the **Explore** page (`/explore`).
   * Click **"Add all {N}"** at the top right of the results list (or "Add to pipeline" on individual cards) to move them into your inbox for free.
2. **Pipeline → Inbox Triage**:
   * Switch to the **Pipeline** page and select the **INBOX** tab (`/pipeline?tab=INBOX`).
   * Filter roles by seniority, location, ATS, or keywords.
   * Select the checkboxes next to the roles you want to evaluate.
   * Click **"Save to shortlist"** on the floating action bar *(or click the bookmark/plus icon on any role)*.
3. **Score the Shortlist**:
   * A floating bottom tray appears: **"Shortlist ({N})"**, displaying the estimated token/USD cost upfront (e.g. `Score 5 · ~$0.04`).
   * Click **"Score {N}"** and confirm.
   * Background workers will evaluate all shortlisted jobs in parallel, generate their detailed reports in `reports/`, and update `data/applications.md`.

### C. Bulk Evaluating via Chat or Terminal
* **In Chat**: *"Evaluate all pending jobs in my pipeline"* or *"Evaluate the top 5 jobs in data/pipeline.md"*.
* **In Terminal**: Run `npm run or:pipeline` to batch-evaluate your inbox via OpenRouter.

---

## 6. Handy Terminal Commands

| Task | Command |
| :--- | :--- |
| **Launch Visual UI** | `npm run ui` |
| **View Tracker Summary** | `node tracker.mjs` |
| **View Full Pipeline Stats** | `node stats.mjs --summary` |
| **Update Application Status** | `node set-status.mjs <tracker#|company> <State> --note "..."` |
| **Run System Health Check** | `node doctor.mjs` |