# CF AI Voice Interviewer

A voice-based interview prep tool built on Cloudflare's AI stack. Pick a topic, answer interview questions out loud, and get structured AI feedback on what you did well, what was missing, and what a strong answer looks like.

**Live demo:** https://cf-ai-voice-interviewer.pages.dev

---

## What it does

1. Pick a topic — DSA, System Design, or Behavioral
2. The AI generates an interview question
3. Hit record and answer with your voice
4. Your answer is transcribed and evaluated by AI
5. You get structured feedback: what was good, what was missing, and the ideal answer
6. Continue to the next question — session history is tracked throughout

---

## How it satisfies the assignment

| Requirement | Implementation |
|---|---|
| LLM usage | Workers AI — Llama 3.3 70B for question generation and answer evaluation |
| Workflow / coordination | Cloudflare Workflows (`InterviewPipeline`) + Durable Objects orchestrating session state |
| Voice input | Browser `MediaRecorder` API → Workers AI Whisper for transcription |
| Memory / state | Durable Objects store questions asked, transcripts, and feedback across the session |

---

## Tech stack

- **Frontend** — React + Vite, deployed on Cloudflare Pages
- **Backend** — Cloudflare Worker (API layer)
- **AI models** — `@cf/meta/llama-3.3-70b-instruct-fp8-fast` and `@cf/openai/whisper`
- **Session memory** — Durable Objects
- **Orchestration** — Cloudflare Workflows

---

## Running locally

### Prerequisites
- Node.js 18+
- A Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)
- Run `wrangler login` to authenticate

### 1. Clone the repo

```bash
git clone https://github.com/Darshan2024/cf_ai_voice_interviewer.git
cd cf_ai_voice_interviewer
```

### 2. Start the Worker

```bash
cd worker
npm install
npm run dev
```

Worker runs at `http://localhost:8787`

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

The Vite dev server proxies `/api/*` requests to the Worker automatically — no extra config needed.

---

## Deploying

### Deploy the Worker

```bash
cd worker
npx wrangler deploy
```

### Deploy the frontend

```bash
cd frontend
VITE_API_URL=https://cf-ai-interview-prep-worker.<your-subdomain>.workers.dev npm run build
npx wrangler pages deploy dist --project-name cf-ai-voice-interviewer
```

Or push to `main` — Cloudflare Pages will rebuild automatically if the repo is connected.

---

## Project structure

```
cf_ai_voice_interviewer/
├── frontend/                  # React app (Cloudflare Pages)
│   ├── src/
│   │   ├── App.jsx            # State machine + API calls
│   │   ├── components/
│   │   │   ├── TopicSelector.jsx
│   │   │   ├── VoiceRecorder.jsx
│   │   │   └── FeedbackPanel.jsx
│   │   └── index.css
│   └── vite.config.js
├── worker/                    # Cloudflare Worker (API layer)
│   ├── index.js               # Route handlers
│   ├── session.js             # Durable Object (session memory)
│   ├── workflow.js            # Cloudflare Workflow definition
│   └── wrangler.toml
├── PROMPTS.md                 # AI prompts used during development
└── README.md
```
