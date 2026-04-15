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

<!-- Add new prompts below as the project progresses -->
