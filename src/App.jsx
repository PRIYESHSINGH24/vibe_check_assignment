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

function upsertHistoryEntry(history, entry) {
  return [entry, ...history.filter((item) => item.date !== entry.date)]
}

function getDateDifferenceInDays(firstDate, secondDate) {
  const first = new Date(`${firstDate}T00:00:00`)
  const second = new Date(`${secondDate}T00:00:00`)
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.round((first - second) / millisecondsPerDay)
}

function getCurrentStreak(entries) {
  if (entries.length === 0) {
    return 0
  }

  const sortedUniqueDates = [...new Set(entries.map((entry) => entry.date))].sort((a, b) =>
    b.localeCompare(a),
  )

  let streak = 1
  for (let index = 1; index < sortedUniqueDates.length; index += 1) {
    const difference = getDateDifferenceInDays(sortedUniqueDates[index - 1], sortedUniqueDates[index])
    if (difference === 1) {
      streak += 1
    } else {
      break
    }
  }

  return streak
}

function App() {
  const [selectedVibe, setSelectedVibe] = useState(null)
  const [vibeHistory, setVibeHistory] = useState([])
  const [noteInput, setNoteInput] = useState('')
  const [timeFilterDays, setTimeFilterDays] = useState('7')
  const [moodFilter, setMoodFilter] = useState('all')

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
        setNoteInput(parsedVibe.note ?? '')
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
    const sorted = [...vibeHistory].sort((first, second) => second.date.localeCompare(first.date))
    const filterByDays = Number(timeFilterDays)

    const filteredByTime = Number.isNaN(filterByDays)
      ? sorted
      : sorted.filter((entry) => getDateDifferenceInDays(todayDate, entry.date) < filterByDays)

    const filteredByMood =
      moodFilter === 'all'
        ? filteredByTime
        : filteredByTime.filter((entry) => entry.label.toLowerCase() === moodFilter)

    return filteredByMood.slice(0, 10)
  }, [moodFilter, timeFilterDays, todayDate, vibeHistory])

  const stats = useMemo(() => {
    const totalEntries = vibeHistory.length
    const streak = getCurrentStreak(vibeHistory)
    const moodCount = vibeHistory.reduce((accumulator, entry) => {
      const nextValue = (accumulator[entry.label] ?? 0) + 1
      return {
        ...accumulator,
        [entry.label]: nextValue,
      }
    }, {})

    let topMood = 'None'
    let topMoodCount = 0
    Object.entries(moodCount).forEach(([mood, count]) => {
      if (count > topMoodCount) {
        topMood = mood
        topMoodCount = count
      }
    })

    return {
      totalEntries,
      streak,
      topMood,
    }
  }, [vibeHistory])

  function handleVibeSelect(vibe) {
    const vibeForToday = {
      ...vibe,
      date: todayDate,
      note: noteInput.trim(),
    }

    setSelectedVibe(vibeForToday)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vibeForToday))

    const updatedHistory = upsertHistoryEntry(vibeHistory, vibeForToday)
    setVibeHistory(updatedHistory)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
  }

  function handleSaveDetails() {
    if (!selectedVibe) {
      return
    }

    const updatedTodayVibe = {
      ...selectedVibe,
      note: noteInput.trim(),
    }

    setSelectedVibe(updatedTodayVibe)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTodayVibe))

    const updatedHistory = upsertHistoryEntry(vibeHistory, updatedTodayVibe)
    setVibeHistory(updatedHistory)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
  }

  function handleSurpriseVibe() {
    const randomIndex = Math.floor(Math.random() * VIBES.length)
    handleVibeSelect(VIBES[randomIndex])
  }

  function handleResetVibe() {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedVibe(null)
    setNoteInput('')
  }

  function handleClearHistory() {
    localStorage.removeItem(HISTORY_STORAGE_KEY)
    setVibeHistory([])
  }

  return (
    <main className="app-shell">
      <section className="vibe-card">
        <header className="hero">
          <div className="cute-parade" aria-hidden="true">
            <span>🧸</span>
            <span>🐰</span>
            <span>✨</span>
            <span>🌸</span>
          </div>
          <p className="eyebrow">Daily Mood Tracker</p>
          <h1>How are you feeling today?</h1>
          <p className="subcopy">Pick a vibe, add a quick note, and track your emotional pattern.</p>
        </header>

        <section className="mascot-box" aria-label="Mood buddy">
          <div className="teddy" aria-hidden="true">
            <span className="ear left" />
            <span className="ear right" />
            <span className="face">
              <span className="eye left" />
              <span className="eye right" />
              <span className="nose" />
            </span>
          </div>
          <div className="mascot-copy">
            <p className="mascot-title">Your Mood Buddy</p>
            <p>"You are doing amazing today, keep smiling."</p>
          </div>
          <div className="sparkles" aria-hidden="true">
            <span>💖</span>
            <span>⭐</span>
            <span>🫧</span>
          </div>
        </section>

        <div className="single-page-grid">
          <div className="left-column">
            <div className="vibe-grid" role="list" aria-label="Available vibes">
              {VIBES.map((vibe, index) => {
                const isSelected = selectedVibe?.emoji === vibe.emoji
                return (
                  <button
                    key={vibe.emoji}
                    type="button"
                    className={`vibe-button ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleVibeSelect(vibe)}
                    aria-pressed={isSelected}
                    style={{ '--stagger': index }}
                  >
                    <span className="emoji" aria-hidden="true">
                      {vibe.emoji}
                    </span>
                    <span className="label">{vibe.label}</span>
                    <span className="sticker" aria-hidden="true">
                      {isSelected ? '💘' : '🍬'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="status-box" aria-live="polite">
              {selectedVibe ? (
                <>
                  <p>
                    Selected mood: <strong>{selectedVibe.emoji}</strong> {selectedVibe.label} on{' '}
                    <strong>{selectedDateText}</strong>
                  </p>
                  {selectedVibe.note ? <p className="note-preview">Details: {selectedVibe.note}</p> : null}
                </>
              ) : (
                <p>No vibe selected yet for today.</p>
              )}
            </div>

            <div className="details-box">
              <label htmlFor="mood-note">Add details (what happened today?)</label>
              <textarea
                id="mood-note"
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
                placeholder="Example: Productive morning, great workout, feeling balanced."
                rows={3}
              />
              <button type="button" className="secondary-button" onClick={handleSaveDetails}>
                Save Details
              </button>
            </div>

            <div className="actions-row">
              <button type="button" className="secondary-button" onClick={handleSurpriseVibe}>
                Surprise Me
              </button>
              <button type="button" className="reset-button" onClick={handleResetVibe}>
                Reset Today
              </button>
              <button type="button" className="danger-button" onClick={handleClearHistory}>
                Clear History
              </button>
            </div>
          </div>

          <div className="right-column">
            <section className="stats-grid" aria-label="Mood insights">
              <article>
                <p className="stat-label">Current streak</p>
                <p className="stat-value">{stats.streak} day(s)</p>
              </article>
              <article>
                <p className="stat-label">Top mood</p>
                <p className="stat-value">{stats.topMood}</p>
              </article>
              <article>
                <p className="stat-label">Total tracked</p>
                <p className="stat-value">{stats.totalEntries}</p>
              </article>
            </section>

            <div className="history-box">
              <div className="history-header">
                <h2>Recent mood dates</h2>
                <div className="filters">
                  <label htmlFor="time-filter">Range</label>
                  <select
                    id="time-filter"
                    value={timeFilterDays}
                    onChange={(event) => setTimeFilterDays(event.target.value)}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="365">Last year</option>
                  </select>

                  <label htmlFor="mood-filter">Mood</label>
                  <select
                    id="mood-filter"
                    value={moodFilter}
                    onChange={(event) => setMoodFilter(event.target.value)}
                  >
                    <option value="all">All</option>
                    {VIBES.map((vibe) => (
                      <option key={vibe.label} value={vibe.label.toLowerCase()}>
                        {vibe.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {recentHistory.length > 0 ? (
                <ul>
                  {recentHistory.map((entry) => (
                    <li key={entry.date}>
                      <span className="history-mood">
                        {entry.emoji} {entry.label}
                        {entry.note ? <small>{entry.note}</small> : null}
                      </span>
                      <span className="history-date">{getFormattedDate(entry.date)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent mood history yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
