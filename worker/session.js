// Durable Object — holds session state across the whole interview
// State shape stored in DO storage:
// {
//   topic: string,
//   questions: string[],       // questions asked so far
//   answers: string[],         // transcripts of user answers
//   feedbacks: object[],       // AI feedback objects { good, missing, ideal }
// }

export class InterviewSession {
  constructor(state) {
    this.state = state
  }

  async fetch(request) {
    const url = new URL(request.url)
    const body = request.method === 'POST' ? await request.json() : {}

    if (url.pathname === '/init') {
      await this.state.storage.put('topic', body.topic)
      await this.state.storage.put('questions', [])
      await this.state.storage.put('answers', [])
      await this.state.storage.put('feedbacks', [])
      return Response.json({ ok: true })
    }

    if (url.pathname === '/get') {
      const [topic, questions, answers, feedbacks] = await Promise.all([
        this.state.storage.get('topic'),
        this.state.storage.get('questions'),
        this.state.storage.get('answers'),
        this.state.storage.get('feedbacks'),
      ])
      return Response.json({ topic, questions, answers, feedbacks })
    }

    if (url.pathname === '/add-question') {
      const questions = (await this.state.storage.get('questions')) ?? []
      questions.push(body.question)
      await this.state.storage.put('questions', questions)
      return Response.json({ ok: true })
    }

    if (url.pathname === '/add-answer') {
      const answers = (await this.state.storage.get('answers')) ?? []
      answers.push(body.answer)
      await this.state.storage.put('answers', answers)
      return Response.json({ ok: true })
    }

    if (url.pathname === '/add-feedback') {
      const feedbacks = (await this.state.storage.get('feedbacks')) ?? []
      feedbacks.push(body.feedback)
      await this.state.storage.put('feedbacks', feedbacks)
      return Response.json({ ok: true })
    }

    return new Response('Not found', { status: 404 })
  }
}
