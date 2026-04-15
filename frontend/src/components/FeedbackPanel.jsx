export default function FeedbackPanel({ question, transcript, feedback, onNext, onRetry, onRestart }) {
  return (
    <div className="feedback-panel">
      <div className="feedback-question">
        <span className="question-label">Question</span>
        <p>{question}</p>
      </div>

      {transcript && (
        <div className="feedback-section transcript-section">
          <h3>Your Answer</h3>
          <p className="transcript-text">{transcript}</p>
        </div>
      )}

      <div className="feedback-section good-section">
        <h3>What was good</h3>
        <p>{feedback?.good ?? '—'}</p>
      </div>

      <div className="feedback-section missing-section">
        <h3>What was missing</h3>
        <p>{feedback?.missing ?? '—'}</p>
      </div>

      <div className="feedback-section ideal-section">
        <h3>Ideal answer</h3>
        <p>{feedback?.ideal ?? '—'}</p>
      </div>

      <div className="feedback-actions">
        <button className="next-btn" onClick={onNext}>
          Next Question
        </button>
        <div className="secondary-actions">
          <button className="retry-btn" onClick={onRetry}>
            Try Again
          </button>
          <button className="restart-btn" onClick={onRestart}>
            Change Topic
          </button>
        </div>
      </div>
    </div>
  )
}
