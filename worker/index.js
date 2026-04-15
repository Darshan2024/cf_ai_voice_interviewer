import { InterviewSession } from './session.js'
import { InterviewPipeline } from './workflow.js'

export { InterviewSession, InterviewPipeline }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Prompts centralised here for PROMPTS.md documentation
const PROMPTS = {
  generateQuestion: (topic, previousQuestions) =>
    [
      'You are a senior software engineer conducting a technical interview.',
      `Generate one interview question about: ${topic}.`,
      previousQuestions.length > 0
        ? `Do NOT repeat any of these already-asked questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
        : '',
      'Return ONLY the question — no preamble, no numbering, no explanation.',
    ]
      .filter(Boolean)
      .join('\n'),

  evaluateAnswer: (question, transcript) => `
You are an experienced software engineering interviewer.
Evaluate the following interview answer.

Question: ${question}
Candidate's answer: ${transcript}

Respond with a JSON object (no markdown, raw JSON only):
{
  "good": "1-2 sentences on what the candidate did well",
  "missing": "1-2 sentences on what was missing or could be stronger",
  "ideal": "2-3 sentences describing what a strong answer would include"
}`.trim(),
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function err(message, status = 400) {
  return json({ error: message }, status)
}

function sessionStub(env, sessionId) {
  return env.SESSION.get(env.SESSION.idFromName(sessionId))
}

async function doFetch(stub, path, body) {
  const res = await stub.fetch(`https://do${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function generateQuestion(env, topic, previousQuestions) {
  const res = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: PROMPTS.generateQuestion(topic, previousQuestions) }],
  })
  return res.response.trim()
}

async function evaluateAnswer(env, question, transcript) {
  const res = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: PROMPTS.evaluateAnswer(question, transcript) }],
  })
  // res.response can be a string (JSON) or an already-parsed object depending on the model
  const candidate = res?.response

  if (candidate && typeof candidate === 'object') {
    // Already parsed — return directly if it has the right shape
    if (candidate.good !== undefined) return candidate
    // Unexpected object shape — fall through to string path
  }

  const raw = typeof candidate === 'string' ? candidate : JSON.stringify(res)
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    return match
      ? JSON.parse(match[0])
      : { good: null, missing: null, ideal: raw }
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    const url = new URL(request.url)

    // ── POST /api/session/start ─────────────────────────────────────────────
    // Creates a new DO session, generates the first question, returns both.
    if (url.pathname === '/api/session/start' && request.method === 'POST') {
      const { topic } = await request.json()
      if (!topic) return err('topic is required')

      const sessionId = crypto.randomUUID()
      const stub = sessionStub(env, sessionId)

      await doFetch(stub, '/init', { topic })
      const question = await generateQuestion(env, topic, [])
      await doFetch(stub, '/add-question', { question })

      return json({ sessionId, question })
    }

    // ── POST /api/session/evaluate ──────────────────────────────────────────
    // Transcribes the audio blob, evaluates the answer, stores results in DO.
    if (url.pathname === '/api/session/evaluate' && request.method === 'POST') {
      const form = await request.formData()
      const audio = form.get('audio')
      const sessionId = form.get('sessionId')
      if (!audio || !sessionId) return err('audio and sessionId are required')

      // Transcribe via Whisper
      const audioBytes = await audio.arrayBuffer()
      const whisperRes = await env.AI.run('@cf/openai/whisper', {
        audio: [...new Uint8Array(audioBytes)],
      })
      const transcript = whisperRes.text.trim()

      // Get the current question from DO
      const session = await doFetch(sessionStub(env, sessionId), '/get')
      const currentQuestion = session.questions[session.questions.length - 1]

      // Evaluate with Llama
      const feedback = await evaluateAnswer(env, currentQuestion, transcript)

      // Persist answer + feedback
      const stub = sessionStub(env, sessionId)
      await Promise.all([
        doFetch(stub, '/add-answer', { answer: transcript }),
        doFetch(stub, '/add-feedback', { feedback }),
      ])

      return json({ transcript, feedback })
    }

    // ── POST /api/session/next ──────────────────────────────────────────────
    // Fetches session history, generates the next non-repeated question.
    if (url.pathname === '/api/session/next' && request.method === 'POST') {
      const { sessionId } = await request.json()
      if (!sessionId) return err('sessionId is required')

      const session = await doFetch(sessionStub(env, sessionId), '/get')
      const question = await generateQuestion(env, session.topic, session.questions)
      await doFetch(sessionStub(env, sessionId), '/add-question', { question })

      return json({ question })
    }

    return err('Not found', 404)
  },
}
