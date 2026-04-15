import { useState, useRef } from 'react'

// Recording states: 'idle' | 'recording' | 'done'

export default function VoiceRecorder({ question, loading, onTranscriptReady, onRestart }) {
  const [recordState, setRecordState] = useState('idle')
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onTranscriptReady(blob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecordState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch {
      alert('Microphone access is required. Please allow it and try again.')
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setRecordState('done')
  }

  function formatDuration(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="voice-recorder loading-screen">
        <div className="spinner" />
        <p>Generating question...</p>
      </div>
    )
  }

  return (
    <div className="voice-recorder">
      <div className="question-box">
        <span className="question-label">Question</span>
        <p className="question-text">{question}</p>
      </div>

      <div className="recorder-controls">
        {recordState === 'idle' && (
          <>
            <p className="recorder-hint">Take a moment, then hit record when ready.</p>
            <button className="record-btn" onClick={startRecording}>
              <span className="record-icon" /> Record Answer
            </button>
            <button className="change-topic-link" onClick={onRestart}>
              Change Topic
            </button>
          </>
        )}

        {recordState === 'recording' && (
          <>
            <div className="recording-indicator">
              <span className="pulse" /> Recording — {formatDuration(duration)}
            </div>
            <button className="stop-btn" onClick={stopRecording}>
              Stop &amp; Submit
            </button>
          </>
        )}

        {recordState === 'done' && (
          <p className="recorder-hint">Processing your answer...</p>
        )}
      </div>
    </div>
  )
}
