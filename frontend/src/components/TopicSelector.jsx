const TOPICS = [
  {
    id: 'DSA',
    label: 'Data Structures & Algorithms',
    description: 'Arrays, trees, graphs, sorting, dynamic programming',
  },
  {
    id: 'System Design',
    label: 'System Design',
    description: 'Scalability, databases, APIs, distributed systems',
  },
  {
    id: 'Behavioral',
    label: 'Behavioral',
    description: 'STAR method, teamwork, conflict resolution, growth',
  },
]

export default function TopicSelector({ onSelect }) {
  return (
    <div className="topic-selector">
      <h2>What do you want to practice?</h2>
      <p className="subtitle">Pick a topic and the AI will ask you questions. Answer with your voice.</p>
      <div className="topic-grid">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            className="topic-card"
            onClick={() => onSelect(t.id)}
          >
            <span className="topic-label">{t.label}</span>
            <span className="topic-desc">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
