# PROMPTS.md

A running log of the key prompts I used while building this project — what I was trying to do, the prompt itself, and a quick note on why.

---

## 1. Project Kickoff

**What I was trying to do:** Get oriented and figure out a solid, simple architecture before writing any code.

**Prompt:**
> I am starting an optional Cloudflare AI assignment and want your help building the project in a simple but solid way.
>
> The assignment needs the project to include AI/LLM usage, some kind of workflow or coordination, user input through chat or voice, and memory or state.

**Why:** I wanted to scope the project early and understand which Cloudflare products to use before committing to anything. This helped surface the Durable Objects + Workers AI + Realtime stack as the right combination.

---

## 2. Project Definition & Architecture

**What I was trying to do:** Lock in the full project concept, tech stack, file structure, and build order so I had a clear plan before touching any code.

**Prompt:**
> Project Context: cf_ai_interview_prep
>
> I'm building a voice-based interview prep tool as an optional assignment for a Cloudflare Software Engineering internship application. The goal is to fast-track my application by completing their AI-powered app challenge.
>
> What the app does: A web app where users practice interview questions by answering with their voice. The AI asks a question, the user responds via voice, and the AI transcribes the answer, evaluates it, and gives structured feedback — what was good, what was missing, and what an ideal answer looks like. It tracks session progress across multiple questions.
>
> Main user flow:
> 1. User lands on the app and picks a topic (DSA, System Design, or Behavioral)
> 2. AI generates an interview question
> 3. User hits record and answers by voice
> 4. Voice is transcribed via Cloudflare Realtime
> 5. Transcribed answer gets sent to Workers AI (Llama 3.3) for evaluation
> 6. AI returns structured feedback
> 7. User can continue to the next question, session memory persists via Durable Objects
>
> Cloudflare stack: Pages, Realtime, Workers AI (Llama 3.3), Durable Objects, Workflows
>
> [+ full architecture diagram, file structure, and build order]

**Why:** Having everything written out in one place made it easy to reference and share. It also ensures the AI assistant has the full picture when helping with individual pieces later.

---

## 3. Setting Up PROMPTS.md

**What I was trying to do:** Start tracking prompts from the beginning of the project so the PROMPTS.md file would be complete and honest by submission time.

**Prompt:**
> I also need to submit a PROMPTS.md file for this project. So from now on, whenever I give you an important prompt related to planning, architecture, coding, debugging, or documentation, I want to keep track of it.
>
> Can you help me create a PROMPTS.md draft using the prompts I've already given in this chat?
>
> Keep it simple. For each one, include:
> - what I was trying to do
> - the prompt itself
> - a short note about why I used it
>
> Make it sound natural, not too formal, and easy to keep updating as I continue the project.

**Why:** The assignment requires a PROMPTS.md, and I wanted it to actually reflect how I worked — not something written retroactively at the end.

---

## 4. Debugging the Feedback Pipeline

**What I was trying to do:** Figure out why the feedback sections (What was good / What was missing / Ideal answer) were showing `—` instead of real AI-generated content after a successful evaluate call.

**Prompt:**
> I tested the app with two examples and found an inconsistency in how evaluation results are being handled between the backend response and the dashboard UI.
>
> Case 1: I only read the question out loud. The dashboard showed the transcription but no feedback in any section.
> Case 2: I gave a real answer. "What was good" and "What was missing" were empty, and it seemed to treat the answer as ideal.
>
> [+ Wrangler logs for both cases showing raw response shape and parsed keys]
>
> Please help me debug this carefully.

**Why:** The logs revealed two independent bugs. First, Workers AI returns `res.response` as an already-parsed object in some cases — not always a string — so the original string-assumption code was stringifying the whole response envelope and the frontend received keys `response/tool_calls/usage` instead of `good/missing/ideal`. Second, React state wasn't being cleared between recordings so old feedback values bled through while a new evaluation was in-flight.

---

## 5. Scaffolding the Full Project

**What I was trying to do:** Get the entire project skeleton built in one shot — React frontend, Cloudflare Worker, Durable Object, and Workflow — so I could start testing the actual flow immediately.

**Prompt:**
> Yes, that sounds good.

**Why:** After aligning on architecture, I gave the go-ahead to scaffold everything at once. This produced the full file structure: `frontend/` with React + Vite, `worker/` with `index.js`, `session.js` (Durable Object), `workflow.js` (Cloudflare Workflow), and `wrangler.toml` with AI, Durable Object, and Workflow bindings all declared upfront.

---

## 6. Debugging the Workflow and Worker Errors

**What I was trying to do:** Fix two runtime errors that appeared immediately when both dev servers were running and I clicked a topic for the first time.

**Prompt:**
> [wrangler:err] TypeError: Cannot destructure property 'step' of 'event.payload.params' as it is undefined.
> [wrangler:err] TypeError: result.output is not a function
>
> Please help me debug this step by step.

**Why:** The Cloudflare Workflows API passes params directly on `event.payload`, not `event.payload.params`. Also, Workflow instances don't have an `.output()` method — you poll `.status()`. And binary audio blobs can't be JSON-serialized through Workflow params at all. The fix was to call Workers AI and Durable Objects directly from the Worker's fetch handler, which also simplified the architecture.

---

## 7. Adding a "Try Again" Button

**What I was trying to do:** Let users retry the same question without advancing to the next one — useful when you want to practice a better answer.

**Prompt:**
> I noticed there's currently no way to answer the same question again. Right now the UI only gives me "Next Question" and "Change Topic," but I also want a way to retry the current question.
>
> What I want:
> - it should keep the same current question
> - clear the previous recorded/transcribed answer and feedback
> - let me record a fresh answer for that same question
> - fit naturally into the existing UI and flow

**Why:** A retry flow is core to any practice tool — you should be able to hear the ideal answer and immediately try again. The fix was a `handleRetry` function in App.jsx that clears feedback/transcript state and resets the phase to `recording` without changing the question or session.

---

## 8. UI Polish and Sizing

**What I was trying to do:** Make the interface feel like a real product — better visual hierarchy, consistent spacing, and readable text at default browser zoom without needing to zoom in manually.

**Prompt:**
> I want to improve the UI a bit overall. You can keep the same dark color palette and general theme, but I want the interface to look more polished, consistent, and intentional.
>
> Also the UI feels a bit too small at normal browser zoom. Right now I have to use Ctrl+scroll to zoom in, and I don't want users to need that.

**Why:** The first version had 15px base font, mismatched button sizing, and a centered layout that fought long content. Bumping the base to 18px, unifying content width to 780px, restructuring the button row into a primary + secondary layout, and switching to `align-items: flex-start` made the whole app feel substantially more intentional.

---

## 9. Git Setup and Deployment

**What I was trying to do:** Initialize version control, push to GitHub, deploy the Worker and frontend to Cloudflare, and get a live URL for the README.

**Prompt:**
> The project is complete locally and working end-to-end. Now I need to initialize a git repository, push the code to a GitHub repo named with the cf_ai_ prefix, deploy the Worker to Cloudflare, and deploy the frontend to Cloudflare Pages — including setting up the VITE_API_URL environment variable so the production frontend talks to the live Worker.

**Why:** The assignment requires a deployed live link and a public GitHub repo. This involved initializing the git repo with a proper `.gitignore`, pushing to `https://github.com/Darshan2024/cf_ai_voice_interviewer`, deploying the Worker via `wrangler deploy` (fixing the `new_sqlite_classes` migration for the free plan), building the React app with `VITE_API_URL` baked in at build time, and deploying to Cloudflare Pages via `wrangler pages deploy`.

---

<!-- Add new prompts below as the project progresses -->
