import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'daily-vibe'
const HISTORY_STORAGE_KEY = 'vibe-history'

const VIBES = [
  { emoji: '😀', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '⚡', label: 'Energetic' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😴', label: 'Sleepy' },
]

function getTodayISODate() {
  return new Date().toISOString().split('T')[0]
}

function getFormattedDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getSavedHistory() {
  const rawHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
  if (!rawHistory) {
    return []
  }

  try {
    const parsedHistory = JSON.parse(rawHistory)
    if (!Array.isArray(parsedHistory)) {
      return []
    }

    return parsedHistory.filter((entry) => entry?.date && entry?.emoji && entry?.label)
  } catch {
    localStorage.removeItem(HISTORY_STORAGE_KEY)
    return []
  }
}

function App() {
  const [selectedVibe, setSelectedVibe] = useState(null)
  const [vibeHistory, setVibeHistory] = useState([])

  const todayDate = getTodayISODate()

  useEffect(() => {
    setVibeHistory(getSavedHistory())

    const rawVibe = localStorage.getItem(STORAGE_KEY)
    if (!rawVibe) {
      return
    }

    try {
      const parsedVibe = JSON.parse(rawVibe)
      if (parsedVibe.date === todayDate) {
        setSelectedVibe(parsedVibe)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [todayDate])

  const selectedDateText = useMemo(() => {
    if (!selectedVibe?.date) {
      return ''
    }

    return getFormattedDate(selectedVibe.date)
  }, [selectedVibe])

  const recentHistory = useMemo(() => {
    return [...vibeHistory]
      .sort((first, second) => second.date.localeCompare(first.date))
      .slice(0, 7)
  }, [vibeHistory])

  function handleVibeSelect(vibe) {
    const vibeForToday = {
      ...vibe,
      date: todayDate,
    }

    setSelectedVibe(vibeForToday)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vibeForToday))

    const updatedHistory = [
      vibeForToday,
      ...vibeHistory.filter((entry) => entry.date !== todayDate),
    ]
    setVibeHistory(updatedHistory)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
  }

  function handleResetVibe() {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedVibe(null)
  }

  return (
    <main className="app-shell">
      <section className="vibe-card">
        <p className="eyebrow">Daily Mood Tracker</p>
        <h1>How are you feeling today?</h1>

        <div className="vibe-grid" role="list" aria-label="Available vibes">
          {VIBES.map((vibe) => {
            const isSelected = selectedVibe?.emoji === vibe.emoji
            return (
              <button
                key={vibe.emoji}
                type="button"
                className={`vibe-button ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleVibeSelect(vibe)}
                aria-pressed={isSelected}
              >
                <span className="emoji" aria-hidden="true">
                  {vibe.emoji}
                </span>
                <span className="label">{vibe.label}</span>
              </button>
            )
          })}
        </div>

        <div className="status-box" aria-live="polite">
          {selectedVibe ? (
            <p>
              Selected mood: <strong>{selectedVibe.emoji}</strong> {selectedVibe.label} on{' '}
              <strong>{selectedDateText}</strong>
            </p>
          ) : (
            <p>No vibe selected yet for today.</p>
          )}
        </div>

        <button type="button" className="reset-button" onClick={handleResetVibe}>
          Reset Vibe
        </button>

        <div className="history-box">
          <h2>Recent mood dates</h2>
          {recentHistory.length > 0 ? (
            <ul>
              {recentHistory.map((entry) => (
                <li key={entry.date}>
                  <span>
                    {entry.emoji} {entry.label}
                  </span>
                  <span>{getFormattedDate(entry.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent mood history yet.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
