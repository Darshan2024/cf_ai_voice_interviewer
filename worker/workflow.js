import { WorkflowEntrypoint } from 'cloudflare:workers'

// Prompts live here so they're easy to find for PROMPTS.md documentation
const PROMPTS = {
  generateQuestion: (topic, previousQuestions) => `
You are a senior software engineer conducting a technical interview.
Generate one interview question about: ${topic}.
${previousQuestions.length > 0
    ? `Do NOT repeat any of these already-asked questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : ''}
Return ONLY the question — no preamble, no numbering, no explanation.
`.trim(),

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
}
`.trim(),
}

export class InterviewPipeline extends WorkflowEntrypoint {
  async run(event, step) {
    const { step: action, topic, sessionId } = event.payload

    if (action === 'start') {
      // 1. Init the Durable Object session
      await step.do('init-session', async () => {
        const stub = this.env.SESSION.get(
          this.env.SESSION.idFromName(sessionId)
        )
        await stub.fetch('https://session/init', {
          method: 'POST',
          body: JSON.stringify({ topic }),
        })
      })

      // 2. Generate first question via Workers AI
      const question = await step.do('generate-first-question', async () => {
        const messages = [
          { role: 'user', content: PROMPTS.generateQuestion(topic, []) },
        ]
        const res = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages,
        })
        return res.response.trim()
      })

      // 3. Store question in DO
      await step.do('store-question', async () => {
        const stub = this.env.SESSION.get(
          this.env.SESSION.idFromName(sessionId)
        )
        await stub.fetch('https://session/add-question', {
          method: 'POST',
          body: JSON.stringify({ question }),
        })
      })

      return { sessionId, question }
    }

    if (action === 'evaluate') {
      // 1. Transcribe audio via Workers AI Whisper
      const transcript = await step.do('transcribe', async () => {
        const audioBytes = await audio.arrayBuffer()
        const res = await this.env.AI.run('@cf/openai/whisper', {
          audio: [...new Uint8Array(audioBytes)],
        })
        return res.text.trim()
      })

      // 2. Get current session state to retrieve the latest question
      const sessionData = await step.do('fetch-session', async () => {
        const stub = this.env.SESSION.get(
          this.env.SESSION.idFromName(sessionId)
        )
        const res = await stub.fetch('https://session/get')
        return res.json()
      })

      const currentQuestion =
        sessionData.questions[sessionData.questions.length - 1]

      // 3. Evaluate the answer via Workers AI Llama 3.3
      const feedback = await step.do('evaluate-answer', async () => {
        const messages = [
          {
            role: 'user',
            content: PROMPTS.evaluateAnswer(currentQuestion, transcript),
          },
        ]
        const res = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages,
        })
        try {
          return JSON.parse(res.response)
        } catch {
          // Fallback if model adds extra text around the JSON
          const match = res.response.match(/\{[\s\S]*\}/)
          return match ? JSON.parse(match[0]) : { good: '', missing: '', ideal: res.response }
        }
      })

      // 4. Store answer + feedback in DO
      await step.do('store-result', async () => {
        const stub = this.env.SESSION.get(
          this.env.SESSION.idFromName(sessionId)
        )
        await Promise.all([
          stub.fetch('https://session/add-answer', {
            method: 'POST',
            body: JSON.stringify({ answer: transcript }),
          }),
          stub.fetch('https://session/add-feedback', {
            method: 'POST',
            body: JSON.stringify({ feedback }),
          }),
        ])
      })

      return { transcript, feedback }
    }

    if (action === 'next') {
      // 1. Fetch session to know topic + previous questions
      const sessionData = await step.do('fetch-session', async () => {
        const stub = this.env.SESSION.get(
          this.env.SESSION.idFromName(sessionId)
        )
        const res = await stub.fetch('https://session/get')
        return res.json()
      })

      // 2. Generate a new question (passing previous ones to avoid repeats)
      const question = await step.do('generate-next-question', async () => {
        const messages = [
          {
            role: 'user',
            content: PROMPTS.generateQuestion(
              sessionData.topic,
              sessionData.questions
            ),
          },
        ]
        const res = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages,
        })
        return res.response.trim()
      })

      // 3. Store new question
      await step.do('store-question', async () => {
        const stub = this.env.SESSION.get(
          this.env.SESSION.idFromName(sessionId)
        )
        await stub.fetch('https://session/add-question', {
          method: 'POST',
          body: JSON.stringify({ question }),
        })
      })

      return { question }
    }

    throw new Error(`Unknown step action: ${action}`)
  }
}
