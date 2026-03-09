import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'daily-vibe'

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

function App() {
  const [selectedVibe, setSelectedVibe] = useState(null)

  useEffect(() => {
    const rawVibe = localStorage.getItem(STORAGE_KEY)
    if (!rawVibe) {
      return
    }

    try {
      const parsedVibe = JSON.parse(rawVibe)
      if (parsedVibe.date === getTodayISODate()) {
        setSelectedVibe(parsedVibe)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const selectedDateText = useMemo(() => {
    if (!selectedVibe?.date) {
      return ''
    }

    return new Date(`${selectedVibe.date}T00:00:00`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [selectedVibe])

  function handleVibeSelect(vibe) {
    const vibeForToday = {
      ...vibe,
      date: getTodayISODate(),
    }

    setSelectedVibe(vibeForToday)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vibeForToday))
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
      </section>
    </main>
  )
}

export default App
