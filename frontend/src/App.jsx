import { useState } from 'react'
import TopicSelector from './components/TopicSelector'
import VoiceRecorder from './components/VoiceRecorder'
import FeedbackPanel from './components/FeedbackPanel'

// Phases: 'topic' → 'question' → 'recording' → 'evaluating' → 'feedback'

export default function App() {
  const [phase, setPhase] = useState('topic')
  const [topic, setTopic] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [question, setQuestion] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [error, setError] = useState(null)

  async function handleTopicSelect(selectedTopic) {
    setTopic(selectedTopic)
    setError(null)
    setPhase('question') // show loading state

    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic }),
      })
      if (!res.ok) throw new Error('Failed to start session')
      const data = await res.json()
      setSessionId(data.sessionId)
      setQuestion(data.question)
      setQuestionCount(1)
      setPhase('recording')
    } catch (e) {
      setError(e.message)
      setPhase('topic')
    }
  }

  async function handleTranscriptReady(audioBlob) {
    setPhase('evaluating')
    setFeedback(null)
    setTranscript(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'answer.webm')
      formData.append('sessionId', sessionId)

      const res = await fetch('/api/session/evaluate', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Failed to evaluate answer')
      const data = await res.json()
      setTranscript(data.transcript)
      setFeedback(data.feedback)
      setPhase('feedback')
    } catch (e) {
      setError(e.message)
      setPhase('recording')
    }
  }

  async function handleNextQuestion() {
    setFeedback(null)
    setTranscript(null)
    setError(null)
    setPhase('question')

    try {
      const res = await fetch('/api/session/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) throw new Error('Failed to get next question')
      const data = await res.json()
      setQuestion(data.question)
      setQuestionCount((c) => c + 1)
      setPhase('recording')
    } catch (e) {
      setError(e.message)
      setPhase('feedback')
    }
  }

  function handleRetry() {
    setFeedback(null)
    setTranscript(null)
    setError(null)
    setPhase('recording')
  }

  function handleRestart() {
    setPhase('topic')
    setTopic(null)
    setSessionId(null)
    setQuestion(null)
    setTranscript(null)
    setFeedback(null)
    setQuestionCount(0)
    setError(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Interview Prep</h1>
        {topic && (
          <div className="session-info">
            <span className="topic-badge">{topic}</span>
            {questionCount > 0 && (
              <span className="question-count">Q{questionCount}</span>
            )}
          </div>
        )}
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {phase === 'topic' && (
          <TopicSelector onSelect={handleTopicSelect} />
        )}

        {(phase === 'question' || phase === 'recording') && (
          <VoiceRecorder
            question={question}
            loading={phase === 'question'}
            onTranscriptReady={handleTranscriptReady}
            onRestart={handleRestart}
          />
        )}

        {phase === 'evaluating' && (
          <div className="loading-screen">
            <div className="spinner" />
            <p>Evaluating your answer...</p>
          </div>
        )}

        {phase === 'feedback' && (
          <FeedbackPanel
            question={question}
            transcript={transcript}
            feedback={feedback}
            onNext={handleNextQuestion}
            onRetry={handleRetry}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  )
}
